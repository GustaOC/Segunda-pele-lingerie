require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const kitId = "7a6d51d5-a3d8-4ed0-b747-d5d19a4e8d89"; // Assuming kit666 from previous context or we search for kit666
  
  const { data: kits } = await supabase.from('promoter_kits').select('id, name').ilike('name', '%kit666%');
  console.log("Kits found:", kits);
  
  if (kits && kits.length > 0) {
    const { data: items } = await supabase.from('promoter_kit_items').select('*, products(name, sku)').eq('kit_id', kits[0].id);
    console.log("Items in kit:", JSON.stringify(items, null, 2));
  }
}
run();
