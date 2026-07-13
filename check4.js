const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
    const { data: invData } = await supabase.from('promoter_inventory').select('*').eq('promoter_id', 'db8d5d7d-276a-48de-b2f8-0f91285ddfbb').eq('period', '13/07/2026 a 19/07/2026');
    console.log("InvData:", invData);
}
run();
