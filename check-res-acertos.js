require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: racertos } = await supabase.from('reseller_acertos').select('*, resellers(name)').order('created_at', { ascending: false }).limit(5);
  console.log('Recent Reseller Acertos:', racertos);
  
  const { data: pacertos } = await supabase.from('promoter_acertos').select('*').order('created_at', { ascending: false }).limit(5);
  console.log('Recent Promoter Acertos:', pacertos);
  
  const { data: transactions } = await supabase.from('finance_transactions').select('*').order('created_at', { ascending: false }).limit(5);
  console.log('Recent finance transactions:', transactions);
}
run();
