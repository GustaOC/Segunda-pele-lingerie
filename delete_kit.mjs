import { createClient } from '@supabase/supabase-js'
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

const { data, error } = await supabase.from('promoter_kits').select('*').ilike('name', '%Kit Automático 2%')
console.log("Data to delete:", data)
console.log("Error finding:", error)

if (data && data.length > 0) {
    for (let k of data) {
        const { error: delErr } = await supabase.from('promoter_kits').delete().eq('id', k.id)
        console.log(`Deleted ${k.id}:`, delErr || "Success")
    }
}
