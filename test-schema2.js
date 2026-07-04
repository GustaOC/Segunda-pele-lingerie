const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envPath = '.env.local';
const envFile = fs.readFileSync(envPath, 'utf8');
const anonKey = envFile.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1];
const url = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1];

const supabase = createClient(url, anonKey);

async function test() {
  const { data: d1 } = await supabase.from('inventory_transactions').select('*').limit(1);
  if (d1 && d1.length > 0) {
     console.log('Columns:', Object.keys(d1[0]));
  } else {
    // Let's insert a dummy row to see columns or just query information_schema if possible
  }
}
test();
