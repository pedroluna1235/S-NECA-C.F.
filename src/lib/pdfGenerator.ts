import { supabase } from './supabase';
import { toPng } from 'html-to-image';
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

async function captureElementImage(target: HTMLElement): Promise<string> {
  // 1. Intentar toPng (html-to-image): utiliza el motor nativo del navegador,
  // respeta al 100% Flexbox, CSS Grid, fuentes y estilos inline/Tailwind sin problemas de iframe.
  try {
    const dataUrl = await toPng(target, {
      quality: 1,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      cacheBust: false,
      style: {
        display: 'flex',
        visibility: 'visible',
        position: 'static',
        transform: 'none',
        margin: '0',
      }
    });
    return dataUrl;
  } catch (toPngErr) {
    console.warn('toPng failed, falling back to html2canvas', toPngErr);
    const canvas = await html2canvas(target, {
      scale: 2,
      useCORS: true,
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
    return canvas.toDataURL('image/jpeg', 0.98);
  }
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
    // Asegurar que las fuentes y las imágenes estén completamente cargadas antes de capturar
    if (document.fonts) {
      try {
        await document.fonts.ready;
      } catch {
        // ignore
      }
    }
    const allImages = Array.from(element.querySelectorAll('img'));
    await Promise.all(
      allImages.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      })
    );

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

        // Asegurar que solo la página actual está visible durante la captura
        pageElements.forEach((p, idx) => {
          p.style.display = idx === i ? 'flex' : 'none';
        });

        const pageEl = pageElements[i];
        const imgData = await captureElementImage(pageEl);
        const format = imgData.startsWith('data:image/png') ? 'PNG' : 'JPEG';

        pdf.addImage(imgData, format, 0, 0, pdfWidth, pdfHeight);
      }
    } else {
      // Fallback para elementos sin páginas explícitas
      const imgData = await captureElementImage(element);
      const format = imgData.startsWith('data:image/png') ? 'PNG' : 'JPEG';
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, format, 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = position - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, format, 0, position, pdfWidth, imgHeight);
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
