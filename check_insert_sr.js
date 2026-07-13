const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
    const { data, error } = await supabase.from('promoter_acertos').insert({
        promoter_id: 'db8d5d7d-276a-48de-b2f8-0f91285ddfbb',
        period: '13/07/2026 a 19/07/2026',
        total_sold: 0,
        total_commission: 0,
        total_paid: 0,
        created_by: '4f1782e5-4d63-4178-b1d3-4d433ee0a127',
        details: []
    });
    console.log("Error:", error);
    console.log("Data:", data);
}
run();
