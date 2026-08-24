const fs = require('fs');
const file = 'src/lib/pdfGenerator.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  "const originalDisplay = element.style.display;",
  "const originalStyles = { position: element.style.position, top: element.style.top, left: element.style.left, zIndex: element.style.zIndex, display: element.style.display };\n  element.style.position = 'absolute';\n  element.style.top = '0';\n  element.style.left = '0';\n  element.style.zIndex = '-9999';"
);

code = code.replace(
  "element.style.display = 'block';",
  "element.style.display = 'block';" // already there, but we just override the above
);

code = code.replace(
  "element.style.display = originalDisplay;",
  "Object.assign(element.style, originalStyles);"
);

fs.writeFileSync(file, code);
