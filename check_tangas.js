const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data } = await supabase.from('products').select('id, name, inventory(quantity)').ilike('name', '%tanga%');
  console.log("Total tangas:", data.length);
  const withoutInventory = data.filter(p => !p.inventory || p.inventory.length === 0);
  console.log("Tangas without inventory:", withoutInventory.length);
  console.log(withoutInventory.slice(0, 5).map(p => p.name));
}
check();
