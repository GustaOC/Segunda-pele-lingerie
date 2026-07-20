const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const names = [
  'Conjunto Rendado Aurora',
  'Sutiã Bralette Essencial',
  'Calcinha Caleçon Renda',
  'Body Renda Guipir',
  'Roupão Seda Supreme',
  'Pijama Inverno Plush',
  'Cinta Modeladora Invisível',
  'Calcinha renda branca'
];

async function remove() {
  for (const name of names) {
    const { data, error } = await supabase.from('products').select('id').eq('name', name);
    if (error) { console.error(`Error finding ${name}:`, error); continue; }
    if (!data || data.length === 0) {
      console.log(`Not found: ${name}`);
      continue;
    }
    for (const p of data) {
      const { error: delErr } = await supabase.from('products').delete().eq('id', p.id);
      if (delErr) {
        console.error(`Error deleting ${name} (${p.id}):`, delErr.message);
      } else {
        console.log(`Deleted: ${name} (${p.id})`);
      }
    }
  }
}
remove();
