const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
    const { data } = await supabase.from('promoter_acertos')
      .select('*, profiles!promoter_acertos_promoter_id_fkey(nome)')
      .order('created_at', { ascending: false });
    console.log(JSON.stringify(data, null, 2));
}
run();
