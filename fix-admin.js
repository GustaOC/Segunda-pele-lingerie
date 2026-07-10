const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const adminId = '4f1782e5-4d63-4178-b1d3-4d433ee0a127';
  
  // 1. Insert into profiles
  const { data: pData, error: pError } = await supabaseAdmin.from('profiles').upsert({
    id: adminId,
    role: 'ADMIN',
    nome: 'Administrador'
  });
  console.log('Profile upsert:', pError);

  // 2. Update user metadata
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.updateUserById(
    adminId,
    { user_metadata: { role: 'ADMIN', nome: 'Administrador' } }
  );
  console.log('Auth metadata update:', authError);
}
main();
