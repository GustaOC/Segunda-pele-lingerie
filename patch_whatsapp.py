import re

with open("app/admin/(protected)/dashboard/DashboardClient.tsx", "r") as f:
    content = f.read()

# 6. /admin/whatsapp
content = content.replace('<Link href="/admin/whatsapp">', '{!isPromoter ? (<Link href="/admin/whatsapp">')
content = content.replace('Acessar Ferramenta</div>\n                                                <div className="text-xs text-slate-500" style={{ fontFamily: "var(--font-inter)" }}>Clique aqui para começar</div>\n                                            </div>\n                                        </Button>\n                                    </Link>', 'Acessar Ferramenta</div>\n                                                <div className="text-xs text-slate-500" style={{ fontFamily: "var(--font-inter)" }}>Clique aqui para começar</div>\n                                            </div>\n                                        </Button>\n                                    </Link>) : (\n                                      <Button variant="ghost" disabled className="w-full justify-center text-slate-400 py-5 border border-white/30 rounded-2xl cursor-not-allowed">\n                                          <div className="text-center">\n                                              <div className="font-medium" style={{ fontFamily: "var(--font-inter)" }}>Acessar Ferramenta</div>\n                                              <div className="text-xs text-slate-400" style={{ fontFamily: "var(--font-inter)" }}>Bloqueado para promotores</div>\n                                          </div>\n                                      </Button>\n                                    )}')

with open("app/admin/(protected)/dashboard/DashboardClient.tsx", "w") as f:
    f.write(content)

print("WhatsApp patched")
