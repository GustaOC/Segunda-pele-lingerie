const fs = require('fs');
let content = fs.readFileSync('app/admin/(protected)/dashboard/DashboardClient.tsx', 'utf8');

if (!content.includes('import { CadastroClienteModal }')) {
    content = content.replace(
        'import ShaderBackground',
        'import { CadastroClienteModal } from "../../components/CadastroClienteModal";\nimport ShaderBackground'
    );
}

if (!content.includes('const [showClientModal, setShowClientModal] = useState(false);')) {
    content = content.replace(
        'const [showPendingModal, setShowPendingModal] = useState(false);',
        'const [showPendingModal, setShowPendingModal] = useState(false);\n    const [showClientModal, setShowClientModal] = useState(false);'
    );
}

if (!content.includes('Cadastros Clientes')) {
    const btnHtml = `                                    <Button onClick={() => setShowClientModal(true)} variant="ghost" className="w-full justify-start text-slate-700 hover:bg-purple-50 hover:text-purple-700 py-5 border border-white/30 rounded-2xl transition-all duration-300">
                                        <UserCheck className="w-4 h-4 mr-3" style={{ color: "#5D3A5B" }} />
                                        <div className="text-left">
                                            <div className="font-medium" style={{ fontFamily: "var(--font-inter)" }}>Cadastros Clientes</div>
                                            <div className="text-xs text-slate-500" style={{ fontFamily: "var(--font-inter)" }}>Registrar novo cliente</div>
                                        </div>
                                    </Button>`;
    content = content.replace(
        '<CardContent className="space-y-3">',
        `<CardContent className="space-y-3">\n${btnHtml}`
    );
}

if (!content.includes('<CadastroClienteModal')) {
    content = content.replace(
        '{/* Modal de Relatório Detalhado */}',
        `<CadastroClienteModal open={showClientModal} onOpenChange={setShowClientModal} onSuccess={() => {
        toast({ title: "Sucesso", description: "Cliente cadastrado com sucesso!" });
      }} />

      {/* Modal de Relatório Detalhado */}`
    );
    
    // Just in case it wasn't named that way in English/Portuguese:
    content = content.replace(
        '<Dialog open={showDetailedReportModal}',
        `<CadastroClienteModal open={showClientModal} onOpenChange={setShowClientModal} onSuccess={() => {
        toast({ title: "Sucesso", description: "Cliente cadastrado com sucesso!" });
      }} />

      <Dialog open={showDetailedReportModal}`
    );
}

fs.writeFileSync('app/admin/(protected)/dashboard/DashboardClient.tsx', content);
console.log("Updated DashboardClient.tsx");
