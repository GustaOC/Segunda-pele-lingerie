import { createClient } from '@supabase/supabase-js'
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)
const { data, error } = await supabase.from('inventory_transactions').select('created_by')
const unique = [...new Set(data.map(d => d.created_by))]
console.log(unique)
