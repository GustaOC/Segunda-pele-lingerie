const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const SUPABASE_URL = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)[1];
const SUPABASE_SERVICE_KEY = envFile.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/)[1];

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  const { data, error } = await supabase.from('profiles').select('id, nome, role').in('role', ['CONSULTANT', 'PROMOTOR', 'ADMIN', 'USER']);
  if (error) {
    console.error("Error fetching profiles:", error);
    return;
  }
  console.log("Fetched profiles:");
  console.table(data);
}

main().catch(console.error);
