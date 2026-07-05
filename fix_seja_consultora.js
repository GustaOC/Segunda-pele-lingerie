const fs = require('fs');
let content = fs.readFileSync('app/seja-consultora/page.tsx', 'utf8');

const regex = /\{\/\* Botão WhatsApp fixo \*\/\}.*?<Link.*?<\/Link>/gs;
content = content.replace(regex, '');

fs.writeFileSync('app/seja-consultora/page.tsx', content);
console.log("Removed duplicate WhatsApp button");
