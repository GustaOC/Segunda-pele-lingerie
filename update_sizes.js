const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: invRows, error } = await supabase.from('inventory').select('*').eq('size', 'U');
  if (error) { console.error("Error fetching inventory:", error); return; }
  
  console.log(`Found ${invRows.length} inventory rows with size U`);
  
  // Group by product_id
  const productIds = [...new Set(invRows.map(r => r.product_id))];
  console.log(`Affects ${productIds.length} unique products`);
  
  let deletedCount = 0;
  let insertedCount = 0;
  let updatedProductsCount = 0;
  
  for (const row of invRows) {
    // Delete the 'U' row
    await supabase.from('inventory').delete().eq('id', row.id);
    deletedCount++;
    
    // Insert P, M, G, GG
    const sizes = ['P', 'M', 'G', 'GG'];
    for (const size of sizes) {
      const { error: insErr } = await supabase.from('inventory').insert({
        product_id: row.product_id,
        color: row.color || 'Cor Única',
        size: size,
        quantity: 100
      });
      if (!insErr) insertedCount++;
      else console.error("Error inserting:", insErr.message);
    }
  }
  
  // Update products table so sizes array is correct
  for (const pid of productIds) {
    const { error: updErr } = await supabase.from('products').update({ sizes: ['P', 'M', 'G', 'GG'] }).eq('id', pid);
    if (!updErr) updatedProductsCount++;
  }
  
  console.log(`Deleted ${deletedCount} 'U' rows`);
  console.log(`Inserted ${insertedCount} new size rows`);
  console.log(`Updated ${updatedProductsCount} products in products table`);
}
run();
