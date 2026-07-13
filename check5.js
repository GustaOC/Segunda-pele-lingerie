const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
    const { data: promoters } = await supabase.from('profiles').select('id, name').eq('role', 'PROMOTOR');
    console.log("Promoters:", promoters);
    
    const { data: allInv } = await supabase.from('promoter_inventory').select('*');
    console.log("All Inv:", allInv);
}
run();
