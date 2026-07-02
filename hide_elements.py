with open("app/admin/(protected)/dashboard/DashboardClient.tsx", "r") as f:
    content = f.read()

# 1. Funcionários Button
content = content.replace(
    'className="border-white/50 bg-white/50 text-slate-700 hover:bg-white hover:text-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl"\n                            >\n                                <Users className="w-4 h-4 mr-2" />\n                                Funcionários',
    'className={isPromoter ? "hidden" : "border-white/50 bg-white/50 text-slate-700 hover:bg-white hover:text-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl"}\n                            >\n                                <Users className="w-4 h-4 mr-2" />\n                                Funcionários'
)

# 2. Select and Input Controls
content = content.replace(
    '<div className="flex items-center gap-3 flex-wrap">',
    '<div className={isPromoter ? "hidden" : "flex items-center gap-3 flex-wrap"}>'
)

# 3. Metrics Cards (Total de Cadastros, etc.)
content = content.replace(
    '<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">',
    '<div className={isPromoter ? "hidden" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8"}>'
)

# 4. TabsList
content = content.replace(
    '<TabsList className="grid w-full grid-cols-4 bg-white/50 backdrop-blur-sm p-1 rounded-2xl border border-white/30">',
    '<TabsList className={isPromoter ? "hidden" : "grid w-full grid-cols-4 bg-white/50 backdrop-blur-sm p-1 rounded-2xl border border-white/30"}>'
)

# 5. Metas do Mês Card
content = content.replace(
    '<Card className="border border-white/50 bg-white/70 backdrop-blur-lg shadow-xl rounded-2xl">\n                                <CardHeader className="pb-3">\n                                    <CardTitle className="flex items-center text-lg text-slate-800" style={{ fontFamily: "var(--font-playfair)" }}>\n                                        <Target',
    '<Card className={isPromoter ? "hidden" : "border border-white/50 bg-white/70 backdrop-blur-lg shadow-xl rounded-2xl"}>\n                                <CardHeader className="pb-3">\n                                    <CardTitle className="flex items-center text-lg text-slate-800" style={{ fontFamily: "var(--font-playfair)" }}>\n                                        <Target'
)

# 6. Gerenciador WhatsApp Card
content = content.replace(
    '<Card className="border border-white/50 bg-white/70 backdrop-blur-lg shadow-xl rounded-2xl">\n                                <CardHeader className="pb-3">\n                                    <CardTitle className="flex items-center text-lg text-slate-800" style={{ fontFamily: "var(--font-playfair)" }}>\n                                        <MessageSquare',
    '<Card className={isPromoter ? "hidden" : "border border-white/50 bg-white/70 backdrop-blur-lg shadow-xl rounded-2xl"}>\n                                <CardHeader className="pb-3">\n                                    <CardTitle className="flex items-center text-lg text-slate-800" style={{ fontFamily: "var(--font-playfair)" }}>\n                                        <MessageSquare'
)

# 7. Gráficos Principais (in overview tab)
content = content.replace(
    '{/* Gráficos principais */}\n                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">',
    '{/* Gráficos principais */}\n                        <div className={isPromoter ? "hidden" : "grid grid-cols-1 lg:grid-cols-2 gap-6"}>'
)

# 8. TabsContent - since the TabsList is hidden, the user can't click to switch tabs, but we can also hide the content to be safe.
# Actually, just hiding the TabsList is enough because they can't switch tabs. 
# But let's hide the TabsContent sections just in case.
content = content.replace(
    '<TabsContent value="registrations" className="space-y-6">',
    '<TabsContent value="registrations" className={isPromoter ? "hidden" : "space-y-6"}>'
)
content = content.replace(
    '<TabsContent value="analytics" className="space-y-6">',
    '<TabsContent value="analytics" className={isPromoter ? "hidden" : "space-y-6"}>'
)
content = content.replace(
    '<TabsContent value="geography" className="space-y-6">',
    '<TabsContent value="geography" className={isPromoter ? "hidden" : "space-y-6"}>'
)

with open("app/admin/(protected)/dashboard/DashboardClient.tsx", "w") as f:
    f.write(content)

print("Applied hidden classNames")
