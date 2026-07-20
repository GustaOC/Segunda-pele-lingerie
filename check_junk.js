const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: allProducts } = await supabase.from('products').select('id, name, inventory(id)');
  const noInventory = allProducts.filter(p => !p.inventory || p.inventory.length === 0);
  console.log("Products with NO inventory rows:", noInventory.length);
  noInventory.forEach(p => console.log(p.name));
}
check();
