const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const SUPABASE_URL = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)[1];
const SUPABASE_SERVICE_KEY = envFile.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)[1];

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  const { data, error } = await supabaseAdmin.rpc('get_enum_values', { enum_name: 'user_role' });
  if (error) {
    console.log("Cannot call rpc:", error.message);
    // Let's just query the enum directly from pg_type if we can, but via supabase we might not be able to query system catalogs unless we use a Postgres driver.
  }
}
main();
