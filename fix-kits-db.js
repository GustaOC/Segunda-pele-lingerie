require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const kitId1 = 'bd3a61b3-d9d3-4c4d-aa0f-72ca09406c0c'; // kit 21321
  const kitId2 = 'd87daf93-6d6e-4656-a2a7-34f5cd3bfa72'; // kit 9898798
  
  // 1. Delete financial_transactions
  const { data: txs, error: err } = await supabase.from('financial_transactions')
      .delete()
      .or(`description.ilike.%${kitId1.substring(0,8)}%,description.ilike.%${kitId2.substring(0,8)}%`)
      .select();
  console.log('Deleted transactions:', txs);
  if (err) console.error(err);
  
  // 2. Update kit names
  // 51.84 for the first, 197.52 for the second
  const { data: updated1 } = await supabase.from('promoter_kits').update({ name: 'kit 21321 [FINALIZADO] [PAGO:51.84]' }).eq('id', kitId1).select();
  console.log('Updated Kit 1:', updated1);
  
  const { data: updated2 } = await supabase.from('promoter_kits').update({ name: 'kit 9898798 [FINALIZADO] [PAGO:197.52]' }).eq('id', kitId2).select();
  console.log('Updated Kit 2:', updated2);
}
run();
