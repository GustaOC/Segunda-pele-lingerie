const fs = require('fs');
let content = fs.readFileSync('app/admin/(protected)/dashboard/DashboardClient.tsx', 'utf8');

// 1. Remove the modal from the incorrect position
const modalRegex = /<CadastroClienteModal[^>]*toast\([^)]*\);\s*\}\}\s*\/>\s*/;
content = content.replace(modalRegex, '');

// 2. Add it at the end of the return block, before the final </div>
const insertionPoint = '        </div>\n    );\n}';
const modalHtml = `
            <CadastroClienteModal open={showClientModal} onOpenChange={setShowClientModal} onSuccess={() => {
                toast({ title: "Sucesso", description: "Cliente cadastrado com sucesso!" });
            }} />
        </div>
    );
}`;

if (!content.includes('<CadastroClienteModal')) {
    content = content.replace(insertionPoint, modalHtml);
}

fs.writeFileSync('app/admin/(protected)/dashboard/DashboardClient.tsx', content);
console.log("Moved Modal to root level");
