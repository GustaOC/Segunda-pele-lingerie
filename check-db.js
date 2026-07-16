require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: fin } = await supabase.from('financial_transactions').select('*').order('created_at', { ascending: false }).limit(10);
  console.log("Financial Transactions:");
  console.log(fin);
  
  const { data: inv } = await supabase.from('inventory_transactions').select('*').order('created_at', { ascending: false }).limit(10);
  console.log("\nInventory Transactions:");
  console.log(inv);
}
check();
