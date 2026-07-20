const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase.from('cart_items').insert({
    user_id: '9aa5356a-de16-481c-afd5-8e48452c2892', // just using an existing one
    product_id: 'e11ddb1b-4897-4189-96f5-0b8b46d11f3b',
    quantity: 1,
    size: 'M',
    color: 'vermelho'
  });
  console.log("Error:", error);
}
check();
