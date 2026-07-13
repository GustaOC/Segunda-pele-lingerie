const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
    const { data: kits } = await supabase.from('promoter_kits').select('*').like('name', '%[FINALIZADO]%').not('name', 'like', '%[ACERTADO]%');
    console.log("Kits:", kits);
    if (kits && kits.length > 0) {
        const { data: items } = await supabase.from('promoter_kit_items').select('*').in('kit_id', kits.map(k => k.id));
        console.log("Kit Items:", items);
    }
}
run();
