import { config } from 'dotenv'
config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
async function run() {
  const { data: kitItem, error } = await supabase.from('promoter_kit_items')
    .select('*')
    .eq('kit_id', '722783ff-1221-4a08-aa57-cd3b7d508604')
    .eq('product_id', 'e11ddb1b-4897-4189-96f5-0b8b46d11f3b')
    .eq('color', 'Rosa Claro')
    .eq('size', 'M')
    .single()
  console.log(JSON.stringify(kitItem, null, 2))
  console.log('Error:', error)
}
run()
