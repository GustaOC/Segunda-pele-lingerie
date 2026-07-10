const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data, error } = await supabaseAdmin.from('profiles').update({ role: 'ADMIN' }).eq('nome', 'Gustavo Gustah');
  console.log('Update Result:', data, error);
}
main();
