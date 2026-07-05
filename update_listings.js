const fs = require('fs');

const files = [
  'app/page.tsx',
  'app/destaques/page.tsx',
  'app/promocoes/page.tsx',
  'app/categoria/[slug]/page.tsx',
  'app/area-promotora/kits/page.tsx',
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // 1. Update the query to include inventory(quantity)
  content = content.replace(/\.from\('products'\)\s*\n\s*\.select\('\*'\)/g, ".from('products')\n        .select('*, inventory(quantity)')");

  // In area-promotora/kits, it might be inline: supabase.from('products').select('*')
  content = content.replace(/\.from\('products'\)\.select\('\*'\)/g, ".from('products').select('*, inventory(quantity)')");

  // 2. Add Esgotado overlay
  const esgotadoCenter = `
                  {(() => {
                    const totalQty = (product.inventory || []).reduce((acc, curr) => acc + (curr.quantity || 0), 0);
                    if (totalQty <= 0) {
                      return (
                        <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-20 flex items-center justify-center">
                          <span className="bg-slate-900 text-white text-sm font-bold px-6 py-2 rounded-full shadow-lg uppercase tracking-wider">
                            Esgotado
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })()}`;

  content = content.replace(/<Image\s+src=\{product\.image\}/g, `${esgotadoCenter}\n                  <Image src={product.image}`);
  
  // 3. Disable "Quick Add" button
  content = content.replace(
    /<Button className="w-full bg-white\/90 backdrop-blur-sm hover:bg-brand-plum text-brand-plum hover:text-white font-semibold shadow-lg">/g, 
    `<Button className="w-full bg-white/90 backdrop-blur-sm hover:bg-brand-plum hover:text-white font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-brand-plum disabled:text-slate-500 disabled:hover:bg-slate-100" disabled={(product.inventory || []).reduce((a, c) => a + (c.quantity || 0), 0) <= 0}>`
  );

  content = content.replace(
    /Adicionar à Sacola\n\s*<\/Button>/g,
    `{(product.inventory || []).reduce((a, c) => a + (c.quantity || 0), 0) <= 0 ? 'Indisponível' : 'Adicionar à Sacola'}\n                    </Button>`
  );

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
});
