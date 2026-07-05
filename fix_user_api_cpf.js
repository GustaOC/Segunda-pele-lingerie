const fs = require('fs');
let content = fs.readFileSync('app/api/admin/user/route.ts', 'utf8');
content = content.replace(
    "telefone: profile?.telefone,",
    "telefone: profile?.telefone,\n            cpf: profile?.cpf,"
);
// replace again for the second occurrence (the remaining profiles part)
content = content.replace(
    "telefone: profile.telefone,",
    "telefone: profile.telefone,\n            cpf: profile.cpf,"
);
fs.writeFileSync('app/api/admin/user/route.ts', content);
