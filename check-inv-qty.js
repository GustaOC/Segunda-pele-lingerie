require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: inv } = await supabase.from('promoter_inventory').select('*').eq('period', '15/07/2026 a 21/07/2026');
  console.log('15/07 to 21/07 Inv:', inv);
  
  const { data: inv2 } = await supabase.from('promoter_inventory').select('*').eq('period', '16/07/2026 a 22/07/2026');
  console.log('16/07 to 22/07 Inv:', inv2);
}
run();
