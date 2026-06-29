import { config } from 'dotenv'
config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
async function run() {
  const { data } = await supabase.from('promoter_kits').select('*, items:promoter_kit_items(*)').limit(5)
  console.log(JSON.stringify(data, null, 2))
}
run()
