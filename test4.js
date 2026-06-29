import { config } from 'dotenv'
config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
async function run() {
  const { data } = await supabase.from('products').select('id, name, sale_price').in('id', ['e11ddb1b-4897-4189-96f5-0b8b46d11f3b', '47753963-c542-4abe-842c-c9a1dd8152a2'])
  console.log(JSON.stringify(data, null, 2))
}
run()
