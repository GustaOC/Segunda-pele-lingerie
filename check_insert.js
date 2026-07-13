const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
    const { data: { session } } = await supabase.auth.getSession();
    console.log("Session:", session);
    const { data, error } = await supabase.from('promoter_acertos').insert({
        promoter_id: '1e5e016a-84fb-40cd-a006-2591e1cc7dc9', // Bruno's ID? Actually I'll use Iza's ID
        period: '13/07/2026 a 19/07/2026',
        total_sold: 0,
        total_commission: 0,
        total_paid: 0,
    });
    console.log("Insert Error:", error);
    console.log("Insert Data:", data);
}
run();
