import { supabase } from './supabase';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export async function generateAndUploadPDF(elementId: string, filename: string): Promise<string> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id ${elementId} not found`);
  }

  // Hacer el elemento visible temporalmente si estaba oculto con display: none
  // Asumimos que se usa un contenedor fuera de pantalla en lugar de display:none
  // pero por si acaso, lo forzamos.
  const originalDisplay = element.style.display;
  element.style.display = 'block';

  try {
    const canvas = await html2canvas(element, {
      scale: 2, // Mayor calidad
      useCORS: true, // Permitir imágenes de otros dominios
      logging: false
    });

    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    
    // Calcular tamaño para A4
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

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
    element.style.display = originalDisplay;
  }
}
