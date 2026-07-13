const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
    const { data: insertData, error: insertErr } = await supabase.from('promoter_inventory').insert({
        promoter_id: '123e4567-e89b-12d3-a456-426614174000',
        product_id: '123e4567-e89b-12d3-a456-426614174000',
        quantity: 1
    }).select();
    console.log(insertData, insertErr);
    if (insertData) {
        await supabase.from('promoter_inventory').delete().eq('id', insertData[0].id);
    }
}
run();
