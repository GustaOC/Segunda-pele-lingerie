const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers();
  if (data?.users) {
    console.log(data.users.map(u => ({ email: u.email, metadata: u.user_metadata, role: u.role, id: u.id })));
  } else {
    console.log("Error:", error);
  }
}
main();
