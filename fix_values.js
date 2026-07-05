const fs = require('fs');

// Fix vendas page
let vendasContent = fs.readFileSync('app/admin/(protected)/vendas/page.tsx', 'utf8');
vendasContent = vendasContent.replace(
    'value={client.nome}',
    'value={`${client.nome} ${client.id}`}'
);
fs.writeFileSync('app/admin/(protected)/vendas/page.tsx', vendasContent);

// Fix CadastroClienteModal
let modalContent = fs.readFileSync('app/admin/components/CadastroClienteModal.tsx', 'utf8');
modalContent = modalContent.replace(
    'value={u.nome + " " + u.email}',
    'value={`${u.nome} ${u.email} ${u.id}`}'
);
fs.writeFileSync('app/admin/components/CadastroClienteModal.tsx', modalContent);

console.log("Fixed values in both files");
