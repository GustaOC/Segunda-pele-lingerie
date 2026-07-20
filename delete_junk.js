const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function clean() {
  const { data: allProducts } = await supabase.from('products').select('id, name, inventory(id)');
  const noInventory = allProducts.filter(p => !p.inventory || p.inventory.length === 0);
  
  let deleted = 0;
  for (const p of noInventory) {
    const { error } = await supabase.from('products').delete().eq('id', p.id);
    if (!error) {
      deleted++;
    } else {
      console.error(`Could not delete ${p.name}:`, error.message);
    }
  }
  console.log(`Deleted ${deleted} products out of ${noInventory.length}`);
}
clean();
