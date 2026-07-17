require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const items = [
  { name: "BABY DOLL CLARA", quantity: 11, price: 74.90 },
  { name: "BABY DOLL MICAELE", quantity: 1, price: 69.90 },
  { name: "BABY DOLL SUEDE STELLA", quantity: 4, price: 69.90 },
  { name: "COLETE COLETE VISCOLYCRA KARIZE REF M16C", quantity: 1, price: 49.90, is_roupa: true },
  { name: "CONJUNTO BEL", quantity: 2, price: 99.90 },
  { name: "CONJUNTO MARIAH", quantity: 5, price: 99.90 },
  { name: "CONJUNTO REBECA", quantity: 1, price: 119.90 },
  { name: "CONJUNTO SIMONE", quantity: 1, price: 99.90 },
  { name: "CONJUNTO VISLUMBRE S/ BOJO REF 6096", quantity: 1, price: 139.90 },
  { name: "CONJUNTO INFANTIL MENINA MOÇA ALGODÃO ISABELLY", quantity: 1, price: 59.90 },
  { name: "FIO DENTAL DIVERSAS", quantity: 1, price: 20.90 },
  { name: "FIO DENTAL LASER", quantity: 2, price: 17.90 },
  { name: "FIO DENTAL SECRET REF 8002", quantity: 4, price: 25.90 },
  { name: "FIO DENTAL SEM COSTURA", quantity: 21, price: 17.90 },
  { name: "FIO DUPLO MICRO RENATA", quantity: 17, price: 29.90 },
  { name: "FIO DUPLO STRING JULIA", quantity: 8, price: 23.90 },
  { name: "LEGGING CECILIA REF CBFD", quantity: 1, price: 99.90, is_roupa: true },
  { name: "LEGGING JUVENIL POLIAMIDA REF 24030", quantity: 1, price: 49.90, is_roupa: true },
  { name: "MEIA MASCULINA REF 8055 PROMOÇÃO", quantity: 1, price: 9.90 },
  { name: "MEIA SELENE PERFORMANCE REF 4025", quantity: 1, price: 49.90 },
  { name: "PIJAMA LONGO INF FEM BEAR REF 2505", quantity: 1, price: 119.90 },
  { name: "SAMBA CANÇÃO ANIMADA ADULTO", quantity: 4, price: 39.90 },
  { name: "SHORT CURTO PRETO RASGADO STUART", quantity: 1, price: 79.90, is_roupa: true },
  { name: "SHORT SHORT FITNESS BIA REF 472", quantity: 1, price: 89.90, is_roupa: true },
  { name: "SOUTIEN BOJO SOFT ELI", quantity: 1, price: 69.90 },
  { name: "TANGA TANGA LOVE SEM COSTURA", quantity: 2, price: 25.90 },
  { name: "TOP CAROLLA", quantity: 2, price: 59.90 },
  { name: "TOP ZEE RUCCI SEM COSTURA REBECA", quantity: 3, price: 69.90 }
];

async function run() {
  // delete the empty kit I just created
  await supabase.from('promoter_kits').delete().like('name', '%Automático%');

  console.log("Finding reseller...");
  const { data: resellers } = await supabase.from('resellers').select('*').ilike('name', '%izabella%');
  const reseller = resellers[0];
  const promoterId = reseller.promoter_id;

  const kitItemsToInsert = [];
  
  for (const item of items) {
    let { data: prod } = await supabase.from('products').select('*').eq('name', item.name).maybeSingle();
    
    if (!prod) {
      const { data: newProd, error: insertErr } = await supabase.from('products').insert({
        name: item.name,
        price: item.price,
        sku: 'IMP-' + Math.floor(Math.random()*10000)
      }).select().single();
      
      if (insertErr) {
        console.error("Failed to insert product", insertErr);
        continue;
      }
      prod = newProd;
      
      await supabase.from('inventory').insert({
        product_id: prod.id,
        size: 'U',
        color: 'Única',
        quantity: 100
      });
    }

    let { data: pInv } = await supabase.from('promoter_inventory')
      .select('*')
      .eq('promoter_id', promoterId)
      .eq('product_id', prod.id)
      .eq('size', 'U')
      .eq('color', 'Única')
      .maybeSingle();

    if (!pInv) {
      await supabase.from('promoter_inventory').insert({
        promoter_id: promoterId,
        product_id: prod.id,
        size: 'U',
        color: 'Única',
        quantity: item.quantity
      });
    } else {
      await supabase.from('promoter_inventory').update({ quantity: pInv.quantity + item.quantity }).eq('id', pInv.id);
    }
    
    kitItemsToInsert.push({
      product_id: prod.id,
      size: 'U',
      color: 'Única',
      quantity: item.quantity,
      price: item.price,
      is_roupa: !!item.is_roupa
    });
  }

  console.log("Creating kit...");
  const { data: kit } = await supabase.from('promoter_kits').insert({
    promoter_id: promoterId,
    reseller_id: reseller.id,
    name: `Kit Automático - Izabella (${new Date().toLocaleDateString('pt-BR')})`
  }).select().single();
  
  console.log("Inserting kit items...");
  const toInsert = kitItemsToInsert.map(i => ({
    kit_id: kit.id,
    product_id: i.product_id,
    size: i.size,
    color: i.color,
    quantity: i.quantity,
    price: i.price,
    is_roupa: i.is_roupa
  }));
  
  await supabase.from('promoter_kit_items').insert(toInsert);
  
  console.log(`Kit created successfully! ID: ${kit.id}`);
}
run();
