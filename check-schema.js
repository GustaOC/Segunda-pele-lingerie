require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: p } = await supabase.from('promoters').insert({ nome: 'Dummy', email: 'd@d.com' }).select();
  const promoterId = p[0].id;

  const { data, error } = await supabase.from('promoter_kits').insert({ name: 'Dummy', total_price: 100, promoter_id: promoterId }).select();
  console.log("Inserted columns:", data ? Object.keys(data[0]) : error);
  if (data) {
     await supabase.from('promoter_kits').delete().eq('id', data[0].id);
  }
  await supabase.from('promoters').delete().eq('id', promoterId);
}
run();
