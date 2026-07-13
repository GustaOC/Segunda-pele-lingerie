const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data: invData, error: invErr } = await supabase.from('promoter_inventory').select('*').limit(1);
    console.log("promoter_inventory keys:", invData && invData[0] ? Object.keys(invData[0]) : "Empty or Error:", invErr);
    
    const { data: kitsData, error: kitsErr } = await supabase.from('promoter_kits').select('*').limit(1);
    console.log("promoter_kits keys:", kitsData && kitsData[0] ? Object.keys(kitsData[0]) : "Empty or Error:", kitsErr);
}
run();
