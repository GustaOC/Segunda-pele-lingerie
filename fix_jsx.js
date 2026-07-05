const fs = require('fs');
let content = fs.readFileSync('app/admin/(protected)/dashboard/DashboardClient.tsx', 'utf8');

const wrongModalString = `        </div>
        <CadastroClienteModal open={showClientModal} onOpenChange={setShowClientModal} onSuccess={() => {
            toast({ title: "Sucesso", description: "Cliente cadastrado com sucesso!" });
        }} />
    );
}`;

const correctModalString = `            <CadastroClienteModal open={showClientModal} onOpenChange={setShowClientModal} onSuccess={() => {
                toast({ title: "Sucesso", description: "Cliente cadastrado com sucesso!" });
            }} />
        </div>
    );
}`;

content = content.replace(wrongModalString, correctModalString);
fs.writeFileSync('app/admin/(protected)/dashboard/DashboardClient.tsx', content);
console.log("Fixed JSX");
