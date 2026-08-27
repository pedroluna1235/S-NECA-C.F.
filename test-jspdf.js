import { jsPDF } from 'jspdf';
const doc = new jsPDF();
try {
  doc.addImage('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'PNG', 0, 0, 10, 10);
  console.log('Success');
} catch (e) {
  console.error('Error:', e);
}
