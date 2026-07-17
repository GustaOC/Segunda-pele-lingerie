require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: res } = await supabase.from('resellers').select('promoter_id').ilike('name', '%Izabella%').single();
  const { data: inv } = await supabase.from('promoter_inventory')
      .select('*, products(name)')
      .eq('promoter_id', res.promoter_id)
      .gt('quantity', 0);
      
  console.log('Loose pieces periods:', [...new Set(inv.map(i => i.period))]);
  
  const { data: acertos } = await supabase.from('promoter_acertos')
      .select('period')
      .eq('promoter_id', res.promoter_id);
  console.log('Settled periods:', acertos.map(a => a.period));
}
run();
