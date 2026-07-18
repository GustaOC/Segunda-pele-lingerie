require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: recentKitItems } = await supabase.from('promoter_kit_items').select('*').gte('created_at', oneHourAgo);
  console.log("Recent Kit Items:", recentKitItems);
  
  const { data: recentLooseItems } = await supabase.from('reseller_inventory').select('*').gte('updated_at', oneHourAgo);
  console.log("Recent Loose Items:", recentLooseItems);
}
run();
