const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envPath = '.env.local';
const envFile = fs.readFileSync(envPath, 'utf8');
const anonKey = envFile.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1];
const url = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1];

const supabase = createClient(url, anonKey);

async function test() {
  const { error } = await supabase.from('inventory_transactions').insert({
    type: 'TEST',
    product_id: '7c51a42c-f7f8-4e62-a5e8-2aa8a9f2b64e',
    size: 'M',
    color: 'Red',
    quantity: 1,
    reseller_id: 'some-uuid'
  });
  console.log('Error:', error);
}
test();
