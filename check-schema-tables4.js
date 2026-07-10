const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data: e, error: ee } = await supabaseAdmin.from('event').select('*').limit(1);
  if (e && e.length > 0) {
    console.log(Object.keys(e[0]));
  } else if (e) {
    // try inserting a dummy one and rolling back to get columns
    const { error } = await supabaseAdmin.from('event').insert({ id: 'dummy' });
    console.log('Insert error to find columns:', error);
  }
}
main();
