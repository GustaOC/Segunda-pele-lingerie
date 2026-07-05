const fs = require('fs');

const file = 'app/produto/[id]/page.tsx';
if (!fs.existsSync(file)) return;
let content = fs.readFileSync(file, 'utf8');
let original = content;

// 1. Update query
content = content.replace(/\.from\('products'\)\.select\('\*'\)\.eq\('id', id\)/g, ".from('products').select('*, inventory(quantity, size, color)').eq('id', id)");

// 2. Add function to check stock
// We can insert this right before the return statement inside the component.
// But we need to use it in the JSX, so placing it after hooks is fine.
const stockCheckFunc = `
  const isVariationInStock = (colorName, sizeName) => {
    if (!product || !product.inventory) return false;
    const items = product.inventory.filter(i => 
      (!colorName || i.color.toLowerCase() === colorName.toLowerCase()) && 
      (!sizeName || i.size === sizeName)
    );
    const qty = items.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
    return qty > 0;
  }
`;

content = content.replace(/if \(!product\) return null/, `${stockCheckFunc}\n\n  if (!product) return null`);

// 3. Update the color buttons to disable if out of stock
// Wait, a color might be out of stock in ALL sizes, or just some.
// Let's just grey out if out of stock in ALL sizes for that color.
const oldColorBtn = /<button\s+key=\{index\}\s+onClick=\{\(\) => \{\s+setSelectedColor\(color\)/g;
const newColorBtn = `<button
                      key={index}
                      disabled={!isVariationInStock(color.name, null)}
                      onClick={() => {
                        setSelectedColor(color)`;
// But I need to also apply disabled styles
content = content.replace(oldColorBtn, newColorBtn);
content = content.replace(
  /className=\{`relative w-10 h-10 rounded-full border-2 transition-all group flex items-center justify-center \$\{selectedColor\?\.hex === color\.hex \? "border-brand-plum scale-110 shadow-md" : "border-slate-200 hover:border-slate-300"\}`\}/g,
  `className={\`relative w-10 h-10 rounded-full border-2 transition-all group flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed \${selectedColor?.hex === color.hex ? "border-brand-plum scale-110 shadow-md" : "border-slate-200 hover:border-slate-300"}\`}`
);

// 4. Update the size buttons to disable if out of stock
const oldSizeBtn = /<button\s+key=\{size\}\s+onClick=\{\(\) => setSelectedSize\(size\)\}/g;
const newSizeBtn = `<button
                    key={size}
                    disabled={selectedColor && !isVariationInStock(selectedColor.name, size)}
                    onClick={() => setSelectedSize(size)}`;
content = content.replace(oldSizeBtn, newSizeBtn);
content = content.replace(
  /className=\{`w-12 h-12 rounded-full flex items-center justify-center text-base font-medium transition-all \$\{selectedSize === size \? "bg-brand-plum text-white shadow-lg scale-110" : "bg-slate-100 text-slate-600 hover:bg-slate-200"\}`\}/g,
  `className={\`w-12 h-12 rounded-full flex items-center justify-center text-base font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed \${selectedSize === size ? "bg-brand-plum text-white shadow-lg scale-110" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}\`}`
);

// 5. Update the Adicionar ao Carrinho button
// Find <Button size="lg" onClick={handleAddToCart}
// Replace the whole button block to check if current variation is in stock
const oldCartBtn = /<Button\s+size="lg"\s+onClick=\{handleAddToCart\}\s+className=\{`w-full rounded-2xl h-14 text-base shadow-lg transition-all \$\{added \? "bg-green-500 hover:bg-green-600" : "bg-brand-plum hover:bg-brand-rose"\}`\}\s+>\s+\{added \? "Adicionado ao Carrinho! ✓" : "Adicionar ao Carrinho"\}\s+<\/Button>/g;

const newCartBtn = `{(() => {
              const inStock = selectedColor && selectedSize ? isVariationInStock(selectedColor.name, selectedSize) : false;
              const hasAnyStock = (product.inventory || []).reduce((a, c) => a + (c.quantity || 0), 0) > 0;
              
              if (!hasAnyStock) {
                return (
                  <Button size="lg" disabled className="w-full rounded-2xl h-14 text-base shadow-lg transition-all bg-slate-300 text-slate-500 cursor-not-allowed">
                    Esgotado
                  </Button>
                )
              }
              
              return (
                <Button 
                  size="lg" 
                  onClick={handleAddToCart}
                  disabled={!inStock}
                  className={\`w-full rounded-2xl h-14 text-base shadow-lg transition-all \${added ? "bg-green-500 hover:bg-green-600" : (inStock ? "bg-brand-plum hover:bg-brand-rose" : "bg-slate-300 text-slate-500")}\`}
                >
                  {added ? "Adicionado ao Carrinho! ✓" : (inStock ? "Adicionar ao Carrinho" : "Variação Esgotada")}
                </Button>
              )
            })()}`;

content = content.replace(oldCartBtn, newCartBtn);

if (content !== original) {
  fs.writeFileSync(file, content);
  console.log(`Updated ${file}`);
}
