require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: res } = await supabase.from('resellers').select('promoter_id').ilike('name', '%Izabella%').single();
  const { data: inv } = await supabase.from('promoter_inventory')
      .select('*, products(name)')
      .eq('promoter_id', res.promoter_id)
      .eq('period', '17/07/2026 a 24/07/2026')
      .gt('quantity', 0);
  console.log('Loose pieces for promoter in period:', inv ? inv.length : 0);
  
  const { data: kits } = await supabase.from('promoter_kits')
      .select('name')
      .eq('promoter_id', res.promoter_id)
      .eq('period', '17/07/2026 a 24/07/2026');
  console.log('Kits for promoter in period:', kits);
}
run();
