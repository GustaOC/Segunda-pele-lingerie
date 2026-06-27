const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const SUPABASE_URL = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)[1];
const SUPABASE_SERVICE_KEY = envFile.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)[1];

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  const { data, error } = await supabaseAdmin.from('profiles').select('*');
  console.log("Service key fetch:", data?.length);
  
  // Login as admin
  const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
  const adminUser = users.find(u => u.email === 'admin@segundapele.com');
  
  // For RLS testing, we don't have the password, so we can't easily do it.
}
main();
