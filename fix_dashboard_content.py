import re

with open("app/admin/(protected)/dashboard/DashboardClient.tsx", "r") as f:
    content = f.read()

# Hide Metas do Mes
content = re.sub(
    r'(<Card className="border border-white/50 bg-white/70 backdrop-blur-lg shadow-xl rounded-2xl">\n\s*<CardHeader className="pb-3">\n\s*<CardTitle className="flex items-center text-lg text-slate-800" style={{ fontFamily: "var\(--font-playfair\)" }}>\n\s*<Target.*?Metas do Mês\n\s*</CardTitle>\n\s*</CardHeader>\n\s*<CardContent className="space-y-4">.*?% da meta atingida\n\s*</p>\n\s*</div>\n\s*</CardContent>\n\s*</Card>)',
    r'{!isPromoter && (\n                            \1\n                            )}',
    content,
    flags=re.DOTALL
)

# Hide Gerenciador WhatsApp (we can match "Gerenciador WhatsApp" until "</Card>")
content = re.sub(
    r'(<Card className="border border-white/50 bg-white/70 backdrop-blur-lg shadow-xl rounded-2xl">\n\s*<CardHeader className="pb-3">\n\s*<CardTitle className="flex items-center text-lg text-slate-800" style={{ fontFamily: "var\(--font-playfair\)" }}>\n\s*<MessageSquare.*?Gerenciador WhatsApp\n\s*</CardTitle>\n\s*</CardHeader>.*?Acessar Ferramenta.*?Bloqueado.*?</div>\n\s*</Button>\n\s*)\)}',
    r'{!isPromoter && (\n                            \1)}\n                            )}',
    content,
    flags=re.DOTALL
)
# Wait, the previous patch already replaced the Link for Whatsapp to a disabled button!
# Let me just match from <Card ...> to </Card> for Gerenciador WhatsApp
content = re.sub(
    r'(<Card className="border border-white/50 bg-white/70 backdrop-blur-lg shadow-xl rounded-2xl">\n\s*<CardHeader className="pb-3">\n\s*<CardTitle className="flex items-center text-lg text-slate-800" style={{ fontFamily: "var\(--font-playfair\)" }}>\n\s*<MessageSquare.*?Gerenciador WhatsApp.*?</div>\n\s*</CardContent>\n\s*</Card>)',
    r'{!isPromoter && (\n                            \1\n                            )}',
    content,
    flags=re.DOTALL
)


# Hide Graficos Principais (match the div grid below it)
content = re.sub(
    r'(\{/\* Gráficos principais \*/\}\n\s*<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">\n\s*<Card className="col-span-1 lg:col-span-2 border border-white/50 bg-white/70 backdrop-blur-lg shadow-xl rounded-2xl">.*?</div>)',
    r'{!isPromoter && (\n                        \1\n                        )}',
    content,
    flags=re.DOTALL
)
# Note: I need to be careful with the end of Graficos principais. It ends just before `</TabsContent>` for `overview`.
content = re.sub(
    r'(\{/\* Gráficos principais \*/\}.*?</Card>\n\s*</div>)',
    r'{!isPromoter && (\n                        \1\n                        )}',
    content,
    flags=re.DOTALL
)


# Hide TabsContent registrations
content = re.sub(
    r'(<TabsContent value="registrations".*?</TabsContent>)',
    r'{!isPromoter && (\n                    \1\n                    )}',
    content,
    flags=re.DOTALL
)

# Hide TabsContent analytics
content = re.sub(
    r'(<TabsContent value="analytics".*?</TabsContent>)',
    r'{!isPromoter && (\n                    \1\n                    )}',
    content,
    flags=re.DOTALL
)

# Hide TabsContent geography
content = re.sub(
    r'(<TabsContent value="geography".*?</TabsContent>)',
    r'{!isPromoter && (\n                    \1\n                    )}',
    content,
    flags=re.DOTALL
)

with open("app/admin/(protected)/dashboard/DashboardClient.tsx", "w") as f:
    f.write(content)

print("Fixed content")
