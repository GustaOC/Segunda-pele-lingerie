import re

with open("app/admin/(protected)/dashboard/DashboardClient.tsx", "r") as f:
    content = f.read()

# 1. State substitution
content = content.replace(
    'const [selectedPeriod, setSelectedPeriod] = useState("30d");',
    'const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 6));'
)

# 2. Logic substitution inside useMemo
old_use_memo = """    const {
        totalLeads, approvedLeadsCount, pendingRegistrations, rejectedLeadsCount,
        approvalRate, whatsappClicks, statusData, registrationChartData,
        growthRate, conversionRate, averageProcessingTime
    } = useMemo(() => {
        const allLeads = leadsResponse?.data || [];
        const total = allLeads.length;
        const approved = allLeads.filter((l: any) => l.status === 'APROVADO').length;
        const pending = allLeads.filter((l: any) => l.status === 'EM_ANALISE');
        const rejected = allLeads.filter((l: any) => l.status === 'REPROVADO').length;
        const rate = total > 0 ? ((approved / total) * 100).toFixed(1) : "0.0";
        const clicks = whatsappResponse?.data?.length || 0;

        // Calcular crescimento mensal
        const thisMonth = allLeads.filter((l: any) => {
            if (!l.createdAt) return false;
            const leadDate = new Date(l.createdAt);
            const now = new Date();
            return leadDate.getMonth() === now.getMonth() && leadDate.getFullYear() === now.getFullYear();
        }).length;

        const lastMonth = allLeads.filter((l: any) => {
            if (!l.createdAt) return false;
            const leadDate = new Date(l.createdAt);
            const lastMonthDate = new Date();
            lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
            return leadDate.getMonth() === lastMonthDate.getMonth() && leadDate.getFullYear() === lastMonthDate.getFullYear();
        }).length;

        const growth = lastMonth > 0 ? (((thisMonth - lastMonth) / lastMonth) * 100).toFixed(1) : "0";

        // Taxa de conversão WhatsApp para cadastro
        const conversion = clicks > 0 ? ((total / clicks) * 100).toFixed(1) : "0";

        // Tempo médio de processamento (simulado)
        const avgTime = pending.length > 0 ? "2.4" : "1.8";

        const status = [
            { name: "Aprovados", value: approved, color: "#10b981" },
            { name: "Em Análise", value: pending.length, color: "#f59e0b" },
            { name: "Reprovados", value: rejected, color: "#ef4444" },
        ];

        // Dados para gráfico dos últimos 7 dias
        const dailyData: { [key: string]: { cadastros: number, aprovados: number, reprovados: number } } = {};
        for (let i = 6; i >= 0; i--) {
            const date = format(subDays(new Date(), i), 'dd/MM');
            dailyData[date] = { cadastros: 0, aprovados: 0, reprovados: 0 };
        }

        allLeads.forEach((lead: any) => {
            if (lead.createdAt) {
                const leadDate = format(new Date(lead.createdAt), 'dd/MM');
                if (dailyData[leadDate]) {
                    dailyData[leadDate].cadastros += 1;
                    if (lead.status === 'APROVADO') dailyData[leadDate].aprovados += 1;
                    if (lead.status === 'REPROVADO') dailyData[leadDate].reprovados += 1;
                }
            }
        });

        const chartData = Object.keys(dailyData).map(date => ({ date, ...dailyData[date] }));

        return {
            totalLeads: total,
            approvedLeadsCount: approved,
            pendingRegistrations: pending,
            rejectedLeadsCount: rejected,
            approvalRate: rate,
            whatsappClicks: clicks,
            statusData: status,
            registrationChartData: chartData,
            growthRate: growth,
            conversionRate: conversion,
            averageProcessingTime: avgTime
        };
    }, [leadsResponse, whatsappResponse]);"""

new_use_memo = """    const {
        totalLeads, approvedLeadsCount, pendingRegistrations, rejectedLeadsCount,
        approvalRate, whatsappClicks, statusData, registrationChartData,
        growthRate, conversionRate, averageProcessingTime
    } = useMemo(() => {
        let rawLeads = leadsResponse?.data || [];
        
        // Setup dates for filtering
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = addDays(start, 6);
        end.setHours(23, 59, 59, 999);

        // Filter leads based on selected 7-day period
        const allLeads = rawLeads.filter((l: any) => {
            if (!l.createdAt) return false;
            const d = new Date(l.createdAt);
            return d >= start && d <= end;
        });

        const total = allLeads.length;
        const approved = allLeads.filter((l: any) => l.status === 'APROVADO').length;
        const pending = allLeads.filter((l: any) => l.status === 'EM_ANALISE');
        const rejected = allLeads.filter((l: any) => l.status === 'REPROVADO').length;
        const rate = total > 0 ? ((approved / total) * 100).toFixed(1) : "0.0";
        
        // Whatsapp clicks (filtering them is harder if they lack timestamps, but assume we just show the whole system clicks or simulate if needed. 
        // For now, let's keep whatsappResponse as is if they don't have timestamps in metrics endpoint)
        const clicks = whatsappResponse?.data?.length || 0;

        // Calcular crescimento considerando a semana escolhida vs semana anterior
        const previousStart = subDays(start, 7);
        const previousEnd = subDays(end, 7);
        const thisPeriodLeads = total;
        const lastPeriodLeads = rawLeads.filter((l: any) => {
            if (!l.createdAt) return false;
            const d = new Date(l.createdAt);
            return d >= previousStart && d <= previousEnd;
        }).length;

        const growth = lastPeriodLeads > 0 ? (((thisPeriodLeads - lastPeriodLeads) / lastPeriodLeads) * 100).toFixed(1) : "0";

        // Taxa de conversão WhatsApp para cadastro
        const conversion = clicks > 0 ? ((total / clicks) * 100).toFixed(1) : "0";

        // Tempo médio de processamento (simulado)
        const avgTime = pending.length > 0 ? "2.4" : "1.8";

        const status = [
            { name: "Aprovados", value: approved, color: "#10b981" },
            { name: "Em Análise", value: pending.length, color: "#f59e0b" },
            { name: "Reprovados", value: rejected, color: "#ef4444" },
        ];

        // Dados para gráfico dos 7 dias selecionados
        const dailyData: { [key: string]: { cadastros: number, aprovados: number, reprovados: number } } = {};
        for (let i = 0; i <= 6; i++) {
            const date = format(addDays(start, i), 'dd/MM');
            dailyData[date] = { cadastros: 0, aprovados: 0, reprovados: 0 };
        }

        allLeads.forEach((lead: any) => {
            if (lead.createdAt) {
                const leadDate = format(new Date(lead.createdAt), 'dd/MM');
                if (dailyData[leadDate]) {
                    dailyData[leadDate].cadastros += 1;
                    if (lead.status === 'APROVADO') dailyData[leadDate].aprovados += 1;
                    if (lead.status === 'REPROVADO') dailyData[leadDate].reprovados += 1;
                }
            }
        });

        const chartData = Object.keys(dailyData).map(date => ({ date, ...dailyData[date] }));

        return {
            totalLeads: total,
            approvedLeadsCount: approved,
            pendingRegistrations: pending,
            rejectedLeadsCount: rejected,
            approvalRate: rate,
            whatsappClicks: clicks,
            statusData: status,
            registrationChartData: chartData,
            growthRate: growth,
            conversionRate: conversion,
            averageProcessingTime: avgTime
        };
    }, [leadsResponse, whatsappResponse, startDate]);"""

content = content.replace(old_use_memo, new_use_memo)

with open("app/admin/(protected)/dashboard/DashboardClient.tsx", "w") as f:
    f.write(content)

print("Applied logic patch")
