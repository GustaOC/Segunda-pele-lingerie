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
import { Users, UserCheck, Clock, MessageCircle, LogOut, BarChart3, FileText, TrendingUp, Calendar, Search, AlertCircle, Download, Eye, FileSpreadsheet, Send, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import ShaderBackground from "@/components/shader-background";
import { Playfair_Display, Poppins } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import * as XLSX from 'xlsx';

// Fontes
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-playfair" });
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-poppins" });

// Função fetcher para o SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Dados mockados preservados para funcionalidades ainda não conectadas
const whatsappData = [ { hora: "08:00", cliques: 5 }, { hora: "10:00", cliques: 12 }, { hora: "12:00", cliques: 18 }, { hora: "14:00", cliques: 25 }, { hora: "16:00", cliques: 22 }, { hora: "18:00", cliques: 15 }, { hora: "20:00", cliques: 8 }, ];
const cityData = [ { cidade: "Campo Grande", cadastros: 234 }, { cidade: "Dourados", cadastros: 156 }, { cidade: "Três Lagoas", cadastros: 98 }, { cidade: "Corumbá", cadastros: 87 }, { cidade: "Ponta Porã", cadastros: 76 }, ];

export default function DashboardClient({ user }: { user: User }) {
    const router = useRouter();
    const { toast } = useToast();

    // Estados
    const [selectedPeriod, setSelectedPeriod] = useState("30d");
    const [searchTerm, setSearchTerm] = useState("");
    const [showPendingModal, setShowPendingModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [isExporting, setIsExporting] = useState(false);
    const [whatsappNumber, setWhatsappNumber] = useState("");
    const [isUpdating, setIsUpdating] = useState<string | null>(null);

    // Busca de dados em tempo real
    const { data: leadsResponse, error: leadsError } = useSWR('/api/leads/id', fetcher, { refreshInterval: 5000 });
    const { data: whatsappResponse, error: whatsappError } = useSWR('/api/metrics/whatsapp-clicks', fetcher, { refreshInterval: 5000 });

    // Processamento de dados
    const { totalLeads, approvedLeadsCount, pendingRegistrations, rejectedLeadsCount, approvalRate, whatsappClicks, statusData, registrationChartData } = useMemo(() => {
        const allLeads = leadsResponse?.data || [];
        const total = allLeads.length;
        const approved = allLeads.filter((l: any) => l.status === 'APROVADO').length;
        const pending = allLeads.filter((l: any) => l.status === 'EM_ANALISE');
        const rejected = allLeads.filter((l: any) => l.status === 'REPROVADO').length;
        const rate = total > 0 ? ((approved / total) * 100).toFixed(1) : "0.0";
        const clicks = whatsappResponse?.data?.length || 0;

        const status = [
            { name: "Aprovados", value: approved, color: "#22c55e" },
            { name: "Em Análise", value: pending.length, color: "#f59e0b" },
            { name: "Reprovados", value: rejected, color: "#ef4444" },
        ];

        const dailyData: { [key: string]: { cadastros: number, aprovados: number, reprovados: number } } = {};
        for (let i = 6; i >= 0; i--) {
            const date = format(subDays(new Date(), i), 'dd/MM');
            dailyData[date] = { cadastros: 0, aprovados: 0, reprovados: 0 };
        }
        allLeads.forEach((lead: any) => {
            const leadDate = format(new Date(lead.createdAt), 'dd/MM');
            if (dailyData[leadDate]) {
                dailyData[leadDate].cadastros += 1;
                if (lead.status === 'APROVADO') dailyData[leadDate].aprovados += 1;
                if (lead.status === 'REPROVADO') dailyData[leadDate].reprovados += 1;
            }
        });
        const chartData = Object.keys(dailyData).map(date => ({ date, ...dailyData[date] }));
        
        return { totalLeads: total, approvedLeadsCount: approved, pendingRegistrations: pending, rejectedLeadsCount: rejected, approvalRate: rate, whatsappClicks: clicks, statusData: status, registrationChartData: chartData };
    }, [leadsResponse, whatsappResponse]);

    // Funções de ação
    const handleApprove = async (leadId: string) => {
        setIsUpdating(leadId);
        try {
            const response = await fetch(`/api/leads/id/approve`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ promotorId: 'system' }),
            });
            if (!response.ok) throw new Error('Falha ao aprovar.');
            toast({ title: "Sucesso!", description: "Cadastro aprovado." });
            mutate('/api/leads/id');
        } catch (error) {
            toast({ title: "Erro!", description: "Não foi possível aprovar o cadastro.", variant: 'destructive' });
        } finally {
            setIsUpdating(null);
        }
    };
    const handleReject = async (leadId: string) => {
        setIsUpdating(leadId);
        try {
            const response = await fetch(`/api/leads/id/reject`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ motivo: 'Análise interna' }),
            });
            if (!response.ok) throw new Error('Falha ao reprovar.');
            toast({ title: "Sucesso!", description: "Cadastro reprovado." });
            mutate('/api/leads/id');
        } catch (error) {
            toast({ title: "Erro!", description: "Não foi possível reprovar o cadastro.", variant: 'destructive' });
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

    const reportData = useMemo(() => {
        const today = new Date();
        const thirtyDaysAgo = new Date(new Date().setDate(today.getDate() - 30));
        return {
          periodo: `${format(thirtyDaysAgo, "dd/MM/yyyy", { locale: ptBR })} - ${format(new Date(), "dd/MM/yyyy", { locale: ptBR })}`,
          totalCadastros: totalLeads,
          aprovados: approvedLeadsCount,
          reprovados: rejectedLeadsCount,
          pendentesAnalise: pendingRegistrations.length,
          passadosPromotores: 0, // Conectar a dados reais se necessário
          taxaAprovacao: `${approvalRate}%`,
          tempoMedioAnalise: "N/A", // Conectar a dados reais se necessário
        }
    }, [totalLeads, approvedLeadsCount, rejectedLeadsCount, pendingRegistrations.length, approvalRate]);
    
    const exportToExcel = async () => { /* ... sua lógica de exportação ... */ };

    if (leadsError || whatsappError) return <div className="text-white p-4">Falha ao carregar os dados.</div>;
    if (!leadsResponse || !whatsappResponse) {
        return (
            <ShaderBackground>
                <div className="min-h-screen flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
                </div>
            </ShaderBackground>
        );
    }

    const userRole = user.user_metadata?.role || 'Admin';

    return (
        <ShaderBackground>
            <div className={`min-h-screen ${poppins.variable} ${playfair.variable} font-sans`}>
                <header className="bg-white/10 backdrop-blur-lg border-b border-white/20">
                    <div className="container mx-auto px-4 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <Image src="/logo2.png" alt="Segunda Pele Lingerie" width={50} height={50} className="drop-shadow-lg" />
                                <div>
                                    <span className="text-xl font-bold text-white" style={{ fontFamily: "var(--font-playfair)" }}>Segunda Pele Lingerie</span>
                                    <p className="text-sm text-violet-200" style={{ fontFamily: "var(--font-poppins)" }}>Painel Administrativo - MS</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <div className="text-right">
                                    <p className="text-sm font-medium text-white">{user.email}</p>
                                    <p className="text-xs text-violet-200">Cargo: {userRole}</p>
                                </div>
                                <Button onClick={handleLogout} variant="outline" size="sm" className="bg-white/10 text-white hover:bg-white/20"><LogOut className="w-4 h-4 mr-2" />Sair</Button>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="container mx-auto px-4 py-8">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg" style={{ fontFamily: "var(--font-playfair)" }}>Dashboard Analytics - MS</h1>
                            <p className="text-violet-200 text-lg">Métricas detalhadas de Mato Grosso do Sul em tempo real</p>
                        </div>
                        <div className="flex items-center gap-4">
                             <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                                <SelectTrigger className="w-40 bg-white/10 text-white"><Calendar className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-violet-900/90 text-white border-violet-400/30"><SelectItem value="7d">Últimos 7 dias</SelectItem><SelectItem value="30d">Últimos 30 dias</SelectItem></SelectContent>
                            </Select>
                            <div className="relative"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-violet-300" /><Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 w-64 bg-white/10 text-white placeholder-violet-200" /></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <Card className="bg-white/10 backdrop-blur-lg border-white/20"><CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-white">Total de Cadastros</CardTitle><Users className="h-4 w-4 text-violet-300" /></CardHeader><CardContent><div className="text-2xl font-bold text-white">{totalLeads}</div></CardContent></Card>
                        <Card className="bg-white/10 backdrop-blur-lg border-white/20"><CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-white">Taxa de Aprovação</CardTitle><UserCheck className="h-4 w-4 text-violet-300" /></CardHeader><CardContent><div className="text-2xl font-bold text-white">{approvalRate}%</div></CardContent></Card>
                        <Card className="bg-white/10 backdrop-blur-lg border-white/20"><CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-white">Pendentes</CardTitle><Clock className="h-4 w-4 text-violet-300" /></CardHeader><CardContent><div className="text-2xl font-bold text-white">{pendingRegistrations.length}</div></CardContent></Card>
                        <Card className="bg-white/10 backdrop-blur-lg border-white/20"><CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-white">Engajamento WhatsApp</CardTitle><MessageCircle className="h-4 w-4 text-violet-300" /></CardHeader><CardContent><div className="text-2xl font-bold text-white">{whatsappClicks}</div></CardContent></Card>
                    </div>

                    <Tabs defaultValue="overview" className="space-y-6">
                        <TabsList className="grid w-full grid-cols-4 bg-white/10"><TabsTrigger value="overview">Visão Geral</TabsTrigger><TabsTrigger value="registrations">Cadastros</TabsTrigger><TabsTrigger value="engagement">Engajamento</TabsTrigger><TabsTrigger value="geography">Geografia</TabsTrigger></TabsList>
                        
                        <TabsContent value="overview" className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <Card className="bg-white/10 backdrop-blur-lg border-white/20"><CardHeader><CardTitle className="text-white flex items-center"><BarChart3 className="w-5 h-5 mr-2" />Navegação Rápida</CardTitle></CardHeader><CardContent className="space-y-3"><Link href="/admin/consultants"><Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10"><Users className="w-4 h-4 mr-2" />Gerenciar Consultoras</Button></Link><Link href="/admin/reports"><Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10"><FileText className="w-4 h-4 mr-2" />Relatórios Detalhados</Button></Link></CardContent></Card>
                                <Card className="bg-white/10 backdrop-blur-lg border-white/20"><CardHeader><CardTitle className="text-white">Atividade Recente</CardTitle></CardHeader><CardContent className="space-y-3 text-sm text-violet-200"><div className="flex items-center"><div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>Cadastros aprovados recentemente</div></CardContent></Card>
                                <Card className="bg-white/10 backdrop-blur-lg border-white/20"><CardHeader><CardTitle className="text-white">Alertas do Sistema</CardTitle></CardHeader><CardContent className="space-y-3"><div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center text-red-300"><AlertCircle className="w-4 h-4 mr-2" /><span className="text-sm font-medium">{pendingRegistrations.length} cadastros pendentes</span></div></CardContent></Card>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <Card className="bg-white/10 backdrop-blur-lg border-white/20"><CardHeader><CardTitle className="text-white">Cadastros (Últimos 7 dias)</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><LineChart data={registrationChartData}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" /><XAxis dataKey="date" stroke="#c4b5fd" /><YAxis stroke="#c4b5fd" /><Tooltip contentStyle={{backgroundColor: "rgba(139, 92, 246, 0.9)"}} /><Legend /><Line type="monotone" dataKey="cadastros" stroke="#f59e0b" /><Line type="monotone" dataKey="aprovados" stroke="#22c55e" /></LineChart></ResponsiveContainer></CardContent></Card>
                                <Card className="bg-white/10 backdrop-blur-lg border-white/20"><CardHeader><CardTitle className="text-white">Distribuição de Status</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><RechartsPieChart><Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>{statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}</Pie><Tooltip contentStyle={{backgroundColor: "rgba(139, 92, 246, 0.9)"}} /><Legend /></RechartsPieChart></ResponsiveContainer></CardContent></Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="registrations" className="space-y-6">
                            <Card className="bg-white/10 backdrop-blur-lg border-white/20"><CardHeader><CardTitle className="text-white">Ações de Cadastro</CardTitle></CardHeader><CardContent className="space-y-4">
                                <Dialog open={showPendingModal} onOpenChange={setShowPendingModal}><DialogTrigger asChild><Button className="w-full sm:w-auto bg-gradient-to-r from-violet-500 to-purple-600"><Eye className="w-4 h-4 mr-2" />Ver Cadastros Pendentes ({pendingRegistrations.length})</Button></DialogTrigger><DialogContent className="max-w-4xl bg-violet-900/95 text-white"><DialogHeader><DialogTitle>Cadastros Pendentes</DialogTitle></DialogHeader><Table><TableHeader><TableRow className="hover:bg-transparent"><TableHead>Nome</TableHead><TableHead>Telefone</TableHead><TableHead>Cidade</TableHead><TableHead>Data</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader><TableBody>{pendingRegistrations.map((lead: any) => (<TableRow key={lead.id}><TableCell>{lead.consultant?.nome}</TableCell><TableCell>{lead.consultant?.telefone}</TableCell><TableCell>{lead.consultant?.address?.cidade}</TableCell><TableCell>{format(new Date(lead.createdAt), 'dd/MM/yyyy')}</TableCell><TableCell className="text-right"><div className="flex gap-2 justify-end"><Button size="icon" className="bg-green-600 h-8 w-8" onClick={() => handleApprove(lead.id)} disabled={isUpdating === lead.id}>{isUpdating === lead.id ? <Loader2 className="animate-spin" /> : <CheckCircle />}</Button><Button size="icon" className="bg-red-600 h-8 w-8" onClick={() => handleReject(lead.id)} disabled={isUpdating === lead.id}>{isUpdating === lead.id ? <Loader2 className="animate-spin" /> : <XCircle />}</Button></div></TableCell></TableRow>))}</TableBody></Table></DialogContent></Dialog>
                                {/* ... Outros botões e modais de exportação ... */}
                            </CardContent></Card>
                            <Card className="bg-white/10 backdrop-blur-lg border-white/20"><CardHeader><CardTitle className="text-white">Análise Detalhada de Cadastros</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={400}><AreaChart data={registrationChartData}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" /><XAxis dataKey="date" stroke="#c4b5fd" /><YAxis stroke="#c4b5fd" /><Tooltip contentStyle={{backgroundColor: "rgba(139, 92, 246, 0.9)"}} /><Legend /><Area type="monotone" dataKey="cadastros" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} /><Area type="monotone" dataKey="aprovados" stackId="2" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} /><Area type="monotone" dataKey="reprovados" stackId="3" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} /></AreaChart></ResponsiveContainer></CardContent></Card>
                        </TabsContent>
                        
                        <TabsContent value="engagement" className="space-y-6">
                           <Card className="bg-white/10 backdrop-blur-lg border-white/20"><CardHeader><CardTitle className="text-white">Horários de Pico - WhatsApp</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={400}><BarChart data={whatsappData}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" /><XAxis dataKey="hora" stroke="#c4b5fd" /><YAxis stroke="#c4b5fd" /><Tooltip contentStyle={{backgroundColor: "rgba(139, 92, 246, 0.9)"}} /><Bar dataKey="cliques" fill="#d946ef" /></BarChart></ResponsiveContainer></CardContent></Card>
                        </TabsContent>
                        
                        <TabsContent value="geography" className="space-y-6">
                            <Card className="bg-white/10 backdrop-blur-lg border-white/20"><CardHeader><CardTitle className="text-white">Cadastros por Cidade - MS</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={400}><BarChart data={cityData} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" /><XAxis type="number" stroke="#c4b5fd" /><YAxis dataKey="cidade" type="category" width={100} stroke="#c4b5fd" /><Tooltip contentStyle={{backgroundColor: "rgba(139, 92, 246, 0.9)"}} /><Bar dataKey="cadastros" fill="#f472b6" /></BarChart></ResponsiveContainer></CardContent></Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </ShaderBackground>
    );
}