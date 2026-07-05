const fs = require('fs');
let content = fs.readFileSync('app/admin/(protected)/dashboard/DashboardClient.tsx', 'utf8');

const wrongModalString = `                                    <CadastroClienteModal open={showClientModal} onOpenChange={setShowClientModal} onSuccess={() => {\n                                      toast({ title: "Sucesso", description: "Cliente cadastrado com sucesso!" });\n                                    }} />\n\n`;

content = content.replace(wrongModalString, '');

const insertionPoint = `        </div>
    );
}`;
const correctModalString = `        </div>
        <CadastroClienteModal open={showClientModal} onOpenChange={setShowClientModal} onSuccess={() => {
            toast({ title: "Sucesso", description: "Cliente cadastrado com sucesso!" });
        }} />
    );
}`;

content = content.replace(insertionPoint, correctModalString);

fs.writeFileSync('app/admin/(protected)/dashboard/DashboardClient.tsx', content);
console.log("Fixed successfully");
