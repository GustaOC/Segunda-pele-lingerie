const fs = require('fs');
let content = fs.readFileSync('app/admin/(protected)/vendas/page.tsx', 'utf8');

// Replace the allPeople block
const oldAllPeopleBlock = `          const allPeople: any[] = []
          if (usersRes.data) {
            allPeople.push(...usersRes.data.map((u: any) => ({ id: u.id, nome: u.nome || 'Sem Nome', role: u.role || 'Usuário' })))
          }
          if (reselRes.data) {
            allPeople.push(...reselRes.data.map((r: any) => ({ id: r.id, nome: r.name || 'Sem Nome', role: 'Revendedora' })))
          }
          if (consultRes.data) {
            allPeople.push(...consultRes.data.map((c: any) => ({ id: c.id, nome: c.name || 'Sem Nome', role: 'Consultora/Lead' })))
          }
          setClients(allPeople)`;

const newAllPeopleBlock = `          const allPeople: any[] = []
          if (usersRes.data) {
            // Only add users whose role is USER (Clients)
            const clientsOnly = usersRes.data.filter((u: any) => u.role === 'USER');
            allPeople.push(...clientsOnly.map((u: any) => ({ id: u.id, nome: u.nome || u.email || 'Sem Nome', role: 'Cliente' })))
          }
          setClients(allPeople)`;

content = content.replace(oldAllPeopleBlock, newAllPeopleBlock);

// Also replace the label
content = content.replace('Pessoa Registrada (Cliente/Promotor) *', 'Cliente Registrado *');

fs.writeFileSync('app/admin/(protected)/vendas/page.tsx', content);
console.log("Fixed clients filter in vendas");
