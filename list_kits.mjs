import { createClient } from '@supabase/supabase-js'
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

const { data, error } = await supabase.from('reseller_kits').select('id, name')
console.log("DATA:", data)
console.log("ERROR:", error)
