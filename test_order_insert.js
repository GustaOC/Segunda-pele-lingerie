const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase.from('orders').insert({
    user_id: '9aa5356a-de16-481c-afd5-8e48452c2892',
    status: 'pending'
  }).select('*');
  console.log("Data:", data, "Error:", error);
}
check();
