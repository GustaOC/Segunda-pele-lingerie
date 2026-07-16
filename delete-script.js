require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log("Starting deletion...");
  
  const { error: err0 } = await supabase.from('promoter_kit_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log("Deleted promoter_kit_items:", err0 || "OK");

  const { error: err1 } = await supabase.from('promoter_kits').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log("Deleted promoter_kits:", err1 || "OK");

  const { error: err2 } = await supabase.from('promoter_acertos').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log("Deleted promoter_acertos:", err2 || "OK");

  const { error: err3 } = await supabase.from('promoter_inventory').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log("Deleted promoter_inventory:", err3 || "OK");
}
run();
