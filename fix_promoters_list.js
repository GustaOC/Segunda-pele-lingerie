const fs = require('fs');

let content = fs.readFileSync('app/admin/(protected)/vendas/page.tsx', 'utf8');

const match = `if (usersRes.data) {
          let promotersList = usersRes.data.filter((u: any) => ['CONSULTANT', 'PROMOTOR', 'ADMIN'].includes(u.role))`;

const replace = `if (usersRes.data) {
          let promotersList = usersRes.data.filter((u: any) => ['CONSULTANT', 'PROMOTOR', 'ADMIN'].includes(u.role))
          
          if (consultRes && consultRes.data) {
            consultRes.data.forEach((c: any) => {
              if (!promotersList.find((p: any) => p.email === c.email || p.id === c.id)) {
                promotersList.push({ id: c.id, nome: c.name, email: c.email, role: 'CONSULTANT' });
              }
            });
          }`;

content = content.replace(match, replace);

fs.writeFileSync('app/admin/(protected)/vendas/page.tsx', content);
console.log("Updated promoters list to include consultants");
