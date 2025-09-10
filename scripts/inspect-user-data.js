// scripts/inspect-user-data.js
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function inspectUserData() {
  console.log('🔍 Inspecting user data for admin@segundapele.com\n')
  
  try {
    // Buscar o usuário específico
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@segundapele.com')
    
    if (error) {
      console.error('❌ Error querying database:', error)
      return
    }
    
    if (!user || user.length === 0) {
      console.log('❌ No user found with email admin@segundapele.com')
      
      // Verificar se existe com outro email similar
      console.log('\n🔍 Searching for similar emails...')
      const { data: similarUsers } = await supabase
        .from('users')
        .select('email')
        .ilike('email', '%admin%')
      
      if (similarUsers && similarUsers.length > 0) {
        console.log('📧 Found users with "admin" in email:')
        similarUsers.forEach(u => console.log(`   - ${u.email}`))
      }
      
      const { data: allUsers } = await supabase
        .from('users')
        .select('email, nome, role')
        .limit(10)
      
      if (allUsers && allUsers.length > 0) {
        console.log('\n👥 All users in database:')
        allUsers.forEach(u => console.log(`   - ${u.email} (${u.nome}) - ${u.role}`))
      }
      
      return
    }
    
    // Mostrar dados completos
    console.log('✅ User found! Raw data:')
    console.log('=====================================')
    console.log(JSON.stringify(user[0], null, 2))
    console.log('=====================================\n')
    
    const userData = user[0]
    
    // Análise detalhada
    console.log('📊 Detailed Analysis:')
    console.log(`   🆔 ID: ${userData.id}`)
    console.log(`   📧 Email: ${userData.email}`)
    console.log(`   👤 Nome: ${userData.nome}`)
    console.log(`   🎭 Role: ${userData.role}`)
    console.log(`   ✅ Ativo: ${userData.ativo}`)
    console.log(`   📅 Created: ${userData.createdAt}`)
    console.log(`   📝 Updated: ${userData.updatedAt}`)
    
    // Análise da senha
    console.log('\n🔐 Password Analysis:')
    if (!userData.password) {
      console.log('   ❌ NO PASSWORD SET!')
    } else {
      console.log(`   📏 Length: ${userData.password.length} characters`)
      console.log(`   🔤 First 20 chars: ${userData.password.substring(0, 20)}...`)
      console.log(`   🔑 Last 10 chars: ...${userData.password.substring(userData.password.length - 10)}`)
      console.log(`   🧂 Is bcrypt hash: ${userData.password.startsWith('$2') ? 'YES ✅' : 'NO ❌'}`)
      
      if (userData.password.startsWith('$2')) {
        // Análise do hash bcrypt
        const parts = userData.password.split('$')
        console.log(`   🔧 Bcrypt version: ${parts[1]}`)
        console.log(`   🎯 Rounds: ${parts[2]}`)
        console.log(`   🧂 Salt: ${parts[3].substring(0, 10)}...`)
      } else {
        console.log(`   ⚠️  Raw password: ${userData.password}`)
      }
    }
    
    // Verificar se há duplicatas
    console.log('\n🔍 Checking for duplicates...')
    const { data: duplicates } = await supabase
      .from('users')
      .select('id, email, nome')
      .eq('email', 'admin@segundapele.com')
    
    if (duplicates && duplicates.length > 1) {
      console.log(`   ⚠️  Found ${duplicates.length} users with same email!`)
      duplicates.forEach((dup, index) => {
        console.log(`   ${index + 1}. ID: ${dup.id} - Nome: ${dup.nome}`)
      })
    } else {
      console.log('   ✅ No duplicates found')
    }
    
    // Verificar estrutura da tabela
    console.log('\n🏗️  Table structure check...')
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_columns', { table_name: 'users' })
      .catch(() => null)
    
    if (tableInfo) {
      console.log('   📋 Columns found:', tableInfo.map(col => col.column_name).join(', '))
    } else {
      console.log('   ℹ️  Could not retrieve table structure (normal for some setups)')
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Executar
inspectUserData()