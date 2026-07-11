const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const query = `
    ALTER TABLE public.promoter_inventory
    DROP CONSTRAINT IF EXISTS promoter_inventory_promoter_id_product_id_size_color_key;
    
    ALTER TABLE public.promoter_inventory
    ADD CONSTRAINT promoter_inventory_promoter_product_size_color_period_key 
    UNIQUE NULLS NOT DISTINCT (promoter_id, product_id, size, color, period);
  `;
  const { error } = await supabaseAdmin.rpc('exec_sql', { sql: query });
  console.log("RPC Error:", error);
}
main();
