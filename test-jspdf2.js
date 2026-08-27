import { jsPDF } from 'jspdf';
const doc = new jsPDF();
try {
  doc.setFont("helvetica", "italic");
  doc.text("test", 10, 10);
  console.log('Success italic');
} catch (e) {
  console.error('Error:', e);
}
