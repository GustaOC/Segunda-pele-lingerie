const fs = require('fs');
const file = 'app/admin/(protected)/acertos/historico/pdfGenerator.ts';
let code = fs.readFileSync(file, 'utf8');

// We need to fetch returnsData
const target = `const { data: allProds } = await supabase.from('products').select('id, name, sku, price');`;
const replacement = `const { data: allProds } = await supabase.from('products').select('id, name, sku, price');
  const { data: allReturns } = await supabase.from('inventory_transactions').select('product_id, quantity, notes').like('notes', '%Devolu%').like('notes', '%Acerto%');`;

code = code.replace(target, replacement);

const targetLoop = `let totalPcs = 0;
      let totalItems = 0;
      
      const itemRows = k.items.map((item: any) => {`;
      
const replacementLoop = `let totalPcs = 0;
      let totalItems = 0;
      
      const combinedItems = new Map();
      if (k.items) {
          k.items.forEach((item: any) => {
              combinedItems.set(item.product_id, {
                  product_id: item.product_id,
                  quantity: item.quantity,
                  returned: 0
              });
          });
      }
      
      if (allReturns) {
          const kitReturns = allReturns.filter((ret: any) => ret.notes.includes(\`[Kit: \${k.id}]\`));
          kitReturns.forEach((ret: any) => {
              if (combinedItems.has(ret.product_id)) {
                  combinedItems.get(ret.product_id).returned += ret.quantity;
              } else {
                  combinedItems.set(ret.product_id, {
                      product_id: ret.product_id,
                      quantity: 0,
                      returned: ret.quantity
                  });
              }
          });
      }
      
      const itemRows = Array.from(combinedItems.values()).map((item: any) => {`;

code = code.replace(targetLoop, replacementLoop);

const targetMapRow = `const lineTotal = item.quantity * price;
          
          totalPcs += item.quantity;
          totalItems += 1;
          
          return [
              item.quantity.toString(),
              name,
              '',
              item.quantity.toString(),
              price.toFixed(2),
              lineTotal.toFixed(2)
          ];`;
          
const replacementMapRow = `const lineTotal = item.quantity * price;
          const origQuant = item.quantity + item.returned;
          
          totalPcs += origQuant;
          totalItems += 1;
          
          return [
              origQuant.toString(),
              name,
              item.returned > 0 ? item.returned.toString() : '',
              item.quantity > 0 ? item.quantity.toString() : '',
              price.toFixed(2),
              lineTotal.toFixed(2)
          ];`;

code = code.replace(targetMapRow, replacementMapRow);

fs.writeFileSync(file, code);
