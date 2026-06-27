const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const SUPABASE_URL = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)[1];
const SUPABASE_SERVICE_KEY = envFile.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)[1];

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  const { data, error } = await supabaseAdmin.from('pg_policies').select('*').eq('tablename', 'profiles');
  if (error) {
    console.log("No select pg_policies:", error.message);
    
    // Let's do a SQL query via RPC if there's one, but maybe they don't have one.
  } else {
    console.log("Policies:", data);
  }
}
main();
