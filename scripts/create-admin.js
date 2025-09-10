// scripts/create-admin.js
const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas')
  console.log('Certifique-se de que .env.local contém:')
  console.log('- NEXT_PUBLIC_SUPABASE_URL')
  console.log('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createAdmin() {
  try {
    const email = 'admin@segundapele.com'
    const password = 'admin123'
    const hashedPassword = await bcrypt.hash(password, 10)

    console.log('🔄 Criando usuário admin...')
    console.log('Email:', email)
    console.log('Senha:', password)
    console.log('Hash gerado:', hashedPassword)

    // Primeiro, verificar se o usuário já existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (existingUser) {
      console.log('⚠️  Usuário já existe. Atualizando senha...')
      
      const { data, error } = await supabase
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
        return
      }

      console.log('✅ Senha atualizada com sucesso!')
    } else {
      console.log('📝 Criando novo usuário...')
      
      const { data, error } = await supabase
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
        console.error('❌ Erro ao criar usuário:', error)
        return
      }

      console.log('✅ Usuário admin criado com sucesso!')
    }

    console.log('\n📋 Informações de login:')
    console.log('------------------------')
    console.log('Email:', email)
    console.log('Senha:', password)
    console.log('------------------------')
    console.log('\n⚠️  IMPORTANTE: Mude a senha após o primeiro login!')

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

// Executar
createAdmin()