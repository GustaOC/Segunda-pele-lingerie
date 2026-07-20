const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase.from('order_items').insert({
    order_id: 'c4cc8f66-2fa1-42a3-80df-de7c8bbb20a6'
  }).select('*');
  console.log("Data:", data, "Error:", error);
}
check();
