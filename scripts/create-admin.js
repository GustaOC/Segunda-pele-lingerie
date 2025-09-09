const bcrypt = require('bcryptjs')

async function createAdminPassword() {
  const password = 'admin123'
  const hash = await bcrypt.hash(password, 10)
  console.log('Hash para senha admin123:')
  console.log(hash)
}

createAdminPassword()