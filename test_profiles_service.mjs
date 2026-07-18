import { createClient } from '@supabase/supabase-js'
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseKey) { console.log('no service role key'); process.exit(0); }
const supabase = createClient(supabaseUrl, supabaseKey)
const { data, error } = await supabase.from('profiles').select('*')
console.log(data)
