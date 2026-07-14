const fs = require('fs');
const file = 'app/admin/(protected)/estoque/components/EstoquePromotores.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  "const [prodRes, invRes, usersRes] = await Promise.all([",
  "const [prodRes, invRes, usersRes, acertosRes] = await Promise.all([\n      supabase.from('promoter_acertos').select('promoter_id, period'),"
);

// wait, the array indexing will be wrong. Let's do it properly.
