import { createClient } from '@supabase/supabase-js'
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// insert a dummy profile, then select it back to see all columns
const { data, error } = await supabase.from('profiles').select('*').limit(1)
if (data && data.length > 0) {
  console.log(Object.keys(data[0]))
} else {
  console.log(error)
}
