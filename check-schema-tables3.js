const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data: e, error: ee } = await supabaseAdmin.from('event').select('*').limit(1);
  console.log('event:', e, ee);
  
  const { data: c, error: ce } = await supabaseAdmin.from('categories').select('*').limit(1);
  console.log('categories:', c, ce);
}
main();
