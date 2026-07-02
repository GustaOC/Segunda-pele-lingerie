import re

with open("app/admin/(protected)/dashboard/DashboardClient.tsx", "r") as f:
    content = f.read()

old_report = """    // Função para calcular relatório detalhado
    const generateDetailedReport = useMemo(() => {
        const today = new Date();
        const startOfThisMonth = startOfMonth(today);
        const endOfThisMonth = endOfMonth(today);

        return {
            periodo: `${format(startOfThisMonth, "dd/MM/yyyy", { locale: ptBR })} - ${format(endOfThisMonth, "dd/MM/yyyy", { locale: ptBR })}`,"""

new_report = """    // Função para calcular relatório detalhado
    const generateDetailedReport = useMemo(() => {
        const endOfPeriod = addDays(startDate, 6);

        return {
            periodo: `${format(startDate, "dd/MM/yyyy", { locale: ptBR })} - ${format(endOfPeriod, "dd/MM/yyyy", { locale: ptBR })}`,"""

content = content.replace(old_report, new_report)

# I should also fix the dependency array for generateDetailedReport to include startDate
old_deps = "}, [totalLeads, approvedLeadsCount, rejectedLeadsCount, pendingRegistrations.length, approvalRate, growthRate, averageProcessingTime, whatsappClicks, conversionRate]);"
new_deps = "}, [totalLeads, approvedLeadsCount, rejectedLeadsCount, pendingRegistrations.length, approvalRate, growthRate, averageProcessingTime, whatsappClicks, conversionRate, startDate]);"

content = content.replace(old_deps, new_deps)

with open("app/admin/(protected)/dashboard/DashboardClient.tsx", "w") as f:
    f.write(content)

print("Applied report period fix")
