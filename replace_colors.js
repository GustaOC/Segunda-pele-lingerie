const fs = require('fs');
const path = require('path');

const DIRECTORIES = ['./app', './components'];
const EXTENSIONS = ['.tsx', '.ts'];

const REPLACEMENTS = [
  // #5D3A5B replacements
  { regex: /bg-\[\#5D3A5B\]/g, replacement: 'bg-brand-plum' },
  { regex: /text-\[\#5D3A5B\]/g, replacement: 'text-brand-plum' },
  { regex: /border-\[\#5D3A5B\]/g, replacement: 'border-brand-plum' },
  { regex: /fill-\[\#5D3A5B\]/g, replacement: 'fill-brand-plum' },
  { regex: /ring-\[\#5D3A5B\]/g, replacement: 'ring-brand-plum' },
  { regex: /from-\[\#5D3A5B\]/g, replacement: 'from-brand-plum' },
  { regex: /to-\[\#5D3A5B\]/g, replacement: 'to-brand-plum' },
  { regex: /via-\[\#5D3A5B\]/g, replacement: 'via-brand-plum' },
  { regex: /group-hover\:text-\[\#5D3A5B\]/g, replacement: 'group-hover:text-brand-plum' },
  { regex: /group-hover\:bg-\[\#5D3A5B\]/g, replacement: 'group-hover:bg-brand-plum' },
  { regex: /hover\:text-\[\#5D3A5B\]/g, replacement: 'hover:text-brand-plum' },
  { regex: /hover\:border-\[\#5D3A5B\]/g, replacement: 'hover:border-brand-plum' },
  
  // #4A2E49 (hover state for #5D3A5B) replacements
  { regex: /hover\:bg-\[\#4A2E49\]/g, replacement: 'hover:bg-brand-rose' },
  
  // pink-500 replacements
  { regex: /bg-pink-500/g, replacement: 'bg-brand-rose' },
  { regex: /text-pink-500/g, replacement: 'text-brand-rose' },
  { regex: /border-pink-500/g, replacement: 'border-brand-rose' },
  { regex: /from-pink-500/g, replacement: 'from-brand-rose' },
  { regex: /to-pink-500/g, replacement: 'to-brand-rose' },
  { regex: /via-pink-500/g, replacement: 'via-brand-rose' },
  { regex: /ring-pink-500/g, replacement: 'ring-brand-rose' },
  { regex: /hover\:text-pink-500/g, replacement: 'hover:text-brand-rose' },
  
  // pink-600 replacements
  { regex: /bg-pink-600/g, replacement: 'bg-brand-brown' },
  { regex: /text-pink-600/g, replacement: 'text-brand-brown' },
  { regex: /border-pink-600/g, replacement: 'border-brand-brown' },
  { regex: /hover\:bg-pink-600/g, replacement: 'hover:bg-brand-brown' },
  { regex: /hover\:text-pink-600/g, replacement: 'hover:text-brand-brown' },
  
  // pink-50 replacements
  { regex: /bg-pink-50/g, replacement: 'bg-brand-peach' },
  { regex: /text-pink-50/g, replacement: 'text-brand-peach' },
  { regex: /border-pink-50/g, replacement: 'border-brand-peach' },
  { regex: /hover\:bg-pink-50/g, replacement: 'hover:bg-brand-peach/80' },
  { regex: /bg-pink-50\/50/g, replacement: 'bg-brand-peach/50' },
  { regex: /bg-pink-50\/30/g, replacement: 'bg-brand-peach/30' },
  
  // pink-100 replacements
  { regex: /bg-pink-100/g, replacement: 'bg-brand-peach' },
  { regex: /text-pink-100/g, replacement: 'text-brand-peach' },
  { regex: /border-pink-100/g, replacement: 'border-brand-peach' }
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (stat.isFile() && EXTENSIONS.includes(path.extname(filePath))) {
      processFile(filePath);
    }
  }
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  
  for (const rep of REPLACEMENTS) {
    content = content.replace(rep.regex, rep.replacement);
  }
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

for (const dir of DIRECTORIES) {
  if (fs.existsSync(dir)) {
    processDirectory(dir);
  }
}

console.log("Color replacement complete.");
