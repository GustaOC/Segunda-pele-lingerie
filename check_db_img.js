const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data } = await supabase.from('products').select('image').not('image', 'is', null);
  console.log("Random images from DB:");
  data.slice(0, 5).forEach(r => console.log(r.image));
}
check();
