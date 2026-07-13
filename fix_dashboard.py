import re

with open("app/admin/(protected)/dashboard/DashboardClient.tsx", "r") as f:
    content = f.read()

# Add isPromoter
if "const isPromoter = " not in content:
    content = content.replace("const userRole = user.user_metadata?.role || 'Admin';", "const userRole = user.user_metadata?.role || 'Admin';\n    const isPromoter = userRole?.toUpperCase() === 'PROMOTOR';")

# 1. /admin/revendedoras
content = re.sub(
    r'(<Link href="/admin/revendedoras">.*?Gerenciar Consultoras</div>\n.*?<div className="text-xs text-slate-500" style={{ fontFamily: "var\(--font-inter\)" }}>{totalLeads} cadastradas</div>\n.*?</div>\n.*?</Button>\n.*?</Link>)',
    r'{!isPromoter ? (\1) : (\n                                      <Button variant="ghost" disabled className="w-full justify-start text-slate-400 py-5 border border-white/30 rounded-2xl cursor-not-allowed">\n                                          <Users className="w-4 h-4 mr-3 text-slate-300" />\n                                          <div className="text-left">\n                                              <div className="font-medium" style={{ fontFamily: "var(--font-inter)" }}>Gerenciar Consultoras</div>\n                                              <div className="text-xs text-slate-400" style={{ fontFamily: "var(--font-inter)" }}>Bloqueado</div>\n                                          </div>\n                                      </Button>\n                                    )}',
    content,
    flags=re.DOTALL
)

# 2. /admin/estoque
content = re.sub(
    r'(<Link href="/admin/estoque">.*?Estoque Geral</div>\n.*?<div className="text-xs text-slate-500" style={{ fontFamily: "var\(--font-inter\)" }}>Gestão do CD</div>\n.*?</div>\n.*?</Button>\n.*?</Link>)',
    r'{!isPromoter ? (\1) : (\n                                      <Button variant="ghost" disabled className="w-full justify-start text-slate-400 py-5 border border-white/30 rounded-2xl cursor-not-allowed">\n                                          <Package className="w-4 h-4 mr-3 text-slate-300" />\n                                          <div className="text-left">\n                                              <div className="font-medium" style={{ fontFamily: "var(--font-inter)" }}>Estoque Geral</div>\n                                              <div className="text-xs text-slate-400" style={{ fontFamily: "var(--font-inter)" }}>Bloqueado</div>\n                                          </div>\n                                      </Button>\n                                    )}',
    content,
    flags=re.DOTALL
)

# 3. /admin/vendas
content = re.sub(
    r'(<Link href="/admin/vendas">.*?PDV / Vendas</div>\n.*?<div className="text-xs text-slate-500" style={{ fontFamily: "var\(--font-inter\)" }}>Registrar saídas</div>\n.*?</div>\n.*?</Button>\n.*?</Link>)',
    r'{!isPromoter ? (\1) : (\n                                      <Button variant="ghost" disabled className="w-full justify-start text-slate-400 py-5 border border-white/30 rounded-2xl cursor-not-allowed">\n                                          <ShoppingCart className="w-4 h-4 mr-3 text-slate-300" />\n                                          <div className="text-left">\n                                              <div className="font-medium" style={{ fontFamily: "var(--font-inter)" }}>PDV / Vendas</div>\n                                              <div className="text-xs text-slate-400" style={{ fontFamily: "var(--font-inter)" }}>Bloqueado</div>\n                                          </div>\n                                      </Button>\n                                    )}',
    content,
    flags=re.DOTALL
)

# 4. Relatórios Detalhados
content = re.sub(
    r'(<Dialog open={showDetailedReportModal} onOpenChange={setShowDetailedReportModal}>.*?</Dialog>)',
    r'{!isPromoter ? (\1) : (\n                                      <Button variant="ghost" disabled className="w-full justify-start text-slate-400 py-5 border border-white/30 rounded-2xl cursor-not-allowed">\n                                          <FileText className="w-4 h-4 mr-3 text-slate-300" />\n                                          <div className="text-left">\n                                              <div className="font-medium" style={{ fontFamily: "var(--font-inter)" }}>Relatórios Detalhados</div>\n                                              <div className="text-xs text-slate-400" style={{ fontFamily: "var(--font-inter)" }}>Bloqueado</div>\n                                          </div>\n                                      </Button>\n                                    )}',
    content,
    flags=re.DOTALL,
    count=1
)

# 5. Relatório por Promotor
content = re.sub(
    r'(<Dialog open={showPromoterReportModal} onOpenChange={setShowPromoterReportModal}>.*?</Dialog>)',
    r'{!isPromoter ? (\1) : (\n                                      <Button variant="ghost" disabled className="w-full justify-start text-slate-400 py-5 border border-white/30 rounded-2xl cursor-not-allowed">\n                                          <FileSpreadsheet className="w-4 h-4 mr-3 text-slate-300" />\n                                          <div className="text-left">\n                                              <div className="font-medium" style={{ fontFamily: "var(--font-inter)" }}>Relatório por Promotor</div>\n                                              <div className="text-xs text-slate-400" style={{ fontFamily: "var(--font-inter)" }}>Bloqueado</div>\n                                          </div>\n                                      </Button>\n                                    )}',
    content,
    flags=re.DOTALL,
    count=1
)

# 6. /admin/whatsapp
content = re.sub(
    r'(<Link href="/admin/whatsapp">.*?Acessar Ferramenta</div>\n.*?<div className="text-xs text-slate-500" style={{ fontFamily: "var\(--font-inter\)" }}>Clique aqui para começar</div>\n.*?</div>\n.*?</Button>\n.*?</Link>)',
    r'{!isPromoter ? (\1) : (\n                                      <Button variant="ghost" disabled className="w-full justify-center text-slate-400 py-5 border border-white/30 rounded-2xl cursor-not-allowed">\n                                          <div className="text-center">\n                                              <div className="font-medium" style={{ fontFamily: "var(--font-inter)" }}>Acessar Ferramenta</div>\n                                              <div className="text-xs text-slate-400" style={{ fontFamily: "var(--font-inter)" }}>Bloqueado</div>\n                                          </div>\n                                      </Button>\n                                    )}',
    content,
    flags=re.DOTALL
)

with open("app/admin/(protected)/dashboard/DashboardClient.tsx", "w") as f:
    f.write(content)

print("Fixed")
