'use server'

import { createClient } from '@supabase/supabase-js'

export async function getAllProfilesForHistory() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  const { data } = await supabase.from('profiles').select('id, nome')
  return data || []
}
