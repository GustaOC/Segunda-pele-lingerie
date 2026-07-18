require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: acertos } = await supabase.from('promoter_acertos').select('*, promoters(nome)').eq('amount_paid', 0);
  console.log('Acertos with 0 paid:', acertos);
  
  // Find finance transactions related to these acertos
  // Usually the description contains the promoter name or it's linked somehow
  const { data: finance } = await supabase.from('finance_transactions').select('*').in('status', ['PENDENTE']);
  console.log('Pending finance transactions:', finance);
}
run();
