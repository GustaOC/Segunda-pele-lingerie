const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envPath = '.env.local';
const envFile = fs.readFileSync(envPath, 'utf8');
const anonKey = envFile.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1];
const url = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1];

const supabase = createClient(url, anonKey);

async function test() {
  const { data, error } = await supabase.from('products').select('id, name, sku, category_id, created_at, is_active').order('created_at', { ascending: false }).limit(5);
  console.log('Products:', JSON.stringify(data, null, 2));
  console.log('Error:', error);
}

test();
