require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const returnedItems = [
  { sku: '04430', name: 'CALÇA CALÇA CÓS FIO DUPLO', qty: 2, price: 45.90 },
  { sku: '04410', name: 'CAMISOLA ANDRESSA REF 790', qty: 1, price: 159.90 },
  { sku: '04413', name: 'CAMISOLA LARISSA REF 709', qty: 1, price: 159.90 },
  { sku: '89865', name: 'CONJUNTO ALEXIA REF 022118', qty: 1, price: 139.90 },
  { sku: '04312', name: 'CONJUNTO FABIANA REF 21107', qty: 1, price: 139.90 },
  { sku: '02427', name: 'CONJUNTO FEMINIS REF 208', qty: 1, price: 99.90 },
  { sku: '02424', name: 'CONJUNTO FEMINIS REF 213', qty: 1, price: 99.90 },
  { sku: '04444', name: 'CONJUNTO KAROLAYNE', qty: 3, price: 79.90 },
  { sku: '91028', name: 'CUECA BOXER ADULTO RICARDO', qty: 1, price: 29.90 },
  { sku: '97261', name: 'CUECA BOXER GUSTAVO', qty: 1, price: 29.90 },
  { sku: '04109', name: 'CUECA BOXER KAIO', qty: 3, price: 24.90 },
  { sku: '89412', name: 'CUECA BOXER REF 1014', qty: 3, price: 29.90 },
  { sku: '03904', name: 'FIO DUPLO SORAIA', qty: 1, price: 26.90 },
  { sku: '7451', name: 'FIO DUPLO VILANY', qty: 1, price: 24.90 },
  { sku: '04454', name: 'MACAQUINHO ALEXANDRA REF 499', qty: 1, price: 219.90 },
  { sku: '96805', name: 'TANGA ANA PAULA', qty: 1, price: 24.90 },
  { sku: '04119', name: 'TANGA LARA REF 3078', qty: 1, price: 19.90 },
  { sku: '03628', name: 'TANGA MADRI', qty: 3, price: 24.90 },
  { sku: '96707', name: 'TANGA MICROFIBRA REBEKA', qty: 1, price: 24.90 }
];

async function run() {
  const { data: resellers } = await supabase.from('resellers').select('*').ilike('name', '%Izabella%').single();
  const promoterId = resellers.promoter_id;
  const periodStr = '17/07/2026 a 24/07/2026';

  for (let item of returnedItems) {
    let { data: prodData } = await supabase.from('products').select('id').eq('sku', item.sku);
    let productId;
    
    if (prodData && prodData.length > 0) {
      productId = prodData[0].id;
    } else {
      const { data: newProd } = await supabase.from('products').insert({
        name: item.name,
        sku: item.sku,
        price: item.price
      }).select();
      if (!newProd) continue;
      productId = newProd[0].id;
    }
    
    const { data: invRows } = await supabase.from('promoter_inventory').select('*')
        .eq('promoter_id', promoterId).eq('product_id', productId)
        .eq('size', 'M').eq('color', 'Sortido').eq('period', periodStr);
        
    if (invRows && invRows.length > 0) {
       await supabase.from('promoter_inventory').update({ quantity: invRows[0].quantity + item.qty }).eq('id', invRows[0].id);
    } else {
       await supabase.from('promoter_inventory').insert({
          promoter_id: promoterId,
          product_id: productId,
          size: 'M',
          color: 'Sortido',
          quantity: item.qty,
          period: periodStr
       });
    }
    console.log('Added loose item to promoter:', item.name);
  }
}
run();
