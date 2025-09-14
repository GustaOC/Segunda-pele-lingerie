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
  XCircle, Loader2, RefreshCw, Mail, MapPin, Target, Activity, Filter, ChevronDown,
  ChevronRight, Plus, MoreHorizontal, ArrowUpRight, ArrowDownRight
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
    const [showDetailedReportModal, setShowDetailedReportModal] = useState(false);
    const [selectedPromoter, setSelectedPromoter] = useState("all");
    const [detailedReportPeriod, setDetailedReportPeriod] = useState("7");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [isExporting, setIsExporting] = useState(false);
    const [whatsappNumber, setWhatsappNumber] = useState("");
    const [isUpdating, setIsUpdating] = useState<string | null>(null);
    const [exportFormat, setExportFormat] = useState("excel");
    const [loading, setLoading] = useState(false);

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
    }, [leadsResponse, whatsappResponse]);
    
    const getStatusBadge = (status: string) => {
        switch (status) {
          case "EM_ANALISE":
            return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Em Análise</Badge>
          case "APROVADO":
            return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Aprovado</Badge>
          case "REPROVADO":
            return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Reprovado</Badge>
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

    const handleViewDetailedReport = () => {
        if (detailedReportPeriod) {
            router.push(`/admin/consultants/reports?period=${detailedReportPeriod}`);
        }
    };

    const handleViewPromoterReport = () => {
        if (selectedPromoter && selectedPromoter !== 'all') {
            router.push(`/admin/consultants/reports?promoter=${selectedPromoter}`);
        } else {
            toast({
                title: "Atenção!",
                description: "Selecione um promotor para gerar o relatório.",
                variant: 'destructive'
            });
        }
    };

    if (leadsError || whatsappError) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
                <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                        <AlertCircle className="h-8 w-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Erro ao carregar dados</h2>
                    <p className="text-gray-600 mb-4">Falha na conexão com o servidor</p>
                    <Button 
                        onClick={() => window.location.reload()} 
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Tentar Novamente
                    </Button>
                </div>
            </div>
        );
    }

    if (!leadsResponse || !whatsappResponse) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
                <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
                    <div className="inline-flex items-center justify-center mb-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Carregando dashboard</h2>
                    <p className="text-gray-600">Conectando aos dados em tempo real</p>
                    <p className="text-gray-500 text-sm mt-2">Isso pode levar alguns instantes</p>
                </div>
            </div>
        );
    }

    const userRole = user.user_metadata?.role || 'Admin';

    return (
        <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 ${poppins.variable} ${playfair.variable} font-sans`}>
            {/* Header melhorado */}
            <header className="bg-white shadow-sm border-b sticky top-0 z-40">
                <div className="container mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg">
                                <Image src="/logo2.png" alt="Segunda Pele Lingerie" width={40} height={40} className="filter brightness-0 invert" />
                            </div>
                            <div>
                                <span className="text-xl font-bold text-gray-900" style={{ fontFamily: "var(--font-playfair)" }}>Segunda Pele Lingerie</span>
                                <p className="text-sm text-gray-600" style={{ fontFamily: "var(--font-poppins)" }}>Dashboard Administrativo - MS</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <Button
                                onClick={refreshData}
                                variant="outline"
                                size="sm"
                                className="border-purple-200 bg-white text-purple-700 hover:bg-purple-50 hover:text-purple-800 shadow-sm"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Atualizar
                            </Button>
                            <Button
                                onClick={() => router.push('/admin/user')}
                                variant="outline"
                                size="sm"
                                className="border-purple-200 bg-white text-purple-700 hover:bg-purple-50 hover:text-purple-800 shadow-sm"
                            >
                                <Users className="w-4 h-4 mr-2" />
                                Funcionários
                            </Button>
                            <div className="text-right hidden md:block">
                                <p className="text-sm font-medium text-gray-900">{user.email}</p>
                                <p className="text-xs text-gray-600">Cargo: {userRole}</p>
                            </div>
                            <Button onClick={handleLogout} variant="outline" size="sm" className="border-purple-200 bg-white text-purple-700 hover:bg-purple-50 hover:text-purple-800 shadow-sm">
                                <LogOut className="w-4 h-4 mr-2" />Sair
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-6">
                {/* Título e controles */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-1" style={{ fontFamily: "var(--font-playfair)" }}>
                            Dashboard Analytics - MS
                        </h1>
                        <p className="text-gray-600">Métricas em tempo real de Mato Grosso do Sul</p>
                        <p className="text-gray-500 text-sm mt-1">
                            Última atualização: {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                            <SelectTrigger className="w-40 bg-white border-purple-200 focus:ring-purple-500 focus:border-purple-500">
                                <Calendar className="w-4 h-4 mr-2 text-purple-500" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                                <SelectItem value="30d">Últimos 30 dias</SelectItem>
                                <SelectItem value="90d">Últimos 90 dias</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="Buscar consultoras..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 w-64 border-purple-200 focus:border-purple-500 focus:ring-purple-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Cards de métricas melhorados */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                    <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-white to-purple-50">
                        <CardHeader className="flex-row items-center justify-between pb-3 space-y-0">
                            <CardTitle className="text-sm font-medium text-gray-600">Total de Cadastros</CardTitle>
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Users className="h-4 w-4 text-purple-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900 mb-1">{totalLeads}</div>
                            <div className="flex items-center text-xs">
                                {Number(growthRate) >= 0 ? (
                                    <ArrowUpRight className="w-3 h-3 mr-1 text-green-600" />
                                ) : (
                                    <ArrowDownRight className="w-3 h-3 mr-1 text-red-600" />
                                )}
                                <span className={Number(growthRate) >= 0 ? "text-green-600" : "text-red-600"}>
                                    {growthRate}% este mês
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-white to-green-50">
                        <CardHeader className="flex-row items-center justify-between pb-3 space-y-0">
                            <CardTitle className="text-sm font-medium text-gray-600">Taxa de Aprovação</CardTitle>
                            <div className="p-2 bg-green-100 rounded-lg">
                                <UserCheck className="h-4 w-4 text-green-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900 mb-1">{approvalRate}%</div>
                            <div className="text-xs text-gray-600">
                                {approvedLeadsCount} de {totalLeads} cadastros
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-white to-amber-50">
                        <CardHeader className="flex-row items-center justify-between pb-3 space-y-0">
                            <CardTitle className="text-sm font-medium text-gray-600">Pendentes</CardTitle>
                            <div className="p-2 bg-amber-100 rounded-lg">
                                <Clock className="h-4 w-4 text-amber-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900 mb-1">{pendingRegistrations.length}</div>
                            <div className="text-xs text-amber-600">
                                Tempo médio: {averageProcessingTime} dias
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-white to-blue-50">
                        <CardHeader className="flex-row items-center justify-between pb-3 space-y-0">
                            <CardTitle className="text-sm font-medium text-gray-600">Engajamento WhatsApp</CardTitle>
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <MessageCircle className="h-4 w-4 text-blue-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900 mb-1">{whatsappClicks}</div>
                            <div className="text-xs text-blue-600">
                                Conversão: {conversionRate}%
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs melhoradas */}
                <Tabs defaultValue="overview" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-4 bg-gray-100 p-1 rounded-lg">
                        <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-purple-700 rounded-md py-2">Visão Geral</TabsTrigger>
                        <TabsTrigger value="registrations" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-purple-700 rounded-md py-2">Cadastros</TabsTrigger>
                        <TabsTrigger value="analytics" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-purple-700 rounded-md py-2">Analytics</TabsTrigger>
                        <TabsTrigger value="geography" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-purple-700 rounded-md py-2">Geografia</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Navegação rápida melhorada */}
                            <Card className="border-0 shadow-md">
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center text-lg">
                                        <BarChart3 className="w-5 h-5 mr-2 text-purple-600" />
                                        Ações Rápidas
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <Link href="/admin/consultants">
                                        <Button variant="ghost" className="w-full justify-start text-gray-700 hover:bg-purple-50 hover:text-purple-700 py-5 border border-gray-100 rounded-lg">
                                            <Users className="w-4 h-4 mr-3 text-purple-500" />
                                            <div className="text-left">
                                                <div className="font-medium">Gerenciar Consultoras</div>
                                                <div className="text-xs text-gray-500">{totalLeads} cadastradas</div>
                                            </div>
                                        </Button>
                                    </Link>
                                    <Dialog open={showDetailedReportModal} onOpenChange={setShowDetailedReportModal}>
                                        <DialogTrigger asChild>
                                            <Button variant="ghost" className="w-full justify-start text-gray-700 hover:bg-purple-50 hover:text-purple-700 py-5 border border-gray-100 rounded-lg">
                                                <FileText className="w-4 h-4 mr-3 text-purple-500" />
                                                <div className="text-left">
                                                    <div className="font-medium">Relatórios Detalhados</div>
                                                    <div className="text-xs text-gray-500">Análise completa</div>
                                                </div>
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-md rounded-xl">
                                            <DialogHeader>
                                                <DialogTitle className="text-xl flex items-center">
                                                    <FileText className="w-5 h-5 mr-2 text-purple-600" />
                                                    Relatório Detalhado
                                                </DialogTitle>
                                                <DialogDescription>
                                                    Selecione o período para o relatório.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="mt-6 space-y-6">
                                                <Select value={detailedReportPeriod} onValueChange={setDetailedReportPeriod}>
                                                    <SelectTrigger className="w-full border-purple-200 focus:ring-purple-500 focus:border-purple-500">
                                                        <SelectValue placeholder="Selecione o período" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="7">Últimos 7 dias</SelectItem>
                                                        <SelectItem value="15">Últimos 15 dias</SelectItem>
                                                        <SelectItem value="30">Últimos 30 dias</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <Button onClick={handleViewDetailedReport} className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
                                                    Visualizar Relatório
                                                </Button>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                    <Dialog open={showPromoterReportModal} onOpenChange={setShowPromoterReportModal}>
                                        <DialogTrigger asChild>
                                            <Button variant="ghost" className="w-full justify-start text-gray-700 hover:bg-purple-50 hover:text-purple-700 py-5 border border-gray-100 rounded-lg">
                                                <FileSpreadsheet className="w-4 h-4 mr-3 text-purple-500" />
                                                <div className="text-left">
                                                    <div className="font-medium">Relatório por Promotor</div>
                                                    <div className="text-xs text-gray-500">Desempenho individual</div>
                                                </div>
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-md rounded-xl">
                                            <DialogHeader>
                                                <DialogTitle className="text-xl flex items-center">
                                                    <FileSpreadsheet className="w-5 h-5 mr-2 text-purple-600" />
                                                    Relatório por Promotor
                                                </DialogTitle>
                                                <DialogDescription>
                                                    Selecione um promotor para ver os detalhes
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="mt-6 space-y-6">
                                                <Select value={selectedPromoter} onValueChange={setSelectedPromoter}>
                                                    <SelectTrigger className="w-full border-purple-200 focus:ring-purple-500 focus:border-purple-500">
                                                        <SelectValue placeholder="Selecione um promotor" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">Todos os Promotores</SelectItem>
                                                        {promoters.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <Button onClick={handleViewPromoterReport} className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
                                                    Visualizar Relatório
                                                </Button>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </CardContent>
                            </Card>

                            {/* Metas e performance */}
                            <Card className="border-0 shadow-md">
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center text-lg">
                                        <Target className="w-5 h-5 mr-2 text-purple-600" />
                                        Metas do Mês
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <div className="flex justify-between items-center mb-2 text-sm">
                                            <span className="text-gray-600">Meta:</span>
                                            <span className="font-bold">{generateDetailedReport.metaMensal}</span>
                                        </div>
                                        <div className="flex justify-between items-center mb-2 text-sm">
                                            <span className="text-gray-600">Atual:</span>
                                            <span className="font-bold">{totalLeads}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                                            <div
                                                className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2.5 rounded-full transition-all duration-500"
                                                style={{width: `${Math.min(Number(generateDetailedReport.percentualMeta), 100)}%`}}
                                            ></div>
                                        </div>
                                        <p className="text-xs text-gray-600 text-center">
                                            {generateDetailedReport.percentualMeta}% da meta atingida
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Alertas do sistema */}
                            <Card className="border-0 shadow-md">
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center text-lg">
                                        <Activity className="w-5 h-5 mr-2 text-purple-600" />
                                        Status do Sistema
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {pendingRegistrations.length > 20 && (
                                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
                                            <AlertCircle className="w-5 h-5 mr-3 text-red-500 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <div className="font-medium text-red-800">Cadastros Pendentes</div>
                                                <div className="text-sm text-red-700">{pendingRegistrations.length} cadastros aguardando análise</div>
                                            </div>
                                        </div>
                                    )}

                                    {Number(generateDetailedReport.percentualMeta) >= 80 && (
                                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start">
                                            <Target className="w-5 h-5 mr-3 text-green-500 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <div className="font-medium text-green-800">Meta em Andamento</div>
                                                <div className="text-sm text-green-700">{generateDetailedReport.percentualMeta}% da meta mensal</div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start">
                                        <MessageCircle className="w-5 h-5 mr-3 text-blue-500 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <div className="font-medium text-blue-800">Engajamento WhatsApp</div>
                                            <div className="text-sm text-blue-700">{whatsappClicks} cliques recebidos</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Gráficos principais */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card className="border-0 shadow-md">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg">Cadastros (Últimos 7 dias)</CardTitle>
                                    <CardDescription>Evolução diária dos cadastros</CardDescription>
                                </CardHeader>
                                <CardContent className="pt-2">
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={registrationChartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                            <XAxis dataKey="date" stroke="#6b7280" />
                                            <YAxis stroke="#6b7280" />
                                            <Tooltip 
                                                contentStyle={{
                                                    backgroundColor: "white", 
                                                    border: "1px solid #e5e7eb", 
                                                    borderRadius: "8px",
                                                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                                                }} 
                                            />
                                            <Legend />
                                            <Line 
                                                type="monotone" 
                                                dataKey="cadastros" 
                                                stroke="#8b5cf6" 
                                                strokeWidth={3} 
                                                name="Total" 
                                                dot={{ r: 4, fill: "#8b5cf6" }}
                                                activeDot={{ r: 6, fill: "#7c3aed" }}
                                            />
                                            <Line 
                                                type="monotone" 
                                                dataKey="aprovados" 
                                                stroke="#10b981" 
                                                strokeWidth={3} 
                                                name="Aprovados" 
                                                dot={{ r: 4, fill: "#10b981" }}
                                                activeDot={{ r: 6, fill: "#059669" }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-md">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg">Status dos Cadastros</CardTitle>
                                    <CardDescription>Distribuição atual por status</CardDescription>
                                </CardHeader>
                                <CardContent className="pt-2">
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
                                                labelLine={false}
                                            >
                                                {statusData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip 
                                                contentStyle={{
                                                    backgroundColor: "white", 
                                                    border: "1px solid #e5e7eb", 
                                                    borderRadius: "8px",
                                                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                                                }} 
                                            />
                                            <Legend 
                                                layout="vertical" 
                                                verticalAlign="middle" 
                                                align="right"
                                                formatter={(value, entry, index) => (
                                                    <span className="text-gray-600 text-sm">
                                                        {value}
                                                    </span>
                                                )}
                                            />
                                        </RechartsPieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="registrations" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card className="border-0 shadow-md">
                                <CardHeader>
                                    <CardTitle className="text-lg">Ações de Cadastro</CardTitle>
                                    <CardDescription>Gerencie cadastros pendentes e relatórios</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Modal Ver Cadastros Pendentes */}
                                    <Dialog open={showPendingModal} onOpenChange={setShowPendingModal}>
                                        <DialogTrigger asChild>
                                            <Button className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white">
                                                <Eye className="w-4 h-4 mr-2" />
                                                Ver Pendentes ({pendingRegistrations.length})
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto rounded-xl">
                                            <DialogHeader>
                                                <DialogTitle className="text-xl flex items-center">
                                                    <Clock className="w-5 h-5 mr-2 text-amber-500" />
                                                    Cadastros Pendentes de Análise
                                                </DialogTitle>
                                                <DialogDescription>
                                                    {pendingRegistrations.length} cadastros aguardando aprovação
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="mt-4">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Nome</TableHead>
                                                            <TableHead>CPF</TableHead>
                                                            <TableHead>Telefone</TableHead>
                                                            <TableHead>Cidade</TableHead>
                                                            <TableHead>Data</TableHead>
                                                            <TableHead className="text-right">Ações</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {pendingRegistrations.slice(0, 10).map((lead: any) => (
                                                            <TableRow key={lead.id}>
                                                                <TableCell className="font-medium">
                                                                    {lead.consultant?.nome || 'N/A'}
                                                                </TableCell>
                                                                <TableCell>
                                                                    {lead.consultant?.cpf || 'N/A'}
                                                                </TableCell>
                                                                <TableCell>
                                                                    {lead.consultant?.telefone || 'N/A'}
                                                                </TableCell>
                                                                <TableCell>
                                                                    {lead.consultant?.address?.cidade || 'N/A'}
                                                                </TableCell>
                                                                <TableCell>
                                                                    {lead.createdAt ? format(new Date(lead.createdAt), 'dd/MM/yyyy HH:mm') : 'N/A'}
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    <div className="flex gap-2 justify-end">
                                                                        <Button 
                                                                            size="sm" 
                                                                            variant="outline"
                                                                            className="h-8 w-8 p-0 border-green-200 text-green-700 hover:bg-green-50"
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
                                                                            variant="outline"
                                                                            className="h-8 w-8 p-0 border-red-200 text-red-700 hover:bg-red-50"
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
                                                        <p className="text-gray-600 text-sm">
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
                                            <Button className="w-full border-purple-200 text-purple-700 hover:bg-purple-50" variant="outline">
                                                <FileText className="w-4 h-4 mr-2" />
                                                Relatório Mensal
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-4xl rounded-xl">
                                            <DialogHeader>
                                                <DialogTitle className="text-xl flex items-center">
                                                    <FileText className="w-5 h-5 mr-2 text-purple-600" />
                                                    Relatório Detalhado
                                                </DialogTitle>
                                                <DialogDescription>
                                                    Período: {generateDetailedReport.periodo}
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="mt-6 space-y-6">
                                                {/* Cards de estatísticas */}
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                    <Card className="border-0 shadow-sm">
                                                        <CardContent className="p-4 text-center">
                                                            <div className="text-2xl font-bold mb-1 text-purple-700">{generateDetailedReport.totalCadastros}</div>
                                                            <div className="text-sm text-gray-600">Total Cadastros</div>
                                                        </CardContent>
                                                    </Card>
                                                    <Card className="border-0 shadow-sm bg-green-50 border-green-200">
                                                        <CardContent className="p-4 text-center">
                                                            <div className="text-2xl font-bold text-green-800 mb-1">{generateDetailedReport.aprovados}</div>
                                                            <div className="text-sm text-green-600">Aprovados</div>
                                                        </CardContent>
                                                    </Card>
                                                    <Card className="border-0 shadow-sm bg-red-50 border-red-200">
                                                        <CardContent className="p-4 text-center">
                                                            <div className="text-2xl font-bold text-red-800 mb-1">{generateDetailedReport.reprovados}</div>
                                                            <div className="text-sm text-red-600">Reprovados</div>
                                                        </CardContent>
                                                    </Card>
                                                    <Card className="border-0 shadow-sm bg-amber-50 border-amber-200">
                                                        <CardContent className="p-4 text-center">
                                                            <div className="text-2xl font-bold text-amber-800 mb-1">{generateDetailedReport.pendentesAnalise}</div>
                                                            <div className="text-sm text-amber-600">Em Análise</div>
                                                        </CardContent>
                                                    </Card>
                                                    <Card className="border-0 shadow-sm bg-blue-50 border-blue-200">
                                                        <CardContent className="p-4 text-center">
                                                            <div className="text-2xl font-bold text-blue-800 mb-1">{generateDetailedReport.whatsappCliques}</div>
                                                            <div className="text-sm text-blue-600">WhatsApp</div>
                                                        </CardContent>
                                                    </Card>
                                                    <Card className="border-0 shadow-sm bg-purple-50 border-purple-200">
                                                        <CardContent className="p-4 text-center">
                                                            <div className="text-2xl font-bold text-purple-800 mb-1">{generateDetailedReport.conversaoWhatsapp}</div>
                                                            <div className="text-sm text-purple-600">Conversão</div>
                                                        </CardContent>
                                                    </Card>
                                                </div>

                                                {/* Métricas adicionais */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-3">
                                                        <h4 className="text-lg font-semibold">Performance</h4>
                                                        <div className="space-y-2">
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-600">Taxa de Aprovação:</span>
                                                                <span className="font-medium">{generateDetailedReport.taxaAprovacao}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-600">Crescimento:</span>
                                                                <span className="font-medium">{generateDetailedReport.taxaCrescimento}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-600">Tempo Médio:</span>
                                                                <span className="font-medium">{generateDetailedReport.tempoMedioAnalise}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <h4 className="text-lg font-semibold">Metas</h4>
                                                        <div className="space-y-2">
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-600">Meta Mensal:</span>
                                                                <span className="font-medium">{generateDetailedReport.metaMensal}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-600">Atingido:</span>
                                                                <span className="font-medium">{generateDetailedReport.percentualMeta}%</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-600">Restante:</span>
                                                                <span className="font-medium">{generateDetailedReport.metaMensal - generateDetailedReport.totalCadastros}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Botões de ação */}
                                                <div className="flex justify-between items-center pt-4 border-t">
                                                    <div className="text-sm text-gray-600">
                                                        Última atualização: {format(new Date(), 'dd/MM/yyyy HH:mm')}
                                                    </div>
                                                    <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
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
                            <Card className="border-0 shadow-md">
                                <CardHeader>
                                    <CardTitle className="flex items-center text-lg">
                                        <Activity className="w-5 h-5 mr-2 text-purple-600" />
                                        Performance do Sistema
                                    </CardTitle>
                                    <CardDescription>Métricas operacionais</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                                            <div className="text-xl font-bold">{averageProcessingTime}</div>
                                            <div className="text-xs text-gray-600">Dias médios</div>
                                        </div>
                                        <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                                            <div className="text-xl font-bold">{conversionRate}%</div>
                                            <div className="text-xs text-gray-600">Conversão WA</div>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600 text-sm">Eficiência do processo:</span>
                                            <Badge className={`${Number(approvalRate) >= 70 ? 'bg-green-100 text-green-800 border-green-200' : 'bg-amber-100 text-amber-800 border-amber-200'}`} variant="outline">
                                                {Number(approvalRate) >= 70 ? 'Alta' : 'Média'}
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600 text-sm">Status do mês:</span>
                                            <Badge className={`${Number(generateDetailedReport.percentualMeta) >= 80 ? 'bg-green-100 text-green-800 border-green-200' : Number(generateDetailedReport.percentualMeta) >= 60 ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-red-100 text-red-800 border-red-200'}`} variant="outline">
                                                {Number(generateDetailedReport.percentualMeta) >= 80 ? 'No alvo' : Number(generateDetailedReport.percentualMeta) >= 60 ? 'Atenção' : 'Crítico'}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Gráfico de evolução mensal */}
                        <Card className="border-0 shadow-md">
                            <CardHeader>
                                <CardTitle className="text-lg">Evolução dos Cadastros</CardTitle>
                                <CardDescription>Histórico mensal detalhado</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={400}>
                                    <AreaChart data={monthlyEvolution}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                        <XAxis dataKey="mes" stroke="#6b7280" />
                                        <YAxis stroke="#6b7280" />
                                        <Tooltip 
                                            contentStyle={{
                                                backgroundColor: "white", 
                                                border: "1px solid #e5e7eb", 
                                                borderRadius: "8px",
                                                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                                            }} 
                                        />
                                        <Legend />
                                        <Area type="monotone" dataKey="cadastros" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} name="Total de Cadastros" />
                                        <Area type="monotone" dataKey="aprovados" stackId="2" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Aprovados" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="analytics" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <Card className="border-0 shadow-md">
                                <CardHeader>
                                    <CardTitle className="text-lg">Link WhatsApp</CardTitle>
                                    <CardDescription>Performance do canal</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="text-center">
                                        <div className="text-3xl font-bold mb-2">{whatsappClicks}</div>
                                        <p className="text-gray-600 text-sm">Cliques hoje</p>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 text-sm">Taxa de conversão:</span>
                                            <span className="text-sm font-medium">{conversionRate}%</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 text-sm">Crescimento:</span>
                                            <span className="text-green-600 text-sm font-medium">+{growthRate}%</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-md">
                                <CardHeader>
                                    <CardTitle className="text-lg">Engajamento</CardTitle>
                                    <CardDescription>Métricas de interação</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="text-center p-2 bg-gray-50 rounded border border-gray-200">
                                            <div className="text-lg font-bold">{whatsappClicks}</div>
                                            <div className="text-xs text-gray-600">WhatsApp</div>
                                        </div>
                                        <div className="text-center p-2 bg-gray-50 rounded border border-gray-200">
                                            <div className="text-lg font-bold">{Math.floor(whatsappClicks * 0.3)}</div>
                                            <div className="text-xs text-gray-600">Email</div>
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-sm text-gray-600">Taxa de engajamento geral</div>
                                        <div className="text-2xl font-bold">{(Number(conversionRate) * 1.5).toFixed(1)}%</div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-md">
                                <CardHeader>
                                    <CardTitle className="text-lg">Tempo de Resposta</CardTitle>
                                    <CardDescription>Performance operacional</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="text-center">
                                        <div className="text-3xl font-bold mb-2">{averageProcessingTime}</div>
                                        <p className="text-gray-600 text-sm">Dias médios de análise</p>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 text-sm">Meta:</span>
                                            <span className="text-sm">≤ 3 dias</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 text-sm">Status:</span>
                                            <Badge className={`${Number(averageProcessingTime) <= 3 ? 'bg-green-100 text-green-800 border-green-200' : 'bg-amber-100 text-amber-800 border-amber-200'} text-xs`} variant="outline">
                                                {Number(averageProcessingTime) <= 3 ? 'No prazo' : 'Atenção'}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Gráfico de horários de pico */}
                        <Card className="border-0 shadow-md">
                            <CardHeader>
                                <CardTitle className="text-lg">Horários de Pico - WhatsApp</CardTitle>
                                <CardDescription>Cliques por horário do dia</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={400}>
                                    <BarChart data={whatsappHourlyData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                        <XAxis dataKey="hora" stroke="#6b7280" />
                                        <YAxis stroke="#6b7280" />
                                        <Tooltip 
                                            contentStyle={{
                                                backgroundColor: "white", 
                                                border: "1px solid #e5e7eb", 
                                                borderRadius: "8px",
                                                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                                            }} 
                                        />
                                        <Bar dataKey="cliques" fill="#10b981" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="geography" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card className="border-0 shadow-md">
                                <CardHeader>
                                    <CardTitle className="flex items-center text-lg">
                                        <MapPin className="w-5 h-5 mr-2 text-purple-600" />
                                        Distribuição por Cidades - MS
                                    </CardTitle>
                                    <CardDescription>
                                        Top cidades de Mato Grosso do Sul
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {cityData.map((city, index) => (
                                            <div key={city.cidade} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                                        {index + 1}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{city.cidade}</div>
                                                        <div className="text-sm text-gray-600">{city.cadastros} consultoras</div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-medium">
                                                        R$ {(city.vendas / 1000).toFixed(0)}k
                                                    </div>
                                                    <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                                                        {((city.cadastros / cityData.reduce((a, b) => a + b.cadastros, 0)) * 100).toFixed(1)}%
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-md">
                                <CardHeader>
                                    <CardTitle className="text-lg">Oportunidades de Crescimento</CardTitle>
                                    <CardDescription>Análise de mercado</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                        <h4 className="font-semibold mb-2 text-green-800">Campo Grande</h4>
                                        <p className="text-sm text-green-700">Mercado principal consolidado. Potencial para expansão em bairros periféricos.</p>
                                    </div>
                                    
                                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                        <h4 className="font-semibold mb-2 text-blue-800">Interior do Estado</h4>
                                        <p className="text-sm text-blue-700">Cidades como Naviraí e Maracaju mostram potencial de crescimento.</p>
                                    </div>
                                    
                                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                                        <h4 className="font-semibold mb-2 text-purple-800">Região Pantanal</h4>
                                        <p className="text-sm text-purple-700">Mercado em expansão com alta demanda por produtos premium.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="border-0 shadow-md">
                            <CardHeader>
                                <CardTitle className="text-lg">Performance por Cidade</CardTitle>
                                <CardDescription>Cadastros vs Vendas</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={400}>
                                    <BarChart data={cityData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                        <XAxis 
                                            dataKey="cidade" 
                                            stroke="#6b7280" 
                                            angle={-45}
                                            textAnchor="end"
                                            height={80}
                                        />
                                        <YAxis stroke="#6b7280" />
                                        <Tooltip 
                                            contentStyle={{
                                                backgroundColor: "white", 
                                                border: "1px solid #e5e7eb", 
                                                borderRadius: "8px",
                                                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                                            }} 
                                        />
                                        <Legend />
                                        <Bar dataKey="cadastros" fill="#8b5cf6" name="Cadastros" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="vendas" fill="#10b981" name="Vendas (em milhares)" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}