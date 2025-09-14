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
import { Playfair_Display, Poppins } from "next/font/google"
import Image from "next/image"
import { format, subDays } from "date-fns"
import * as XLSX from 'xlsx';
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-playfair" });
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-poppins" });

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
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 flex items-center justify-center">
          <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
            <div className="inline-flex items-center justify-center mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Carregando dados</h2>
            <p className="text-gray-600">Aguarde um momento...</p>
          </div>
        </div>
      );
    }
    
    return (
      <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 ${poppins.variable} ${playfair.variable} font-sans`}>
        {/* Header */}
        <header className="bg-white shadow-sm border-b sticky top-0 z-40">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg">
                  <Image src="/logo2.png" alt="Segunda Pele Lingerie" width={40} height={40} className="filter brightness-0 invert" />
                </div>
                <div>
                  <span className="text-xl font-bold text-gray-900" style={{ fontFamily: "var(--font-playfair)" }}>Segunda Pele Lingerie</span>
                  <p className="text-sm text-gray-600" style={{ fontFamily: "var(--font-poppins)" }}>Relatórios Detalhados</p>
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
                <Button variant="outline" size="sm" onClick={() => router.push('/admin/dashboard')} className="border-purple-200 bg-white text-purple-700 hover:bg-purple-50 hover:text-purple-800 shadow-sm">
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Voltar ao Dashboard
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-6">
          {/* Título e estatísticas */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-1" style={{ fontFamily: "var(--font-playfair)" }}>
                  {promoter ? `Relatório do Promotor: ${promoter}` : 'Relatório de Cadastros'}
                </h1>
                <p className="text-gray-600">
                  {period ? `Exibindo cadastros dos últimos ${period} dias.` : 'Exibindo todos os cadastros do promotor.'}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Button onClick={exportReportToExcel} disabled={isExporting} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
                  {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                  Exportar Dados
                </Button>
              </div>
            </div>

            {/* Cards de estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-white to-purple-50">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-600" />
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-white to-green-50">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Aprovadas</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
                  </div>
                  <UserCheck className="h-8 w-8 text-green-600" />
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-white to-amber-50">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Em Análise</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                  </div>
                  <Clock className="h-8 w-8 text-amber-600" />
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-white to-red-50">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Reprovadas</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-600" />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Tabela */}
          <Card className="border-0 shadow-md">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-200">
                    <TableHead className="text-gray-600 font-medium">Consultora</TableHead>
                    <TableHead className="text-gray-600 font-medium">CPF</TableHead>
                    <TableHead className="text-gray-600 font-medium">Telefone</TableHead>
                    <TableHead className="text-gray-600 font-medium">Status</TableHead>
                    <TableHead className="text-gray-600 font-medium">Data Cadastro</TableHead>
                    <TableHead className="text-gray-600 font-medium">Promotor</TableHead>
                    <TableHead className="text-gray-600 font-medium">Data Transferência</TableHead>
                    <TableHead className="text-gray-600 font-medium">Observações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead: any) => (
                    <TableRow key={lead.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <TableCell className="font-medium text-gray-900">{lead.consultant?.nome}</TableCell>
                      <TableCell
                        className="text-gray-900 cursor-pointer hover:text-purple-600"
                        onClick={() => copyToClipboard(lead.consultant?.cpf)}
                      >
                        <div className="flex items-center gap-2">
                          {lead.consultant?.cpf}
                          <Copy className="w-3 h-3" />
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-900">{lead.consultant?.telefone}</TableCell>
                      <TableCell>{getStatusBadge(lead.status)}</TableCell>
                      <TableCell className="text-gray-900">{format(new Date(lead.createdAt), 'dd/MM/yyyy HH:mm')}</TableCell>
                      <TableCell className="text-gray-900">{lead.promotorId || 'N/A'}</TableCell>
                      <TableCell className="text-gray-900">
                        {lead.encaminhadoEm ? format(new Date(lead.encaminhadoEm), 'dd/MM/yyyy HH:mm') : 'N/A'}
                      </TableCell>
                      <TableCell className="text-gray-900">{lead.observacoes || 'N/A'}</TableCell>
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