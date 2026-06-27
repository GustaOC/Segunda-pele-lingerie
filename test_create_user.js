const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const SUPABASE_URL = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)[1];
const SUPABASE_SERVICE_KEY = envFile.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)[1];

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function main() {
  console.log("Testing create user...");
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: 'test_create_' + Date.now() + '@example.com',
    password: 'password123',
    email_confirm: true,
    user_metadata: {
      nome: 'Test User',
      role: 'TRIAGEM'
    }
  });

  if (error) {
    console.error("Error creating user:", error);
    return;
  }
  
  console.log("User created:", data.user.id);
  
  const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
    id: data.user.id,
    nome: 'Test User',
    role: 'TRIAGEM',
    ativo: true
  });
  
  if (profileError) {
    console.error("Error upserting profile:", profileError);
  } else {
    console.log("Profile created successfully!");
  }
  
  // Cleanup
  await supabaseAdmin.auth.admin.deleteUser(data.user.id);
}

main().catch(console.error);
