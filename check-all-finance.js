require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: txs } = await supabase.from('financial_transactions').select('*').eq('status', 'NAO_PAGO');
  console.log('ALL unpaid transactions:', txs);
}
run();
