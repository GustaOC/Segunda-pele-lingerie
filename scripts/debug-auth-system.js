// scripts/debug-auth-system.js
// Execute: node scripts/debug-auth-system.js

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugAuthSystem() {
  console.log('🔍 Debugging Sistema de Autenticação\n')

  // 1. Verificar tabelas existentes
  console.log('1. Verificando tabelas existentes...')
  
  try {
    // Verificar tabela profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
    
    if (profilesError) {
      if (profilesError.code === 'PGRST116') {
        console.log('❌ Tabela "profiles" NÃO EXISTE')
      } else {
        console.log('❌ Erro na tabela profiles:', profilesError.message)
      }
    } else {
      console.log('✅ Tabela "profiles" existe')
      console.log('   Estrutura encontrada:', Object.keys(profiles[0] || {}))
    }
  } catch (err) {
    console.log('❌ Erro ao verificar tabela profiles:', err.message)
  }

  try {
    // Verificar tabela users customizada
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1)
    
    if (usersError) {
      if (usersError.code === 'PGRST116') {
        console.log('❌ Tabela "users" customizada NÃO EXISTE')
      } else {
        console.log('❌ Erro na tabela users:', usersError.message)
      }
    } else {
      console.log('✅ Tabela "users" customizada existe')
      console.log('   Estrutura encontrada:', Object.keys(users[0] || {}))
    }
  } catch (err) {
    console.log('❌ Erro ao verificar tabela users:', err.message)
  }

  console.log('\n2. Verificando usuários no Supabase Auth...')
  
  try {
    // Listar usuários no auth.users (requer service key)
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.log('❌ Erro ao listar usuários auth:', authError.message)
    } else {
      console.log(`✅ ${authUsers.users.length} usuários encontrados no Supabase Auth`)
      
      for (const user of authUsers.users) {
        console.log(`   - ${user.email} (ID: ${user.id})`)
        
        // Verificar se tem perfil correspondente
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        
        if (profile) {
          console.log(`     ✅ Perfil encontrado: role = ${profile.role}`)
        } else {
          console.log(`     ❌ PERFIL NÃO ENCONTRADO - Esse é o problema!`)
        }
      }
    }
  } catch (err) {
    console.log('❌ Erro ao verificar auth users:', err.message)
  }

  console.log('\n3. Testando autenticação com credenciais...')
  
  // Aqui você pode testar com credenciais específicas
  const testEmail = 'admin@exemplo.com' // Substitua pelo email que está tentando usar
  const testPassword = 'senha123' // Substitua pela senha
  
  if (testEmail && testPassword) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      })
      
      if (error) {
        console.log(`❌ Erro de login: ${error.message}`)
      } else {
        console.log(`✅ Login funcionou para: ${data.user.email}`)
        
        // Verificar perfil
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()
        
        if (profile) {
          console.log(`✅ Perfil encontrado:`, profile)
        } else {
          console.log(`❌ Usuário autenticado MAS sem perfil na tabela profiles`)
        }
        
        // Fazer logout
        await supabase.auth.signOut()
      }
    } catch (err) {
      console.log('❌ Erro no teste de login:', err.message)
    }
  }

  console.log('\n🎯 DIAGNÓSTICO COMPLETO')
}

debugAuthSystem().catch(console.error)