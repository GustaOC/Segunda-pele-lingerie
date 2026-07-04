const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envPath = '.env.local';
const envFile = fs.readFileSync(envPath, 'utf8');
const anonKey = envFile.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1];
const url = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1];

const supabase = createClient(url, anonKey);

async function test() {
  const { data, error } = await supabase.from('products').insert({
    sku: 'TEST-SKU-999',
    name: 'Test Product',
    price: 100,
    category_id: null,
    colors: [{name: 'Red', hex: '#ff0000', images: []}],
    sizes: ['M'],
    is_active: false,
    is_highlight: false,
    image: "",
    images: [],
    description: ""
  });
  console.log('Insert Error:', error);
  if (!error) {
    await supabase.from('products').delete().eq('sku', 'TEST-SKU-999');
  }
}

test();
