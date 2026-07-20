const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fix() {
  const { data, error } = await supabase.from('inventory').select('id, color').eq('color', 'Única');
  if (error) { console.error(error); return; }
  console.log(`Found ${data.length} rows with color "Única"`);
  
  if (data.length > 0) {
    const { error: updErr } = await supabase.from('inventory').update({ color: 'Cor Única' }).eq('color', 'Única');
    if (updErr) console.error(updErr);
    else console.log('Successfully updated color to "Cor Única"');
  }
}
fix();
