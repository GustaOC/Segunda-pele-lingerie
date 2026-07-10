const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data, error } = await supabaseAdmin.from('agenda').select('*').limit(1);
  console.log('agenda table exists?', !error || !error.message.includes('does not exist'));
  
  const { data: catData, error: catError } = await supabaseAdmin.from('agenda_categories').select('*').limit(1);
  console.log('agenda_categories table exists?', !catError || !catError.message.includes('does not exist'));
}
main();
