const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { error } = await supabase.rpc('execute_sql', { sql: "ALTER TABLE promoter_kits ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'PENDING';" });
    if (error) {
        console.log("RPC Error:", error);
    } else {
        console.log("Success");
    }
}
run();
