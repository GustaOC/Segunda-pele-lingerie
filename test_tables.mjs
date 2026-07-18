import { createClient } from '@supabase/supabase-js'
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// Try to select from 'addresses', 'user_addresses', 'customer_addresses'
const queries = ['addresses', 'user_addresses', 'customer_addresses', 'enderecos']
for (let t of queries) {
  const { error } = await supabase.from(t).select('id').limit(1)
  console.log(`${t}:`, error ? error.message : "Exists!")
}
