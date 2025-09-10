// scripts/fix-passwords.js
const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixPasswords() {
  console.log('🔧 Checking for users with non-hashed passwords...\n')
  
  try {
    // Buscar todos os usuários
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, password')
    
    if (error) {
      console.error('❌ Error fetching users:', error.message)
      return
    }
    
    console.log(`📊 Found ${users.length} users in database`)
    
    // Filtrar usuários com senhas não hasheadas
    const usersWithPlainPasswords = users.filter(user => {
      if (!user.password) return false
      // bcrypt hashes start with $2a$, $2b$, $2x$, or $2y$
      return !user.password.startsWith('$2')
    })
    
    if (usersWithPlainPasswords.length === 0) {
      console.log('✅ All users have properly hashed passwords!')
      return
    }
    
    console.log(`⚠️  Found ${usersWithPlainPasswords.length} users with plain text passwords:`)
    usersWithPlainPasswords.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.email} - Password: ${user.password.substring(0, 10)}...`)
    })
    
    console.log('\n🔐 Hashing passwords...')
    
    // Hash das senhas
    for (const user of usersWithPlainPasswords) {
      try {
        console.log(`  Processing ${user.email}...`)
        
        const hashedPassword = await bcrypt.hash(user.password, 12)
        
        const { error: updateError } = await supabase
          .from('users')
          .update({ password: hashedPassword })
          .eq('id', user.id)
        
        if (updateError) {
          console.error(`    ❌ Error updating ${user.email}:`, updateError.message)
        } else {
          console.log(`    ✅ Updated ${user.email}`)
        }
        
      } catch (hashError) {
        console.error(`    ❌ Error hashing password for ${user.email}:`, hashError.message)
      }
    }
    
    console.log('\n✅ Password fix process completed!')
    console.log('🧪 Test login with your credentials to verify everything works')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Executar
fixPasswords()