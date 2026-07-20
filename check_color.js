const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: prod } = await supabase.from('products').select('id, name, colors').ilike('name', '%TOP CAROLLA%');
  console.log("Products found:", prod);
  if (prod.length > 0) {
    const { data: inv } = await supabase.from('inventory').select('color, size, quantity').eq('product_id', prod[0].id);
    console.log("Inventory:", inv);
  }
}
check();
