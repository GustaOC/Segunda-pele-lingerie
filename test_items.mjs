import { createClient } from '@supabase/supabase-js'
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

const { data, error } = await supabase.from('promoter_kit_items').select('*').eq('kit_id', '7c21cacb-37da-4a0e-8d6a-c4f6ada4ac6b')
console.log(data)
