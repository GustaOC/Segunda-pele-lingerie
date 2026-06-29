import { config } from 'dotenv'
config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
async function run() {
  const { data: kits } = await supabase.from('promoter_kits').select('id, name, total_price, items:promoter_kit_items(id, product_id, quantity)')
  console.log(JSON.stringify(kits, null, 2))
}
run()
