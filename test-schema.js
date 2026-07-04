const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envPath = '.env.local';
const envFile = fs.readFileSync(envPath, 'utf8');
const anonKey = envFile.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1];
const url = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1];

const supabase = createClient(url, anonKey);

async function test() {
  const { data: d1 } = await supabase.from('inventory_transactions').select('*').limit(1);
  console.log('inventory_transactions:', d1);

  // How are kits sent to promoters? Let's check promotores/page.tsx
}
test();
