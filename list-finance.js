require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: txs, error: err } = await supabase.from('financial_transactions').select('*').order('created_at', { ascending: false }).limit(10);
  console.log('Recent transactions:', txs);
}
run();
