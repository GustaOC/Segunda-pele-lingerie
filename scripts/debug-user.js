// scripts/debug-user.js
const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')
const readline = require('readline')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function askPassword(question) {
  return new Promise((resolve) => {
    const stdin = process.stdin
    stdin.setRawMode(true)
    stdin.resume()
    stdin.setEncoding('utf8')
    
    process.stdout.write(question)
    
    let password = ''
    
    stdin.on('data', function(char) {
      char = char + ''
      
      switch (char) {
        case '\n':
        case '\r':
        case '\u0004':
          stdin.setRawMode(false)
          stdin.pause()
          process.stdout.write('\n')
          resolve(password)
          break
        case '\u0003':
          process.exit()
          break
        case '\u007f': // backspace
          if (password.length > 0) {
            password = password.slice(0, -1)
            process.stdout.write('\b \b')
          }
          break
        default:
          password += char
          process.stdout.write('*')
          break
      }
    })
  })
}

async function debugUser() {
  const email = 'admin@segundapele.com'
  
  console.log(`🔍 Debugging user: ${email}\n`)
  
  try {
    // Buscar o usuário específico
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()
    
    if (error) {
      console.error('❌ Error finding user:', error.message)
      rl.close()
      return
    }
    
    if (!user) {
      console.log('❌ User not found in database')
      rl.close()
      return
    }
    
    console.log('✅ User found in database:')
    console.log(`   ID: ${user.id}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Nome: ${user.nome}`)
    console.log(`   Role: ${user.role}`)
    console.log(`   Ativo: ${user.ativo}`)
    console.log(`   Created: ${user.createdAt}`)
    console.log(`   Updated: ${user.updatedAt}`)
    
    // Verificar senha
    if (!user.password) {
      console.log('❌ User has no password set!')
      rl.close()
      return
    }
    
    console.log('\n🔐 Password Analysis:')
    console.log(`   Password length: ${user.password.length}`)
    console.log(`   Password starts with: ${user.password.substring(0, 10)}...`)
    console.log(`   Is bcrypt hash: ${user.password.startsWith('$2') ? 'YES' : 'NO'}`)
    
    if (!user.password.startsWith('$2')) {
      console.log('⚠️  Password appears to be in plain text!')
      console.log('🔧 Let me hash it properly...')
      
      const hashedPassword = await bcrypt.hash(user.password, 12)
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ password: hashedPassword })
        .eq('id', user.id)
      
      if (updateError) {
        console.error('❌ Error updating password:', updateError.message)
      } else {
        console.log('✅ Password hashed and updated!')
        console.log('🧪 Try logging in again now.')
      }
      
      rl.close()
      return
    }
    
    // Se a senha já está hasheada, vamos testar
    console.log('\n🧪 Password Testing:')
    const testPassword = await askPassword('Enter the password you are trying to use: ')
    
    console.log('\n⏳ Testing password...')
    
    try {
      const isValid = await bcrypt.compare(testPassword, user.password)
      
      if (isValid) {
        console.log('✅ Password is CORRECT! The issue must be elsewhere.')
        console.log('🔍 Possible issues:')
        console.log('   - Check if user is active (ativo = true)')
        console.log('   - Check NextAuth configuration')
        console.log('   - Check network/CORS issues')
      } else {
        console.log('❌ Password is INCORRECT!')
        console.log('🔧 Options:')
        console.log('   1. Use the correct password')
        console.log('   2. Reset the password for this user')
        
        const reset = await new Promise(resolve => {
          rl.question('\nDo you want to reset the password? (y/N): ', resolve)
        })
        
        if (reset.toLowerCase() === 'y') {
          const newPassword = await askPassword('Enter new password: ')
          
          if (newPassword.length < 6) {
            console.log('\n❌ Password must be at least 6 characters')
          } else {
            console.log('\n🔐 Hashing new password...')
            const hashedPassword = await bcrypt.hash(newPassword, 12)
            
            const { error: updateError } = await supabase
              .from('users')
              .update({ password: hashedPassword })
              .eq('id', user.id)
            
            if (updateError) {
              console.error('❌ Error updating password:', updateError.message)
            } else {
              console.log('✅ Password updated successfully!')
              console.log('🧪 Try logging in with the new password.')
            }
          }
        }
      }
      
    } catch (bcryptError) {
      console.error('❌ Error testing password:', bcryptError.message)
      console.log('This might indicate the stored hash is corrupted.')
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  } finally {
    rl.close()
  }
}

// Executar
debugUser()