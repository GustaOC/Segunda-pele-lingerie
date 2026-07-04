const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const envPath = '.env.local';
const envFile = fs.readFileSync(envPath, 'utf8');
const anonKey = envFile.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1];
const url = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1];
const supabase = createClient(url, anonKey);
async function test() {
  const { data } = await supabase.from('categories').select('*').eq('id', '195a75d1-b8a8-4538-b60c-2d1b337dab81');
  console.log('Category:', data);
}
test();
