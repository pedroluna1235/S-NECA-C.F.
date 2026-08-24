const fs = require('fs');
const file = 'src/lib/pdfGenerator.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  "const originalStyles = {",
  `const parent = element.parentElement;
  const nextSibling = element.nextSibling;
  document.body.appendChild(element);

  const originalStyles = {`
);

code = code.replace(
  "Object.assign(element.style, originalStyles);",
  `Object.assign(element.style, originalStyles);
    if (parent) {
      if (nextSibling) {
        parent.insertBefore(element, nextSibling);
      } else {
        parent.appendChild(element);
      }
    }`
);

fs.writeFileSync(file, code);
