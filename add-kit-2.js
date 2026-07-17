require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const itemsList = [
  { sku: '04307', name: 'BERMUDA LAYSA', qty: 1, price: 99.90 },
  { sku: '04428', name: 'CALÇA CALÇA FIO DUPLO JOICE', qty: 1, price: 33.90 },
  { sku: '04071', name: 'CALÇA CÓS FIO DUPLO MYLENA', qty: 1, price: 34.90 },
  { sku: '98151', name: 'CALÇA FIO DUPLO REF 9050', qty: 1, price: 27.90 },
  { sku: '04118', name: 'CALÇA LIVIA REF 3083', qty: 2, price: 19.90 },
  { sku: '04457', name: 'CONJUNTO CONJUNTO POLIAMIDA LUNNA REF 498', qty: 4, price: 199.90 },
  { sku: '04443', name: 'CONJUNTO GLAMOUR', qty: 1, price: 59.90 },
  { sku: '03802', name: 'CONJUNTO HELOÁ REF 24503', qty: 1, price: 139.90 },
  { sku: '04008', name: 'CONJUNTO LAIZA REF 17909', qty: 1, price: 139.90 },
  { sku: '03804', name: 'CONJUNTO LIZ REF 17906', qty: 1, price: 129.90 },
  { sku: '04010', name: 'CONJUNTO NAYARA REF 17912', qty: 1, price: 129.90 },
  { sku: '02386', name: 'CONJUNTO THAIS REF 16993', qty: 1, price: 139.90 },
  { sku: '02882', name: 'CUECA BOXER ADULTO MICROFIBRA PIT BULL', qty: 3, price: 45.90 },
  { sku: '100228', name: 'CUECA BOXER PLUS MICRO REF 1044', qty: 3, price: 37.90 },
  { sku: '97885', name: 'CUECA BOXER RODRIGO', qty: 1, price: 29.90 },
  { sku: '04284', name: 'CUECA ZEE RUCCI BOXER SEM COSTURA', qty: 1, price: 49.90 },
  { sku: '03642', name: 'FIO DUPLO DEBORA', qty: 1, price: 39.90 },
  { sku: '04110', name: 'FIO DUPLO JULIETE', qty: 1, price: 34.90 },
  { sku: '03134', name: 'FIO DUPLO KATIA', qty: 1, price: 29.90 },
  { sku: '94335', name: 'FIO DUPLO MICROFIBRA AMABILE', qty: 1, price: 21.90 },
  { sku: '04184', name: 'FIO RENDA DEBORA', qty: 1, price: 39.90 },
  { sku: '03109', name: 'LEGGING EMILLY (SEM COMISSÃO)', qty: 1, price: 99.90 },
  { sku: '04229', name: 'LEGGING LEGGING FITNESS GIULA REF 292', qty: 3, price: 139.90 },
  { sku: '04451', name: 'LEGGING SANNY REF 556', qty: 1, price: 143.90 },
  { sku: '04455', name: 'MACAQUINHO HELOISA REF 497', qty: 1, price: 219.90 },
  { sku: '04453', name: 'MACAQUINHO SAFIRA REF 494', qty: 1, price: 219.90 },
  { sku: '04232', name: 'SHORT SHORT FITNESS BIA REF 472', qty: 1, price: 89.90 },
  { sku: '04227', name: 'SHORT SHORT FITNESS REBECA REF 534', qty: 2, price: 89.90 },
  { sku: '02429', name: 'SOUTIEN BOJO COMUM LARISSA', qty: 2, price: 54.90 },
  { sku: '04111', name: 'TANGA ALICE REF 311', qty: 1, price: 23.90 },
  { sku: '04191', name: 'TANGA COTON ALICIA', qty: 1, price: 24.90 },
  { sku: '03696', name: 'TANGA MICROFIBRA ALINE', qty: 1, price: 21.90 },
  { sku: '03719', name: 'TANGA MICROFIBRA E TULE', qty: 1, price: 29.90 },
  { sku: '04432', name: 'TANGA TANGA THAINÁ', qty: 1, price: 23.90 },
  { sku: '04450', name: 'TOP HELENA REF 179', qty: 3, price: 89.90 },
  { sku: '04448', name: 'TOP RAIANE REF 520', qty: 2, price: 89.90 }
];

async function run() {
  console.log('Fetching reseller...');
  const { data: resellers, error: rErr } = await supabase.from('resellers').select('*').ilike('name', '%Izabella%');
  if (rErr || !resellers.length) return console.error('Reseller not found', rErr);
  const reseller = resellers[0];
  const promoterId = reseller.promoter_id;
  const resellerId = reseller.id;
  
  let totalPrice = 0;
  let periodStr = '17/07/2026 a 24/07/2026';

  for (let item of itemsList) {
    // Check if product exists
    const { data: prodData } = await supabase.from('products').select('*').eq('sku', item.sku);
    let productId;
    if (prodData && prodData.length > 0) {
      productId = prodData[0].id;
      // Update price just in case
      await supabase.from('products').update({ price: item.price }).eq('id', productId);
    } else {
      console.log('Inserting product:', item.name);
      const { data: newProd, error: pErr } = await supabase.from('products').insert({
        name: item.name,
        sku: item.sku,
        price: item.price,
        resale_price: item.price,
        stock_quantity: 0
      }).select();
      if (pErr) {
         console.error('Error inserting product', pErr);
         continue;
      }
      productId = newProd[0].id;
    }
    item.productId = productId;
    
    // Add to promoter inventory
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
    
    totalPrice += (item.price * item.qty);
  }

  // Create Kit
  const { data: newKit, error: kitErr } = await supabase.from('promoter_kits').insert({
    promoter_id: promoterId,
    reseller_id: resellerId,
    name: 'Kit Automático 2 (Importado) - Izabella',
    total_price: totalPrice,
    period: periodStr
  }).select();
  
  if (kitErr) return console.error('Error creating kit', kitErr);
  const kitId = newKit[0].id;
  
  // Create Kit Items and deduct from inventory
  for (let item of itemsList) {
    if (!item.productId) continue;
    
    await supabase.from('promoter_kit_items').insert({
      kit_id: kitId,
      product_id: item.productId,
      size: 'M',
      color: 'Sortido',
      quantity: item.qty
    });
    
    // Deduct from promoter_inventory
    const { data: invRows } = await supabase.from('promoter_inventory').select('*')
        .eq('promoter_id', promoterId).eq('product_id', item.productId)
        .eq('size', 'M').eq('color', 'Sortido').eq('period', periodStr);
        
    if (invRows && invRows.length > 0) {
        await supabase.from('promoter_inventory').update({ quantity: invRows[0].quantity - item.qty }).eq('id', invRows[0].id);
    }
  }

  console.log('Successfully created kit 2 and added products!');
}
run();
