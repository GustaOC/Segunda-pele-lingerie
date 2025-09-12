// app/admin/(protected)/dashboard/DashboardClient.tsx
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import useSWR, { mutate } from 'swr';

// Componentes da UI
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
  Users, UserCheck, Clock, MessageCircle, LogOut, BarChart3, FileText, TrendingUp,
  Calendar, Search, AlertCircle, Download, Eye, FileSpreadsheet, Send, CheckCircle,
  XCircle, Loader2, RefreshCw, Mail, MapPin, Target, Activity, Filter
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line
} from "recharts";
import ShaderBackground from "@/components/shader-background";
import { Playfair_Display, Poppins } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import * as XLSX from 'xlsx';

// Fontes
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-playfair" });
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-poppins" });

// Função fetcher para o SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Dados mockados para funcionalidades avançadas
const whatsappHourlyData = [
  { hora: "08:00", cliques: 5 }, { hora: "10:00", cliques: 12 },
  { hora: "12:00", cliques: 18 }, { hora: "14:00", cliques: 25 },
  { hora: "16:00", cliques: 22 }, { hora: "18:00", cliques: 15 },
  { hora: "20:00", cliques: 8 }
];

const cityData = [
  { cidade: "Campo Grande", cadastros: 234, vendas: 450000 },
  { cidade: "Dourados", cadastros: 156, vendas: 320000 },
  { cidade: "Três Lagoas", cadastros: 98, vendas: 180000 },
  { cidade: "Corumbá", cadastros: 87, vendas: 165000 },
  { cidade: "Ponta Porã", cadastros: 76, vendas: 140000 }
];

const monthlyEvolution = [
  { mes: "Out", cadastros: 89, aprovados: 64, vendas: 287000 },
  { mes: "Nov", cadastros: 95, aprovados: 71, vendas: 312000 },
  { mes: "Dez", cadastros: 112, aprovados: 84, vendas: 398000 },
  { mes: "Jan", cadastros: 98, aprovados: 73, vendas: 356000 },
  { mes: "Fev", cadastros: 125, aprovados: 92, vendas: 445000 },
  { mes: "Mar", cadastros: 134, aprovados: 98, vendas: 478000 }
];

const promoters = ["Carlos Mendes", "Juliana Santos", "Roberto Silva", "Patricia Lima", "Anderson Costa"];


export default function DashboardClient({ user }: { user: User }) {
    const router = useRouter();
    const { toast } = useToast();

    // Estados
    const [selectedPeriod, setSelectedPeriod] = useState("30d");
    const [searchTerm, setSearchTerm] = useState("");
    const [showPendingModal, setShowPendingModal] = useState(false);
    const [showPromoterReportModal, setShowPromoterReportModal] = useState(false);
    const [selectedPromoter, setSelectedPromoter] = useState("all");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [isExporting, setIsExporting] = useState(false);
    const [whatsappNumber, setWhatsappNumber] = useState("");
    const [isUpdating, setIsUpdating] = useState<string | null>(null);
    const [exportFormat, setExportFormat] = useState("excel");

    // Busca de dados em tempo real
    const { data: leadsResponse, error: leadsError, mutate: mutateLeads } = useSWR('/api/leads/id', fetcher, { refreshInterval: 10000 });
    const { data: whatsappResponse, error: whatsappError } = useSWR('/api/metrics/whatsapp-clicks', fetcher, { refreshInterval: 30000 });

    // Processamento de dados
    const {
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
            { name: "Aprovados", value: approved, color: "#22c55e" },
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
    }, [leadsResponse, whatsappResponse]);
    
    const getStatusBadge = (status: string) => {
        switch (status) {
          case "EM_ANALISE":
            return <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">Em Análise</Badge>
          case "APROVADO":
            return <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Aprovado</Badge>
          case "REPROVADO":
            return <Badge className="bg-red-500/20 text-red-300 border-red-500/30">Reprovado</Badge>
          default:
            return <Badge variant="outline">{status}</Badge>
        }
    }

    // Função para calcular relatório detalhado
    const generateDetailedReport = useMemo(() => {
        const today = new Date();
        const startOfThisMonth = startOfMonth(today);
        const endOfThisMonth = endOfMonth(today);

        return {
            periodo: `${format(startOfThisMonth, "dd/MM/yyyy", { locale: ptBR })} - ${format(endOfThisMonth, "dd/MM/yyyy", { locale: ptBR })}`,
            totalCadastros: totalLeads,
            aprovados: approvedLeadsCount,
            reprovados: rejectedLeadsCount,
            pendentesAnalise: pendingRegistrations.length,
            passadosPromotores: Math.floor(approvedLeadsCount * 0.15), // 15% passados para promotores
            taxaAprovacao: `${approvalRate}%`,
            taxaCrescimento: `${growthRate}%`,
            tempoMedioAnalise: `${averageProcessingTime} dias`,
            whatsappCliques: whatsappClicks,
            conversaoWhatsapp: `${conversionRate}%`,
            metaMensal: 500,
            percentualMeta: ((totalLeads / 500) * 100).toFixed(1)
        };
    }, [totalLeads, approvedLeadsCount, rejectedLeadsCount, pendingRegistrations.length, approvalRate, growthRate, averageProcessingTime, whatsappClicks, conversionRate]);

    // Funções de ação melhoradas
    const handleApprove = async (leadId: string) => {
        setIsUpdating(leadId);
        try {
            const response = await fetch(`/api/leads/id/approve`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    promotorId: 'system',
                    observacoes: 'Aprovado via dashboard administrativo'
                }),
            });

            if (!response.ok) throw new Error('Falha ao aprovar.');

            toast({
                title: "Sucesso!",
                description: "Cadastro aprovado com sucesso.",
                duration: 3000
            });

            // Atualizar dados
            mutateLeads();
        } catch (error) {
            toast({
                title: "Erro!",
                description: "Não foi possível aprovar o cadastro.",
                variant: 'destructive',
                duration: 5000
            });
        } finally {
            setIsUpdating(null);
        }
    };

    const handleReject = async (leadId: string) => {
        setIsUpdating(leadId);
        try {
            const response = await fetch(`/api/leads/id/reject`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    motivo: 'Análise administrativa',
                    observacoes: 'Reprovado via dashboard administrativo'
                }),
            });

            if (!response.ok) throw new Error('Falha ao reprovar.');

            toast({
                title: "Sucesso!",
                description: "Cadastro reprovado.",
                duration: 3000
            });

            // Atualizar dados
            mutateLeads();
        } catch (error) {
            toast({
                title: "Erro!",
                description: "Não foi possível reprovar o cadastro.",
                variant: 'destructive',
                duration: 5000
            });
        } finally {
            setIsUpdating(null);
        }
    };

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/admin/login");
        router.refresh();
    };

    // Função de exportação melhorada
    const exportToExcel = async () => {
        if (!dateFrom || !dateTo) {
            toast({
                title: "Erro!",
                description: "Selecione as datas para exportação.",
                variant: 'destructive'
            });
            return;
        }

        setIsExporting(true);

        try {
            // Simular busca de dados por período
            await new Promise(resolve => setTimeout(resolve, 2000));

            const exportData = pendingRegistrations.map((lead: any, index: number) => ({
                ID: lead.id,
                Nome: lead.consultant?.nome || 'N/A',
                CPF: lead.consultant?.cpf || 'N/A',
                Telefone: lead.consultant?.telefone || 'N/A',
                Cidade: lead.consultant?.address?.cidade || 'N/A',
                UF: lead.consultant?.address?.uf || 'MS',
                Status: lead.status,
                'Data Cadastro': lead.createdAt ? format(new Date(lead.createdAt), 'dd/MM/yyyy HH:mm') : 'N/A',
                Observações: lead.observacoes || ''
            }));

            // Criar workbook
            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Cadastros");

            // Adicionar formatação básica
            const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const address = XLSX.utils.encode_col(C) + "1";
                if (!ws[address]) continue;
                ws[address].s = {
                    font: { bold: true },
                    fill: { fgColor: { rgb: "EEEEEE" } }
                };
            }

            // Nome do arquivo
            const fileName = `cadastros_${format(new Date(dateFrom), 'yyyy-MM-dd')}_${format(new Date(dateTo), 'yyyy-MM-dd')}.${exportFormat === 'excel' ? 'xlsx' : 'csv'}`;

            // Fazer download
            if (exportFormat === 'excel') {
                XLSX.writeFile(wb, fileName);
            } else {
                const csvData = XLSX.utils.sheet_to_csv(ws);
                const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', fileName);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }

            // Enviar via WhatsApp se número fornecido
            if (whatsappNumber) {
                const message = `📊 Relatório de cadastros Segunda Pele Lingerie\n\nPeríodo: ${dateFrom} a ${dateTo}\nTotal de registros: ${exportData.length}\n\nO arquivo foi gerado com sucesso!`;
                const cleanNumber = whatsappNumber.replace(/\D/g, '');
                window.open(`https://wa.me/55${cleanNumber}?text=${encodeURIComponent(message)}`, '_blank');
            }

            toast({
                title: "Sucesso!",
                description: `Arquivo ${fileName} foi exportado com sucesso!`,
                duration: 5000
            });

        } catch (error) {
            toast({
                title: "Erro!",
                description: "Falha na exportação dos dados.",
                variant: 'destructive',
                duration: 5000
            });
        } finally {
            setIsExporting(false);
            // setShowExportModal(false); // Manter o modal aberto
            // Reset form
            setDateFrom("");
            setDateTo("");
            setWhatsappNumber("");
        }
    };

    // Função para atualizar dados manualmente
    const refreshData = () => {
        mutateLeads();
        toast({
            title: "Dados atualizados!",
            description: "Os dados foram recarregados com sucesso.",
            duration: 2000
        });
    };

    if (leadsError || whatsappError) {
        return (
            <ShaderBackground>
                <div className="min-h-screen flex items-center justify-center">
                    <Card className="bg-red-500/20 border-red-500/30 p-6">
                        <CardContent className="text-center">
                            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                            <h2 className="text-xl font-bold text-white mb-2">Erro ao carregar dados</h2>
                            <p className="text-red-200 mb-4">Falha na conexão com o servidor</p>
                            <Button onClick={() => window.location.reload()} className="bg-red-600 hover:bg-red-700">
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Tentar Novamente
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </ShaderBackground>
        );
    }

    if (!leadsResponse || !whatsappResponse) {
        return (
            <ShaderBackground>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="h-12 w-12 animate-spin text-violet-400 mx-auto mb-4" />
                        <p className="text-violet-200 text-lg">Carregando dashboard...</p>
                        <p className="text-violet-300 text-sm mt-2">Conectando aos dados em tempo real</p>
                    </div>
                </div>
            </ShaderBackground>
        );
    }

    const userRole = user.user_metadata?.role || 'Admin';

    return (
        <ShaderBackground>
            <div className={`min-h-screen ${poppins.variable} ${playfair.variable} font-sans`}>
                {/* Header melhorado */}
                <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-40">
                    <div className="container mx-auto px-4 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <Image src="/logo2.png" alt="Segunda Pele Lingerie" width={50} height={50} className="drop-shadow-lg" />
                                <div>
                                    <span className="text-xl font-bold text-white" style={{ fontFamily: "var(--font-playfair)" }}>Segunda Pele Lingerie</span>
                                    <p className="text-sm text-violet-200" style={{ fontFamily: "var(--font-poppins)" }}>Dashboard Administrativo - MS</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <Button
                                    onClick={refreshData}
                                    variant="outline"
                                    size="sm"
                                    className="bg-white/10 text-white hover:bg-white/20"
                                >
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Atualizar
                                </Button>
                                <div className="text-right">
                                    <p className="text-sm font-medium text-white">{user.email}</p>
                                    <p className="text-xs text-violet-200">Cargo: {userRole}</p>
                                </div>
                                <Button onClick={handleLogout} variant="outline" size="sm" className="bg-white/10 text-white hover:bg-white/20">
                                    <LogOut className="w-4 h-4 mr-2" />Sair
                                </Button>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="container mx-auto px-4 py-8">
                    {/* Título e controles */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg" style={{ fontFamily: "var(--font-playfair)" }}>
                                Dashboard Analytics - MS
                            </h1>
                            <p className="text-violet-200 text-lg">Métricas em tempo real de Mato Grosso do Sul</p>
                            <p className="text-violet-300 text-sm mt-1">
                                Última atualização: {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </p>
                        </div>
                        <div className="flex items-center gap-4 flex-wrap">
                            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                                <SelectTrigger className="w-40 bg-white/10 text-white border-white/20">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-violet-900/90 text-white border-violet-400/30">
                                    <SelectItem value="7d">Últimos 7 dias</SelectItem>
                                    <SelectItem value="30d">Últimos 30 dias</SelectItem>
                                    <SelectItem value="90d">Últimos 90 dias</SelectItem>
                                </SelectContent>
                            </Select>
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-violet-300" />
                                <Input
                                    placeholder="Buscar consultoras..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 w-64 bg-white/10 text-white placeholder-violet-200 border-white/20"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Cards de métricas melhorados */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <Card className="bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/15 transition-colors">
                            <CardHeader className="flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-white">Total de Cadastros</CardTitle>
                                <Users className="h-5 w-5 text-violet-300" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-white mb-2">{totalLeads}</div>
                                <div className="flex items-center text-xs">
                                    {Number(growthRate) >= 0 ? (
                                        <TrendingUp className="w-3 h-3 mr-1 text-green-400" />
                                    ) : (
                                        <TrendingUp className="w-3 h-3 mr-1 text-red-400 rotate-180" />
                                    )}
                                    <span className={Number(growthRate) >= 0 ? "text-green-400" : "text-red-400"}>
                                        {growthRate}% este mês
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/15 transition-colors">
                            <CardHeader className="flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-white">Taxa de Aprovação</CardTitle>
                                <UserCheck className="h-5 w-5 text-green-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-white mb-2">{approvalRate}%</div>
                                <div className="text-xs text-violet-200">
                                    {approvedLeadsCount} de {totalLeads} cadastros
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/15 transition-colors">
                            <CardHeader className="flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-white">Pendentes</CardTitle>
                                <Clock className="h-5 w-5 text-yellow-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-white mb-2">{pendingRegistrations.length}</div>
                                <div className="text-xs text-yellow-300">
                                    Tempo médio: {averageProcessingTime} dias
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/15 transition-colors">
                            <CardHeader className="flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-white">Engajamento WhatsApp</CardTitle>
                                <MessageCircle className="h-5 w-5 text-green-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-white mb-2">{whatsappClicks}</div>
                                <div className="text-xs text-green-300">
                                    Conversão: {conversionRate}%
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Tabs melhoradas */}
                    <Tabs defaultValue="overview" className="space-y-6">
                        <TabsList className="grid w-full grid-cols-4 bg-white/10 backdrop-blur-lg border-white/20">
                            <TabsTrigger value="overview" className="text-white data-[state=active]:bg-violet-500/50">Visão Geral</TabsTrigger>
                            <TabsTrigger value="registrations" className="text-white data-[state=active]:bg-violet-500/50">Cadastros</TabsTrigger>
                            <TabsTrigger value="analytics" className="text-white data-[state=active]:bg-violet-500/50">Analytics</TabsTrigger>
                            <TabsTrigger value="geography" className="text-white data-[state=active]:bg-violet-500/50">Geografia</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Navegação rápida melhorada */}
                                <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                                    <CardHeader>
                                        <CardTitle className="text-white flex items-center">
                                            <BarChart3 className="w-5 h-5 mr-2" />
                                            Ações Rápidas
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <Link href="/admin/consultants">
                                            <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10">
                                                <Users className="w-4 h-4 mr-2" />
                                                Gerenciar Consultoras ({totalLeads})
                                            </Button>
                                        </Link>
                                        <Link href="/admin/consultants/reports">
                                            <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10">
                                                <FileText className="w-4 h-4 mr-2" />
                                                Relatórios Detalhados
                                            </Button>
                                        </Link>
                                        <Dialog open={showPromoterReportModal} onOpenChange={setShowPromoterReportModal}>
                                            <DialogTrigger asChild>
                                                <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10">
                                                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                                                    Relatório por Promotor
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-4xl bg-violet-900/95 backdrop-blur-lg border-violet-400/30">
                                                <DialogHeader>
                                                    <DialogTitle className="text-white text-xl">Relatório por Promotor</DialogTitle>
                                                    <DialogDescription className="text-violet-200">
                                                        Selecione um promotor para ver os detalhes
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="mt-6 space-y-6">
                                                    <Select value={selectedPromoter} onValueChange={setSelectedPromoter}>
                                                        <SelectTrigger className="w-full bg-white/10 border-white/20 text-white">
                                                            <SelectValue placeholder="Selecione um promotor" />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-violet-900/90 text-white border-violet-400/30">
                                                            <SelectItem value="all">Todos os Promotores</SelectItem>
                                                            {promoters.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>

                                                    {/* Tabela de Relatório */}
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow className="border-b border-white/20">
                                                                <TableHead className="text-violet-200">Consultora</TableHead>
                                                                <TableHead className="text-violet-200">Status</TableHead>
                                                                <TableHead className="text-violet-200">Data</TableHead>
                                                                <TableHead className="text-violet-200">Promotor</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {leadsResponse?.data?.filter((lead: any) => selectedPromoter === 'all' || lead.promotorId === selectedPromoter).slice(0, 10).map((lead: any) => (
                                                                <TableRow key={lead.id} className="border-b border-white/20 hover:bg-white/5">
                                                                    <TableCell className="text-white">{lead.consultant?.nome}</TableCell>
                                                                    <TableCell>{getStatusBadge(lead.status)}</TableCell>
                                                                    <TableCell className="text-white">{lead.createdAt ? format(new Date(lead.createdAt), 'dd/MM/yyyy') : 'N/A'}</TableCell>
                                                                    <TableCell className="text-white">{lead.promotorId || 'N/A'}</TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </CardContent>
                                </Card>

                                {/* Metas e performance */}
                                <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                                    <CardHeader>
                                        <CardTitle className="text-white flex items-center">
                                            <Target className="w-5 h-5 mr-2" />
                                            Metas do Mês
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-violet-200">Meta:</span>
                                                <span className="text-white font-bold">{generateDetailedReport.metaMensal}</span>
                                            </div>
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-violet-200">Atual:</span>
                                                <span className="text-white font-bold">{totalLeads}</span>
                                            </div>
                                            <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                                                <div
                                                    className="bg-gradient-to-r from-violet-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                                                    style={{width: `${Math.min(Number(generateDetailedReport.percentualMeta), 100)}%`}}
                                                ></div>
                                            </div>
                                            <p className="text-xs text-violet-200 text-center">
                                                {generateDetailedReport.percentualMeta}% da meta atingida
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Alertas do sistema */}
                                <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                                    <CardHeader>
                                        <CardTitle className="text-white flex items-center">
                                            <Activity className="w-5 h-5 mr-2" />
                                            Status do Sistema
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {pendingRegistrations.length > 20 && (
                                            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                                                <div className="flex items-center text-red-300">
                                                    <AlertCircle className="w-4 h-4 mr-2" />
                                                    <span className="text-sm">{pendingRegistrations.length} cadastros pendentes</span>
                                                </div>
                                            </div>
                                        )}

                                        {Number(generateDetailedReport.percentualMeta) >= 80 && (
                                            <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                                                <div className="flex items-center text-green-300">
                                                    <Target className="w-4 h-4 mr-2" />
                                                    <span className="text-sm">Meta mensal: {generateDetailedReport.percentualMeta}%</span>
                                                </div>
                                            </div>
                                        )}

                                        <div className="p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                                            <div className="flex items-center text-blue-300">
                                                <MessageCircle className="w-4 h-4 mr-2" />
                                                <span className="text-sm">WhatsApp: {whatsappClicks} cliques</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Gráficos principais */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                                    <CardHeader>
                                        <CardTitle className="text-white">Cadastros (Últimos 7 dias)</CardTitle>
                                        <CardDescription className="text-violet-200">Evolução diária dos cadastros</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <LineChart data={registrationChartData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                                <XAxis dataKey="date" stroke="#c4b5fd" />
                                                <YAxis stroke="#c4b5fd" />
                                                <Tooltip contentStyle={{backgroundColor: "rgba(139, 92, 246, 0.9)", border: "none", borderRadius: "8px", color: "white"}} />
                                                <Legend />
                                                <Line type="monotone" dataKey="cadastros" stroke="#f59e0b" strokeWidth={3} name="Total" />
                                                <Line type="monotone" dataKey="aprovados" stroke="#22c55e" strokeWidth={3} name="Aprovados" />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>

                                <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                                    <CardHeader>
                                        <CardTitle className="text-white">Status dos Cadastros</CardTitle>
                                        <CardDescription className="text-violet-200">Distribuição atual por status</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <RechartsPieChart>
                                                <Pie
                                                    data={statusData}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={80}
                                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                >
                                                    {statusData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip contentStyle={{backgroundColor: "rgba(139, 92, 246, 0.9)", border: "none", borderRadius: "8px", color: "white"}} />
                                                <Legend />
                                            </RechartsPieChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="registrations" className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                                    <CardHeader>
                                        <CardTitle className="text-white">Ações de Cadastro</CardTitle>
                                        <CardDescription className="text-violet-200">Gerencie cadastros pendentes e relatórios</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {/* Modal Ver Cadastros Pendentes */}
                                        <Dialog open={showPendingModal} onOpenChange={setShowPendingModal}>
                                            <DialogTrigger asChild>
                                                <Button className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700">
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    Ver Pendentes ({pendingRegistrations.length})
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto bg-violet-900/95 backdrop-blur-lg border-violet-400/30">
                                                <DialogHeader>
                                                    <DialogTitle className="text-white text-xl">Cadastros Pendentes de Análise</DialogTitle>
                                                    <DialogDescription className="text-violet-200">
                                                        {pendingRegistrations.length} cadastros aguardando aprovação
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="mt-4">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow className="hover:bg-transparent border-violet-400/30">
                                                                <TableHead className="text-violet-200">Nome</TableHead>
                                                                <TableHead className="text-violet-200">CPF</TableHead>
                                                                <TableHead className="text-violet-200">Telefone</TableHead>
                                                                <TableHead className="text-violet-200">Cidade</TableHead>
                                                                <TableHead className="text-violet-200">Data</TableHead>
                                                                <TableHead className="text-violet-200 text-right">Ações</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {pendingRegistrations.slice(0, 10).map((lead: any) => (
                                                                <TableRow key={lead.id} className="border-violet-400/30 hover:bg-white/5">
                                                                    <TableCell className="text-white font-medium">
                                                                        {lead.consultant?.nome || 'N/A'}
                                                                    </TableCell>
                                                                    <TableCell className="text-white">
                                                                        {lead.consultant?.cpf || 'N/A'}
                                                                    </TableCell>
                                                                    <TableCell className="text-white">
                                                                        {lead.consultant?.telefone || 'N/A'}
                                                                    </TableCell>
                                                                    <TableCell className="text-white">
                                                                        {lead.consultant?.address?.cidade || 'N/A'}
                                                                    </TableCell>
                                                                    <TableCell className="text-white">
                                                                        {lead.createdAt ? format(new Date(lead.createdAt), 'dd/MM/yyyy HH:mm') : 'N/A'}
                                                                    </TableCell>
                                                                    <TableCell className="text-right">
                                                                        <div className="flex gap-2 justify-end">
                                                                            <Button 
                                                                                size="sm" 
                                                                                className="bg-green-600 hover:bg-green-700 h-8 w-8 p-0"
                                                                                onClick={() => handleApprove(lead.id)}
                                                                                disabled={isUpdating === lead.id}
                                                                            >
                                                                                {isUpdating === lead.id ? (
                                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                                ) : (
                                                                                    <CheckCircle className="h-4 w-4" />
                                                                                )}
                                                                            </Button>
                                                                            <Button 
                                                                                size="sm" 
                                                                                className="bg-red-600 hover:bg-red-700 h-8 w-8 p-0"
                                                                                onClick={() => handleReject(lead.id)}
                                                                                disabled={isUpdating === lead.id}
                                                                            >
                                                                                {isUpdating === lead.id ? (
                                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                                ) : (
                                                                                    <XCircle className="h-4 w-4" />
                                                                                )}
                                                                            </Button>
                                                                        </div>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                    {pendingRegistrations.length > 10 && (
                                                        <div className="text-center mt-4">
                                                            <p className="text-violet-200 text-sm">
                                                                Mostrando 10 de {pendingRegistrations.length} registros
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </DialogContent>
                                        </Dialog>

                                        {/* Modal Relatório Detalhado */}
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700">
                                                    <FileText className="w-4 h-4 mr-2" />
                                                    Relatório Mensal
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-4xl bg-violet-900/95 backdrop-blur-lg border-violet-400/30">
                                                <DialogHeader>
                                                    <DialogTitle className="text-white text-xl">Relatório Detalhado</DialogTitle>
                                                    <DialogDescription className="text-violet-200">
                                                        Período: {generateDetailedReport.periodo}
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="mt-6 space-y-6">
                                                    {/* Cards de estatísticas */}
                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                        <Card className="bg-white/10 border-white/20">
                                                            <CardContent className="p-4 text-center">
                                                                <div className="text-2xl font-bold text-white mb-1">{generateDetailedReport.totalCadastros}</div>
                                                                <div className="text-sm text-violet-200">Total Cadastros</div>
                                                            </CardContent>
                                                        </Card>
                                                        <Card className="bg-green-500/20 border-green-500/30">
                                                            <CardContent className="p-4 text-center">
                                                                <div className="text-2xl font-bold text-white mb-1">{generateDetailedReport.aprovados}</div>
                                                                <div className="text-sm text-green-200">Aprovados</div>
                                                            </CardContent>
                                                        </Card>
                                                        <Card className="bg-red-500/20 border-red-500/30">
                                                            <CardContent className="p-4 text-center">
                                                                <div className="text-2xl font-bold text-white mb-1">{generateDetailedReport.reprovados}</div>
                                                                <div className="text-sm text-red-200">Reprovados</div>
                                                            </CardContent>
                                                        </Card>
                                                        <Card className="bg-yellow-500/20 border-yellow-500/30">
                                                            <CardContent className="p-4 text-center">
                                                                <div className="text-2xl font-bold text-white mb-1">{generateDetailedReport.pendentesAnalise}</div>
                                                                <div className="text-sm text-yellow-200">Em Análise</div>
                                                            </CardContent>
                                                        </Card>
                                                        <Card className="bg-blue-500/20 border-blue-500/30">
                                                            <CardContent className="p-4 text-center">
                                                                <div className="text-2xl font-bold text-white mb-1">{generateDetailedReport.whatsappCliques}</div>
                                                                <div className="text-sm text-blue-200">WhatsApp</div>
                                                            </CardContent>
                                                        </Card>
                                                        <Card className="bg-purple-500/20 border-purple-500/30">
                                                            <CardContent className="p-4 text-center">
                                                                <div className="text-2xl font-bold text-white mb-1">{generateDetailedReport.conversaoWhatsapp}</div>
                                                                <div className="text-sm text-purple-200">Conversão</div>
                                                            </CardContent>
                                                        </Card>
                                                    </div>

                                                    {/* Métricas adicionais */}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div className="space-y-3">
                                                            <h4 className="text-lg font-semibold text-white">Performance</h4>
                                                            <div className="space-y-2">
                                                                <div className="flex justify-between">
                                                                    <span className="text-violet-200">Taxa de Aprovação:</span>
                                                                    <span className="text-white font-medium">{generateDetailedReport.taxaAprovacao}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-violet-200">Crescimento:</span>
                                                                    <span className="text-white font-medium">{generateDetailedReport.taxaCrescimento}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-violet-200">Tempo Médio:</span>
                                                                    <span className="text-white font-medium">{generateDetailedReport.tempoMedioAnalise}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-3">
                                                            <h4 className="text-lg font-semibold text-white">Metas</h4>
                                                            <div className="space-y-2">
                                                                <div className="flex justify-between">
                                                                    <span className="text-violet-200">Meta Mensal:</span>
                                                                    <span className="text-white font-medium">{generateDetailedReport.metaMensal}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-violet-200">Atingido:</span>
                                                                    <span className="text-white font-medium">{generateDetailedReport.percentualMeta}%</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-violet-200">Restante:</span>
                                                                    <span className="text-white font-medium">{generateDetailedReport.metaMensal - generateDetailedReport.totalCadastros}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Botões de ação */}
                                                    <div className="flex justify-between items-center pt-4 border-t border-violet-400/30">
                                                        <div className="text-sm text-violet-200">
                                                            Última atualização: {format(new Date(), 'dd/MM/yyyy HH:mm')}
                                                        </div>
                                                        <Button className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700">
                                                            <Download className="w-4 h-4 mr-2" />
                                                            Baixar PDF
                                                        </Button>
                                                    </div>
                                                </div>
                                            </DialogContent>
                                        </Dialog>

                                    </CardContent>
                                </Card>

                                {/* Resumo de Performance */}
                                <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                                    <CardHeader>
                                        <CardTitle className="text-white flex items-center">
                                            <Activity className="w-5 h-5 mr-2" />
                                            Performance do Sistema
                                        </CardTitle>
                                        <CardDescription className="text-violet-200">Métricas operacionais</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="text-center p-3 bg-white/5 rounded-lg">
                                                <div className="text-xl font-bold text-white">{averageProcessingTime}</div>
                                                <div className="text-xs text-violet-200">Dias médios</div>
                                            </div>
                                            <div className="text-center p-3 bg-white/5 rounded-lg">
                                                <div className="text-xl font-bold text-white">{conversionRate}%</div>
                                                <div className="text-xs text-violet-200">Conversão WA</div>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-violet-200 text-sm">Eficiência do processo:</span>
                                                <Badge className={`${Number(approvalRate) >= 70 ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'} border-none`}>
                                                    {Number(approvalRate) >= 70 ? 'Alta' : 'Média'}
                                                </Badge>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-violet-200 text-sm">Status do mês:</span>
                                                <Badge className={`${Number(generateDetailedReport.percentualMeta) >= 80 ? 'bg-green-500/20 text-green-300' : Number(generateDetailedReport.percentualMeta) >= 60 ? 'bg-yellow-500/20 text-yellow-300' : 'bg-red-500/20 text-red-300'} border-none`}>
                                                    {Number(generateDetailedReport.percentualMeta) >= 80 ? 'No alvo' : Number(generateDetailedReport.percentualMeta) >= 60 ? 'Atenção' : 'Crítico'}
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Gráfico de evolução mensal */}
                            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                                <CardHeader>
                                    <CardTitle className="text-white">Evolução dos Cadastros</CardTitle>
                                    <CardDescription className="text-violet-200">Histórico mensal detalhado</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={400}>
                                        <AreaChart data={monthlyEvolution}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                            <XAxis dataKey="mes" stroke="#c4b5fd" />
                                            <YAxis stroke="#c4b5fd" />
                                            <Tooltip contentStyle={{backgroundColor: "rgba(139, 92, 246, 0.9)", border: "none", borderRadius: "8px", color: "white"}} />
                                            <Legend />
                                            <Area type="monotone" dataKey="cadastros" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} name="Total de Cadastros" />
                                            <Area type="monotone" dataKey="aprovados" stackId="2" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} name="Aprovados" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="analytics" className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                                    <CardHeader>
                                        <CardTitle className="text-white">Link WhatsApp</CardTitle>
                                        <CardDescription className="text-violet-200">Performance do canal</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="text-center">
                                            <div className="text-3xl font-bold text-white mb-2">{whatsappClicks}</div>
                                            <p className="text-violet-200 text-sm">Cliques hoje</p>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-violet-200 text-sm">Taxa de conversão:</span>
                                                <span className="text-white text-sm font-medium">{conversionRate}%</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-violet-200 text-sm">Crescimento:</span>
                                                <span className="text-green-400 text-sm font-medium">+{growthRate}%</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                                    <CardHeader>
                                        <CardTitle className="text-white">Engajamento</CardTitle>
                                        <CardDescription className="text-violet-200">Métricas de interação</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="text-center p-2 bg-white/5 rounded">
                                                <div className="text-lg font-bold text-white">{whatsappClicks}</div>
                                                <div className="text-xs text-violet-200">WhatsApp</div>
                                            </div>
                                            <div className="text-center p-2 bg-white/5 rounded">
                                                <div className="text-lg font-bold text-white">{Math.floor(whatsappClicks * 0.3)}</div>
                                                <div className="text-xs text-violet-200">Email</div>
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-sm text-violet-200">Taxa de engajamento geral</div>
                                            <div className="text-2xl font-bold text-white">{(Number(conversionRate) * 1.5).toFixed(1)}%</div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                                    <CardHeader>
                                        <CardTitle className="text-white">Tempo de Resposta</CardTitle>
                                        <CardDescription className="text-violet-200">Performance operacional</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="text-center">
                                            <div className="text-3xl font-bold text-white mb-2">{averageProcessingTime}</div>
                                            <p className="text-violet-200 text-sm">Dias médios de análise</p>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-violet-200 text-sm">Meta:</span>
                                                <span className="text-white text-sm">≤ 3 dias</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-violet-200 text-sm">Status:</span>
                                                <Badge className={`${Number(averageProcessingTime) <= 3 ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'} border-none text-xs`}>
                                                    {Number(averageProcessingTime) <= 3 ? 'No prazo' : 'Atenção'}
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Gráfico de horários de pico */}
                            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                                <CardHeader>
                                    <CardTitle className="text-white">Horários de Pico - WhatsApp</CardTitle>
                                    <CardDescription className="text-violet-200">Cliques por horário do dia</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={400}>
                                        <BarChart data={whatsappHourlyData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                            <XAxis dataKey="hora" stroke="#c4b5fd" />
                                            <YAxis stroke="#c4b5fd" />
                                            <Tooltip contentStyle={{backgroundColor: "rgba(139, 92, 246, 0.9)", border: "none", borderRadius: "8px", color: "white"}} />
                                            <Bar dataKey="cliques" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="geography" className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                                    <CardHeader>
                                        <CardTitle className="text-white flex items-center">
                                            <MapPin className="w-5 h-5 mr-2" />
                                            Distribuição por Cidades - MS
                                        </CardTitle>
                                        <CardDescription className="text-violet-200">
                                            Top cidades de Mato Grosso do Sul
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {cityData.map((city, index) => (
                                                <div key={city.cidade} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-gradient-to-r from-violet-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                                            {index + 1}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-white">{city.cidade}</div>
                                                            <div className="text-sm text-violet-200">{city.cadastros} consultoras</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-white font-medium">
                                                            R$ {(city.vendas / 1000).toFixed(0)}k
                                                        </div>
                                                        <Badge className="bg-violet-500/20 text-violet-300 border-none text-xs">
                                                            {((city.cadastros / cityData.reduce((a, b) => a + b.cadastros, 0)) * 100).toFixed(1)}%
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                                    <CardHeader>
                                        <CardTitle className="text-white">Oportunidades de Crescimento</CardTitle>
                                        <CardDescription className="text-violet-200">Análise de mercado</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg border border-green-500/30">
                                            <h4 className="font-semibold text-white mb-2">Campo Grande</h4>
                                            <p className="text-sm text-green-200">Mercado principal consolidado. Potencial para expansão em bairros periféricos.</p>
                                        </div>
                                        
                                        <div className="p-4 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg border border-blue-500/30">
                                            <h4 className="font-semibold text-white mb-2">Interior do Estado</h4>
                                            <p className="text-sm text-blue-200">Cidades como Naviraí e Maracaju mostram potencial de crescimento.</p>
                                        </div>
                                        
                                        <div className="p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg border border-purple-500/30">
                                            <h4 className="font-semibold text-white mb-2">Região Pantanal</h4>
                                            <p className="text-sm text-purple-200">Mercado em expansão com alta demanda por produtos premium.</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                                <CardHeader>
                                    <CardTitle className="text-white">Performance por Cidade</CardTitle>
                                    <CardDescription className="text-violet-200">Cadastros vs Vendas</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={400}>
                                        <BarChart data={cityData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                            <XAxis 
                                                dataKey="cidade" 
                                                stroke="#c4b5fd" 
                                                angle={-45}
                                                textAnchor="end"
                                                height={80}
                                            />
                                            <YAxis stroke="#c4b5fd" />
                                            <Tooltip contentStyle={{backgroundColor: "rgba(139, 92, 246, 0.9)", border: "none", borderRadius: "8px", color: "white"}} />
                                            <Legend />
                                            <Bar dataKey="cadastros" fill="#8b5cf6" name="Cadastros" />
                                            <Bar dataKey="vendas" fill="#22c55e" name="Vendas (em milhares)" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </ShaderBackground>
    );
}