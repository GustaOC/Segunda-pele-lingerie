require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: acertos } = await supabase.from('promoter_acertos').select('*');
  console.log('Promoter Acertos:', acertos.map(a => ({ id: a.id, period: a.period, total: a.total_sold })));
  
  const { data: kits } = await supabase.from('promoter_kits').select('id, name, period, total_price, reseller_id, promoter_id');
  console.log('Kits for 17/07 to 24/07:');
  const filtered = kits.filter(k => k.period === '17/07/2026 a 24/07/2026');
  filtered.forEach(k => console.log(`- ${k.name} (Reseller: ${k.reseller_id})`));
}
run();
