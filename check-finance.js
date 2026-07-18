require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: finance } = await supabase.from('finance_transactions').select('*').order('created_at', { ascending: false }).limit(10);
  console.log('Recent Finance transactions:', finance);
  
  const { data: prom_finance } = await supabase.from('promoter_finance_transactions').select('*').order('created_at', { ascending: false }).limit(10);
  console.log('Recent Promoter Finance transactions:', prom_finance);
}
run();
