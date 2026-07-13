const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
    const { data, error } = await supabase.rpc('get_schema');
    // let's do a raw sql query, oh wait supabase JS doesn't have raw SQL via anon key
    // I can query pg_catalog.pg_attribute if postgrest allows, but usually not.
}
run();
