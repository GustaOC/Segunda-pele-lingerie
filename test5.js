import { config } from 'dotenv'
config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
async function run() {
  const { data, error } = await supabase.from('products').select('*').eq('id', '47753963-c542-4abe-842c-c9a1dd8152a2')
  console.log('Error:', error)
  console.log(JSON.stringify(data, null, 2))
}
run()
