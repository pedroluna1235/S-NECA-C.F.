import { supabase } from './supabase';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

function sanitizeOklchColors(clonedDoc: Document) {
  const canvas = clonedDoc.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');

  const convertColor = (val: string, fallback: string = '#000000'): string => {
    if (!val || !val.includes('oklch')) return val;
    if (ctx) {
      try {
        ctx.fillStyle = '#000000';
        ctx.fillStyle = val;
        return ctx.fillStyle;
      } catch {
        // ignore
      }
    }
    return fallback;
  };

  const allElements = clonedDoc.querySelectorAll('*');
  const win = clonedDoc.defaultView || window;
  const colorProps = [
    'color',
    'background-color',
    'border-top-color',
    'border-right-color',
    'border-bottom-color',
    'border-left-color',
    'outline-color',
    'text-decoration-color'
  ];

  allElements.forEach((el) => {
    const htmlEl = el as HTMLElement;
    try {
      const computed = win.getComputedStyle(htmlEl);
      if (computed) {
        colorProps.forEach((prop) => {
          const val = computed.getPropertyValue(prop);
          if (val && val.includes('oklch')) {
            const fallback = prop.includes('background') ? '#ffffff' : '#000000';
            const converted = convertColor(val, fallback);
            htmlEl.style.setProperty(prop, converted, 'important');
          }
        });
      }
    } catch {
      // ignore
    }
  });
}

export async function generateAndUploadPDF(elementId: string, filename: string): Promise<string> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id ${elementId} not found`);
  }

  const parent = element.parentElement;
  const nextSibling = element.nextSibling;
  document.body.appendChild(element);

  const originalStyles = { 
    position: element.style.position, 
    top: element.style.top, 
    left: element.style.left, 
    zIndex: element.style.zIndex, 
    display: element.style.display,
    height: element.style.height,
    overflow: element.style.overflow
  };
  element.style.position = 'absolute';
  element.style.top = '0';
  element.style.left = '0';
  element.style.zIndex = '-9999';
  element.style.display = 'block';
  element.style.height = 'max-content';
  element.style.overflow = 'visible';

  try {
    const pageElements = Array.from(element.querySelectorAll<HTMLElement>('.pdf-page'));
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    if (pageElements.length > 0) {
      // Modo paginado: renderiza cada página de forma independiente evitando cortes
      for (let i = 0; i < pageElements.length; i++) {
        if (i > 0) {
          pdf.addPage();
        }

        // Asegurar que solo la página actual está visible durante la captura para evitar bugs de scroll/offset
        pageElements.forEach((p, idx) => {
          p.style.display = idx === i ? 'flex' : 'none';
        });

        const pageEl = pageElements[i];
        const canvas = await html2canvas(pageEl, {
          scale: 2, // Mayor calidad
          useCORS: true, // Permitir imágenes de otros dominios
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: 800,
          windowHeight: 1131,
          width: 800,
          height: 1131,
          scrollY: 0,
          scrollX: 0,
          onclone: (clonedDoc) => sanitizeOklchColors(clonedDoc)
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.98);
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      }
    } else {
      // Fallback para elementos sin páginas explícitas
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
        width: element.scrollWidth,
        height: element.scrollHeight,
        scrollY: 0,
        scrollX: 0,
        onclone: (clonedDoc) => sanitizeOklchColors(clonedDoc)
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = position - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
    }

    // Obtener blob
    const pdfBlob = pdf.output('blob');

    // Subir a Supabase Storage
    const safeFilename = `${Date.now()}_${filename.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
    const filePath = `sesiones/${safeFilename}`;

    const { error: uploadError } = await supabase.storage
      .from('PDF_SESIONES')
      .upload(filePath, pdfBlob, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('PDF_SESIONES')
      .getPublicUrl(filePath);

    return publicUrl;
  } finally {
    // Restaurar display en páginas
    const pageElements = element.querySelectorAll<HTMLElement>('.pdf-page');
    pageElements.forEach(p => {
      p.style.display = 'flex';
    });

    // Restaurar display original
    Object.assign(element.style, originalStyles);
    if (parent) {
      if (nextSibling) {
        parent.insertBefore(element, nextSibling);
      } else {
        parent.appendChild(element);
      }
    }
  }
}
