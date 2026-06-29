import { config } from 'dotenv'
config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
async function run() {
  // 1. Delete Pijama Seda Luxo from Kit #1
  await supabase.from('promoter_kit_items')
    .delete()
    .eq('id', '832bd891-b57a-4a67-9e66-92d3c96eb205')
  console.log('Deleted Pijama from kit')

  // 2. Fetch price of Body Sensual Noir
  const { data: bProd } = await supabase.from('products').select('sale_price').eq('id', '47753963-c542-4abe-842c-c9a1dd8152a2').single()
  
  if (bProd) {
    console.log('Body price:', bProd.sale_price)
    // 3. Update Kit #1 total price to just the Body's price
    await supabase.from('promoter_kits')
      .update({ total_price: bProd.sale_price })
      .eq('id', '722783ff-1221-4a08-aa57-cd3b7d508604')
    console.log('Updated Kit price to', bProd.sale_price)
  }
}
run()
