const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fix() {
  const { data: allActive, error } = await supabase.from('products').select('id, image').eq('is_active', true);
  if (error) { console.error(error); return; }
  
  const toDeactivate = allActive.filter(p => !p.image || p.image.trim() === '');
  console.log(`Found ${toDeactivate.length} products to deactivate.`);
  
  let count = 0;
  for (const p of toDeactivate) {
    await supabase.from('products').update({ is_active: false }).eq('id', p.id);
    count++;
  }
  console.log(`Successfully deactivated ${count} products.`);
}
fix();
