import { supabase } from './supabase';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

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
    display: element.style.display 
  };
  element.style.position = 'absolute';
  element.style.top = '0';
  element.style.left = '0';
  element.style.zIndex = '-9999';
  element.style.display = 'block';

  try {
    const canvas = await html2canvas(element, {
      scale: 2, // Mayor calidad
      useCORS: true, // Permitir imágenes de otros dominios
      logging: false,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      width: element.scrollWidth,
      height: element.scrollHeight
    });

    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    
    // Calcular tamaño para A4
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;
    
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = position - pageHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pageHeight;
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
    // Restaurar display
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
