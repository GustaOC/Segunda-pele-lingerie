const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data, error } = await supabaseAdmin.from('resellers').select('*').limit(1);
  console.log("Data:", data);
  if (data && data.length > 0) {
    console.log("Columns:", Object.keys(data[0]));
  }
}
main();
