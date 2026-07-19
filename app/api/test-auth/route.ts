// app/api/test-auth/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import bcrypt from 'bcryptjs'

export async function GET(req: NextRequest) {
  console.log('🔍 Iniciando teste de autenticação...')
  
  const results = {
    environment: {
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      nextAuthUrl: process.env.NEXTAUTH_URL,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseAnon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasSupabaseService: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    database: {
      connected: false,
      tableExists: false,
      users: [] as any[],
      error: null as any
    },
    testLogin: {
      userFound: false,
      passwordMatch: false,
      error: null as any
    }
  }

  try {
    // Teste 1: Verificar conexão com Supabase
    console.log('📡 Testando conexão com Supabase...')
    const { data: testConnection, error: connError } = await supabaseAdmin
      .from('users')
      .select('count')
      .limit(1)
    
    if (connError) {
      results.database.error = connError.message
      console.error('❌ Erro de conexão:', connError)
    } else {
      results.database.connected = true
      results.database.tableExists = true
      console.log('✅ Conexão OK')
    }

    // Teste 2: Buscar todos os usuários
    console.log('👥 Buscando usuários...')
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email, nome, role, created_at')
    
    if (usersError) {
      results.database.error = usersError.message
      console.error('❌ Erro ao buscar usuários:', usersError)
    } else {
      results.database.users = users || []
      console.log(`✅ ${users?.length || 0} usuários encontrados`)
    }

    // Teste 3: Testar login com admin@segundapele.com
    console.log('🔐 Testando login com admin@segundapele.com...')
    const testEmail = 'admin@segundapele.com'
    const testPassword = 'admin123'
    
    const { data: testUser, error: testUserError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', testEmail)
      .single()
    
    if (testUserError) {
      results.testLogin.error = `Usuário não encontrado: ${testUserError.message}`
      console.error('❌ Usuário não encontrado:', testUserError)
    } else if (testUser) {
      results.testLogin.userFound = true
      console.log('✅ Usuário encontrado:', testUser.email)
      
      // Verificar senha
      console.log('🔑 Verificando senha...')
      console.log('Hash no banco:', testUser.password)
      
      try {
        const isValid = await bcrypt.compare(testPassword, testUser.password)
        results.testLogin.passwordMatch = isValid
        
        if (isValid) {
          console.log('✅ Senha correta!')
        } else {
          console.log('❌ Senha incorreta')
          
          // Testar se o hash está correto
          const newHash = await bcrypt.hash(testPassword, 10)
          console.log('Novo hash gerado:', newHash)
          console.log('Hashes são iguais?', newHash === testUser.password)
        }
      } catch (err: any) {
        results.testLogin.error = `Erro ao verificar senha: ${err.message}`
        console.error('❌ Erro ao verificar senha:', err)
      }
    }

  } catch (error: any) {
    console.error('❌ Erro geral:', error)
    results.database.error = error.message
  }

  console.log('📊 Resultados do teste:', results)
  
  return NextResponse.json(results, { status: 200 })
}

export async function POST(req: NextRequest) {
  console.log('🔧 Criando/Atualizando usuário admin...')
  
  try {
    const email = 'admin@segundapele.com'
    const password = 'admin123'
    const hashedPassword = await bcrypt.hash(password, 10)
    
    // Verificar se usuário existe
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single()
    
    if (existingUser) {
      // Atualizar senha
      console.log('📝 Atualizando senha do usuário existente...')
      const { data, error } = await supabaseAdmin
        .from('users')
        .update({
          password: hashedPassword,
          role: 'ADMIN',
          updated_at: new Date().toISOString()
        })
        .eq('email', email)
        .select()
      
      if (error) {
        console.error('❌ Erro ao atualizar:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      
      console.log('✅ Senha atualizada!')
      return NextResponse.json({ 
        message: 'Senha atualizada com sucesso',
        hash: hashedPassword 
      })
    } else {
      // Criar novo usuário
      console.log('📝 Criando novo usuário admin...')
      const { data, error } = await supabaseAdmin
        .from('users')
        .insert({
          email: email,
          password: hashedPassword,
          nome: 'Administrador',
          role: 'ADMIN',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
      
      if (error) {
        console.error('❌ Erro ao criar:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      
      console.log('✅ Usuário criado!')
      return NextResponse.json({ 
        message: 'Usuário criado com sucesso',
        hash: hashedPassword 
      })
    }
  } catch (error: any) {
    console.error('❌ Erro:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}