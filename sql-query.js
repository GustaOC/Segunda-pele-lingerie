require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.rpc('run_sql', { query: "SELECT column_name FROM information_schema.columns WHERE table_name = 'promoter_kits';" });
  console.log(data || error);
}
run();
