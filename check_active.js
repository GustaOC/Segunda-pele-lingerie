const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data } = await supabase.from('products').select('id, name, is_active, image').eq('is_active', true);
  const withoutImage = data.filter(p => !p.image || p.image.trim() === '');
  console.log(`Total active: ${data.length}, Active without image: ${withoutImage.length}`);
}
check();
