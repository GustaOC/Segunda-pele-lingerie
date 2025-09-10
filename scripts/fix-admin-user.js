// scripts/fix-admin-user.js
const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixAdminUser() {
  const email = 'admin@segundapele.com'
  
  console.log(`🔧 Fixing admin user: ${email}`)
  
  try {
    // Buscar o usuário
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()
    
    if (error || !user) {
      console.log('❌ User not found. Creating new admin user...')
      
      // Criar novo usuário admin
      const hashedPassword = await bcrypt.hash('admin123', 12)
      
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          email: email,
          nome: 'Administrador',
          password: hashedPassword,
          role: 'ADMIN',
          ativo: true
        })
        .select()
        .single()
      
      if (createError) {
        console.error('❌ Error creating user:', createError.message)
        return
      }
      
      console.log('✅ New admin user created!')
      console.log('📋 Login credentials:')
      console.log(`   Email: ${email}`)
      console.log(`   Password: admin123`)
      console.log('⚠️  Please change this password after first login!')
      return
    }
    
    console.log('✅ User found in database')
    console.log(`   Nome: ${user.nome}`)
    console.log(`   Role: ${user.role}`)
    console.log(`   Ativo: ${user.ativo}`)
    
    // Verificar se está ativo
    if (!user.ativo) {
      console.log('🔧 Activating user...')
      await supabase
        .from('users')
        .update({ ativo: true })
        .eq('id', user.id)
      console.log('✅ User activated')
    }
    
    // Verificar senha
    if (!user.password) {
      console.log('❌ User has no password! Setting default password...')
    } else if (!user.password.startsWith('$2')) {
      console.log('⚠️  Password is not hashed. Current password:', user.password)
      console.log('🔧 Hashing existing password...')
    } else {
      console.log('✅ Password is properly hashed')
      console.log('🔧 Resetting to known password for testing...')
    }
    
    // Definir senha conhecida para teste
    const newPassword = 'admin123'
    console.log(`🔐 Setting password to: ${newPassword}`)
    
    const hashedPassword = await bcrypt.hash(newPassword, 12)
    
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        password: hashedPassword,
        ativo: true,
        role: 'ADMIN'
      })
      .eq('id', user.id)
    
    if (updateError) {
      console.error('❌ Error updating user:', updateError.message)
      return
    }
    
    console.log('✅ User updated successfully!')
    console.log('📋 Login credentials:')
    console.log(`   Email: ${email}`)
    console.log(`   Password: ${newPassword}`)
    console.log('')
    console.log('🧪 Now try logging in at /admin/login')
    console.log('⚠️  Remember to change the password after successful login!')
    
    // Testar a senha para confirmar
    console.log('\n🔍 Testing password hash...')
    const isValid = await bcrypt.compare(newPassword, hashedPassword)
    console.log(`   Hash test result: ${isValid ? '✅ VALID' : '❌ INVALID'}`)
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Executar
fixAdminUser()