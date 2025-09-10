// scripts/verify-setup.js
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

console.log('🔍 Verificando configuração...\n')

// 1. Verificar variáveis de ambiente
console.log('📋 Variáveis de Ambiente:')
console.log('------------------------')
console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? '✅ Configurado' : '❌ Não configurado')
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL || '❌ Não configurado')
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL || '❌ Não configurado')
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Configurado' : '❌ Não configurado')
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Configurado' : '❌ Não configurado')

// 2. Testar conexão com Supabase
async function testSupabase() {
  console.log('\n📡 Testando conexão com Supabase:')
  console.log('----------------------------------')
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('❌ Não é possível testar - variáveis não configuradas')
    return
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Testar leitura da tabela users
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)

    if (error) {
      console.log('❌ Erro ao conectar:', error.message)
      console.log('\n💡 Verifique se:')
      console.log('   - A tabela "users" existe no Supabase')
      console.log('   - As chaves de API estão corretas')
      console.log('   - O RLS está configurado corretamente')
    } else {
      console.log('✅ Conexão com Supabase OK!')
      
      // Verificar se existe algum admin
      const { data: admins, error: adminError } = await supabase
        .from('users')
        .select('email, role')
        .eq('role', 'ADMIN')

      if (!adminError) {
        if (admins && admins.length > 0) {
          console.log(`✅ ${admins.length} admin(s) encontrado(s):`)
          admins.forEach(admin => {
            console.log(`   - ${admin.email}`)
          })
        } else {
          console.log('⚠️  Nenhum admin encontrado. Execute: npm run create-admin')
        }
      }
    }
  } catch (err) {
    console.log('❌ Erro geral:', err.message)
  }
}

// 3. Verificar estrutura da tabela
async function checkTableStructure() {
  console.log('\n🏗️  Estrutura esperada da tabela "users":')
  console.log('----------------------------------------')
  console.log('- id (uuid ou text)')
  console.log('- email (text, unique)')
  console.log('- password (text)')
  console.log('- nome (text)')
  console.log('- role (text) - valores: ADMIN, USER')
  console.log('- created_at (timestamp)')
  console.log('- updated_at (timestamp)')
}

// Executar verificações
testSupabase().then(() => {
  checkTableStructure()
  console.log('\n✨ Verificação concluída!')
})