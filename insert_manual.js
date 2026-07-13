const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
    // login as admin
    const { data: { session }, error: authError } = await supabase.auth.signInWithPassword({
        email: 'bruno@example.com', // I don't know his email, I will just use postgres directly!
    });
}
run();
