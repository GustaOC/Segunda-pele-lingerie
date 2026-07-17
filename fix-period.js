require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const periodStr = '17/07/2026 a 24/07/2026';
  
  // Fix the kit
  const { data: kitData, error: kitErr } = await supabase.from('promoter_kits')
    .update({ period: periodStr })
    .ilike('name', '%Kit Automático (Importado)%')
    .select();
  console.log("Updated Kits:", kitData?.length);

  // Fix the inventory
  // Find the promoter ID from the kit
  if (kitData && kitData.length > 0) {
    const promoterId = kitData[0].promoter_id;
    const { data: invData, error: invErr } = await supabase.from('promoter_inventory')
      .update({ period: periodStr })
      .eq('promoter_id', promoterId)
      .is('period', null)
      .select();
    console.log("Updated Inventory Rows:", invData?.length);
  }
}
run();
