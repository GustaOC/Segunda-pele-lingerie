const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const envPath = '.env.local';
const envFile = fs.readFileSync(envPath, 'utf8');
const anonKey = envFile.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1];
const url = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1];
const supabase = createClient(url, anonKey);
async function test() {
  const { data, error } = await supabase.from('products').update({
      category_id: '195a75d1-b8a8-4538-b60c-2d1b337dab81',
      is_active: true,
  }).eq('id', '7c51a42c-f7f8-4e62-a5e8-2aa8a9f2b64e');
  console.log('Update result:', data, 'Error:', error);
}
test();
