const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data, error } = await supabaseAdmin.from('profiles').select('*').eq('id', 'db8d5d7d-276a-48de-b2f8-0f91285ddfbb');
  console.log("Profile data:", data);
  console.log("Error:", error);
}
main();
