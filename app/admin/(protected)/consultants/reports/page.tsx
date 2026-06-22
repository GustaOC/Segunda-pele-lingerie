// app/admin/(protected)/consultants/reports/page.tsx
"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import useSWR from 'swr';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast";
import {
  Download,
  ChevronLeft,
  Loader2,
  Copy,
  RefreshCw,
  FileSpreadsheet,
  Users,
  UserCheck,
  Clock,
  XCircle
} from "lucide-react"
import { Playfair_Display, Inter } from "next/font/google"
import Image from "next/image"
import { format, subDays } from "date-fns"
import * as XLSX from 'xlsx';
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-playfair" });
const inter = Inter({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], variable: "--font-inter" });

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function DetailedReportsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);

    const period = searchParams.get('period');
    const promoter = searchParams.get('promoter');

    const supabase = createClient();

    useEffect(() => {
      const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push("/admin/login");
        } else {
          setUser(session.user);
          setLoading(false);
        }
      };
      checkAuth();
    }, [router, supabase.auth]);

    const { data: leadsResponse, error: leadsError, isLoading: leadsLoading, mutate: mutateLeads } = useSWR('/api/leads/id', fetcher);

    const filteredLeads = useMemo(() => {
        if (!leadsResponse?.data) return [];
        let leads = leadsResponse.data;

        if (period) {
            const days = parseInt(period, 10);
            const startDate = subDays(new Date(), days);
            leads = leads.filter((lead: any) => new Date(lead.createdAt) >= startDate);
        }

        if (promoter) {
            leads = leads.filter((lead: any) => lead.promotorId === promoter);
        }

        return leads.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [leadsResponse, period, promoter]);

    // Estatísticas
    const stats = useMemo(() => {
        return {
            total: filteredLeads.length,
            approved: filteredLeads.filter((l: any) => l.status === 'APROVADO').length,
            pending: filteredLeads.filter((l: any) => l.status === 'EM_ANALISE').length,
            rejected: filteredLeads.filter((l: any) => l.status === 'REPROVADO').length
        }
    }, [filteredLeads])

    const getStatusBadge = (status: string) => {
        switch (status) {
          case "EM_ANALISE":
            return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Em Análise</Badge>
          case "APROVADO":
            return <Badge className="bg-green-100 text-green-800 border-green-200">Aprovado</Badge>
          case "REPROVADO":
            return <Badge className="bg-red-100 text-red-800 border-red-200">Reprovado</Badge>
          default:
            return <Badge variant="outline">{status}</Badge>
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "CPF Copiado!", description: "O CPF da consultora foi copiado para a área de transferência." });
    }

    const exportReportToExcel = () => {
        setIsExporting(true);
        const dataToExport = filteredLeads.map((lead: any) => ({
            "Consultora": lead.consultant?.nome,
            "CPF": lead.consultant?.cpf,
            "Telefone": lead.consultant?.telefone,
            "Status": lead.status,
            "Data Cadastro": format(new Date(lead.createdAt), 'dd/MM/yyyy HH:mm'),
            "Promotor": lead.promotorId || 'N/A',
            "Data de Transferência": lead.encaminhadoEm ? format(new Date(lead.encaminhadoEm), 'dd/MM/yyyy HH:mm') : 'N/A',
            "Observações": lead.observacoes || 'N/A'
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Relatorio");
        const reportType = promoter ? `promotor_${promoter}` : `detalhado_${period}_dias`;
        XLSX.writeFile(wb, `relatorio_${reportType}.xlsx`);
        setIsExporting(false);
        toast({ title: "Sucesso!", description: "Relatório exportado para Excel." });
    }

    const refreshData = () => {
        mutateLeads();
        toast({
            title: "Dados atualizados!",
            description: "Os dados foram recarregados com sucesso.",
            duration: 2000
        });
    };
    
    if (loading || leadsLoading) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-indigo-50/20 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-300/10 to-pink-300/10 rounded-full blur-3xl"></div>
          </div>

          <div className="text-center p-8 bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 max-w-md z-10">
            <div className="inline-flex items-center justify-center mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: "#5D3A5B" }}></div>
            </div>
            <h2 className="text-xl font-semibold text-slate-800 mb-2" style={{ fontFamily: "var(--font-playfair)" }}>Carregando dados</h2>
            <p className="text-slate-600" style={{ fontFamily: "var(--font-inter)" }}>Aguarde um momento...</p>
          </div>
        </div>
      );
    }
    
    return (
      <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-indigo-50/20 ${inter.variable} ${playfair.variable} font-sans relative overflow-hidden`}>
        {/* Background decorativo */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-300/10 to-pink-300/10 rounded-full blur-3xl"></div>
        </div>

        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-white/50 sticky top-0 z-40">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-2xl" style={{ background: "linear-gradient(to right, #5D3A5B, #4A2E49, #3B2338)" }}>
                  <Image src="/logo2.png" alt="Segunda Pele Lingerie" width={40} height={40} className="filter brightness-0 invert" />
                </div>
                <div>
                  <span className="text-xl font-bold text-slate-800" style={{ fontFamily: "var(--font-playfair)" }}>Segunda Pele Lingerie</span>
                  <p className="text-sm text-slate-600" style={{ fontFamily: "var(--font-inter)" }}>Relatórios Detalhados</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  onClick={refreshData}
                  variant="outline"
                  size="sm"
                  className="border-white/50 bg-white/50 text-slate-700 hover:bg-white hover:text-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Atualizar
                </Button>
                <Button variant="outline" size="sm" onClick={() => router.push('/admin/dashboard')} className="border-white/50 bg-white/50 text-slate-700 hover:bg-white hover:text-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Voltar ao Dashboard
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-6 relative z-10">
          {/* Título e estatísticas */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-slate-800 mb-1" style={{ fontFamily: "var(--font-playfair)" }}>
                  {promoter ? `Relatório do Promotor: ${promoter}` : 'Relatório de Cadastros'}
                </h1>
                <p className="text-slate-600" style={{ fontFamily: "var(--font-inter)" }}>
                  {period ? `Exibindo cadastros dos últimos ${period} dias.` : 'Exibindo todos os cadastros do promotor.'}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Button 
                  onClick={exportReportToExcel} 
                  disabled={isExporting} 
                  className="text-white font-semibold py-2 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-purple-500/20"
                  style={{
                    background: "linear-gradient(to right, #5D3A5B, #4A2E49, #3B2338)"
                  }}
                >
                  {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                  Exportar Dados
                </Button>
              </div>
            </div>

            {/* Cards de estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">
              <Card className="border border-white/50 bg-white/70 backdrop-blur-lg shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 mb-1" style={{ fontFamily: "var(--font-inter)" }}>Total</p>
                    <p className="text-2xl font-bold text-slate-800" style={{ fontFamily: "var(--font-playfair)" }}>{stats.total}</p>
                  </div>
                  <Users className="h-8 w-8" style={{ color: "#5D3A5B" }} />
                </CardContent>
              </Card>

              <Card className="border border-white/50 bg-white/70 backdrop-blur-lg shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 mb-1" style={{ fontFamily: "var(--font-inter)" }}>Aprovadas</p>
                    <p className="text-2xl font-bold text-slate-800" style={{ fontFamily: "var(--font-playfair)" }}>{stats.approved}</p>
                  </div>
                  <UserCheck className="h-8 w-8 text-green-600" />
                </CardContent>
              </Card>

              <Card className="border border-white/50 bg-white/70 backdrop-blur-lg shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 mb-1" style={{ fontFamily: "var(--font-inter)" }}>Em Análise</p>
                    <p className="text-2xl font-bold text-slate-800" style={{ fontFamily: "var(--font-playfair)" }}>{stats.pending}</p>
                  </div>
                  <Clock className="h-8 w-8 text-amber-600" />
                </CardContent>
              </Card>

              <Card className="border border-white/50 bg-white/70 backdrop-blur-lg shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 mb-1" style={{ fontFamily: "var(--font-inter)" }}>Reprovadas</p>
                    <p className="text-2xl font-bold text-slate-800" style={{ fontFamily: "var(--font-playfair)" }}>{stats.rejected}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-600" />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Tabela */}
          <Card className="border border-white/50 bg-white/70 backdrop-blur-lg shadow-xl rounded-2xl">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-white/30">
                    <TableHead className="text-slate-600 font-medium" style={{ fontFamily: "var(--font-inter)" }}>Consultora</TableHead>
                    <TableHead className="text-slate-600 font-medium" style={{ fontFamily: "var(--font-inter)" }}>CPF</TableHead>
                    <TableHead className="text-slate-600 font-medium" style={{ fontFamily: "var(--font-inter)" }}>Telefone</TableHead>
                    <TableHead className="text-slate-600 font-medium" style={{ fontFamily: "var(--font-inter)" }}>Status</TableHead>
                    <TableHead className="text-slate-600 font-medium" style={{ fontFamily: "var(--font-inter)" }}>Data Cadastro</TableHead>
                    <TableHead className="text-slate-600 font-medium" style={{ fontFamily: "var(--font-inter)" }}>Promotor</TableHead>
                    <TableHead className="text-slate-600 font-medium" style={{ fontFamily: "var(--font-inter)" }}>Data Transferência</TableHead>
                    <TableHead className="text-slate-600 font-medium" style={{ fontFamily: "var(--font-inter)" }}>Observações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead: any) => (
                    <TableRow key={lead.id} className="border-b border-white/30 hover:bg-white/50">
                      <TableCell className="font-medium text-slate-800" style={{ fontFamily: "var(--font-inter)" }}>{lead.consultant?.nome}</TableCell>
                      <TableCell
                        className="text-slate-800 cursor-pointer hover:text-purple-600"
                        onClick={() => copyToClipboard(lead.consultant?.cpf)}
                      >
                        <div className="flex items-center gap-2">
                          {lead.consultant?.cpf}
                          <Copy className="w-3 h-3" />
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-800" style={{ fontFamily: "var(--font-inter)" }}>{lead.consultant?.telefone}</TableCell>
                      <TableCell>{getStatusBadge(lead.status)}</TableCell>
                      <TableCell className="text-slate-800" style={{ fontFamily: "var(--font-inter)" }}>{format(new Date(lead.createdAt), 'dd/MM/yyyy HH:mm')}</TableCell>
                      <TableCell className="text-slate-800" style={{ fontFamily: "var(--font-inter)" }}>{lead.promotorId || 'N/A'}</TableCell>
                      <TableCell className="text-slate-800" style={{ fontFamily: "var(--font-inter)" }}>
                        {lead.encaminhadoEm ? format(new Date(lead.encaminhadoEm), 'dd/MM/yyyy HH:mm') : 'N/A'}
                      </TableCell>
                      <TableCell className="text-slate-800" style={{ fontFamily: "var(--font-inter)" }}>{lead.observacoes || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    );
}