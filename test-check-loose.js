require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const kitId = "ece3c718-5d78-4742-bfa7-4dff9766967c";
  const { data: kit } = await supabase.from('promoter_kits').select('reseller_id').eq('id', kitId).single();
  const resellerId = kit.reseller_id;
  
  const { data: looseItems } = await supabase.from('reseller_inventory').select('*, products(name, sku)').eq('reseller_id', resellerId);
  console.log("Loose items for reseller:", JSON.stringify(looseItems, null, 2));
}
run();
