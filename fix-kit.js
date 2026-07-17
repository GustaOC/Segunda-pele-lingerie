require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.from('promoter_kits')
    .update({ reseller_id: null, name: 'Kit Automático (Importado)' })
    .ilike('name', '%Kit Automático - Izabella%')
    .select();
  
  console.log("Updated kits:", data);
}
run();
