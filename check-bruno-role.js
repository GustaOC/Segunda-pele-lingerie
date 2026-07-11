const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const adminId = 'db8d5d7d-276a-48de-b2f8-0f91285ddfbb';
  
  // Update user metadata
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.updateUserById(
    adminId,
    { user_metadata: { role: 'PROMOTOR', nome: 'Bruno vinicius' } }
  );
  console.log('Auth metadata update:', authError);
}
main();
