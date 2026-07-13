const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
    const { data, error } = await supabase.from('promoter_acertos').select('*, profiles!promoter_acertos_promoter_id_fkey(name)').order('created_at', { ascending: false });
    console.log("Error:", error);
    console.log("Data:", data);
}
run();
