const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data, error } = await supabaseAdmin.from('lead').select('*').order('created_at', { ascending: false }).limit(5);
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Success:', data);
  }
}
main();
