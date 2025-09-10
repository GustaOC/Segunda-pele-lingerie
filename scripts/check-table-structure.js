// scripts/check-table-structure.js
const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTableStructure() {
  console.log('🔍 Checking users table structure...')
  
  try {
    // Verificar se a tabela existe e sua estrutura
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ Error accessing users table:', error.message)
      
      if (error.message.includes('relation "public.users" does not exist')) {
        console.log('📋 Creating users table...')
        await createUsersTable()
      }
      return
    }
    
    console.log('✅ Users table exists')
    
    // Verificar se existe algum usuário
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, nome, role, ativo, password')
      .limit(5)
    
    if (usersError) {
      console.error('❌ Error querying users:', usersError.message)
      return
    }
    
    console.log(`📊 Found ${users.length} users in database`)
    
    if (users.length > 0) {
      console.log('👥 Users sample:')
      users.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.email} - ${user.role} - ${user.ativo ? 'Active' : 'Inactive'} - ${user.password ? 'Has password' : 'No password'}`)
      })
      
      // Verificar se algum usuário não tem senha hash válida
      const usersWithInvalidPasswords = users.filter(user => 
        user.password && !user.password.startsWith('$2')
      )
      
      if (usersWithInvalidPasswords.length > 0) {
        console.log('⚠️  Found users with non-hashed passwords:')
        usersWithInvalidPasswords.forEach(user => {
          console.log(`  - ${user.email}: ${user.password.substring(0, 10)}...`)
        })
        console.log('🔧 Run fix-passwords script to correct this')
      }
    }
    
    // Verificar se existe admin
    const { data: adminUsers } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'ADMIN')
      .eq('ativo', true)
    
    if (adminUsers.length === 0) {
      console.log('⚠️  No active admin users found')
      console.log('🔧 Run create-admin script to create one')
    } else {
      console.log(`✅ Found ${adminUsers.length} active admin user(s)`)
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

async function createUsersTable() {
  // Esta função seria executada via SQL no Supabase Dashboard
  console.log(`
🔧 Please run this SQL in your Supabase SQL Editor:

CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  nome VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'TRIAGEM',
  ativo BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS users_role_idx ON users(role);
CREATE INDEX IF NOT EXISTS users_ativo_idx ON users(ativo);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `)
}

// Executar verificação
checkTableStructure()