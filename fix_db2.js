import { config } from 'dotenv'
config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
async function run() {
  const { data: bProd } = await supabase.from('products').select('price').eq('id', '47753963-c542-4abe-842c-c9a1dd8152a2').single()
  
  if (bProd) {
    console.log('Body price:', bProd.price)
    const { error } = await supabase.from('promoter_kits')
      .update({ total_price: bProd.price })
      .eq('id', '722783ff-1221-4a08-aa57-cd3b7d508604')
    console.log('Updated Kit price to', bProd.price, error)
  }
}
run()
