const fs = require('fs');

let content = fs.readFileSync('app/api/admin/user/route.ts', 'utf8');

const queryMatch = `const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*');`;

const queryReplace = `const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*');

    const { data: clientesData } = await supabaseAdmin
      .from('clientes')
      .select('user_id, cpf');
    
    const clientesMap = new Map((clientesData || []).map(c => [c.user_id, c.cpf]));`;
content = content.replace(queryMatch, queryReplace);

const authUserCpfMatch = `cpf: profile?.cpf,`;
const authUserCpfReplace = `cpf: clientesMap.get(user.id),`;
content = content.replace(authUserCpfMatch, authUserCpfReplace);

const profileCpfMatch = `cpf: profile.cpf,`;
const profileCpfReplace = `cpf: clientesMap.get(profile.id),`;
content = content.replace(profileCpfMatch, profileCpfReplace);

fs.writeFileSync('app/api/admin/user/route.ts', content);
console.log("Updated api user route to fetch cpf from clientes table.");
