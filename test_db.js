const { createClient } = require('@supabase/supabase-js')
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
async function run() {
  const { data } = await supabase.from('products').select('*').limit(1)
  console.log(data)
}
run()
