// app/admin/(protected)/consultants/reports/page.tsx
"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import useSWR from 'swr';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast";
import {
  Download,
  FileText,
  Calendar,
  ChevronLeft,
  Loader2,
  RefreshCw
} from "lucide-react"
import ShaderBackground from "@/components/shader-background"
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
    const { toast } = useToast();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState("7");
    const [isExporting, setIsExporting] = useState(false);

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

    const { data: leadsResponse, error: leadsError, isLoading: leadsLoading } = useSWR('/api/leads/id', fetcher);

    const filteredLeads = useMemo(() => {
        if (!leadsResponse?.data) return [];
        const days = parseInt(period, 10);
        const startDate = subDays(new Date(), days);
        return leadsResponse.data.filter((lead: any) => new Date(lead.createdAt) >= startDate);
    }, [leadsResponse, period]);

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

    const exportReportToExcel = () => {
        setIsExporting(true);
        const dataToExport = filteredLeads.map((lead: any) => ({
            "Nome": lead.consultant?.nome,
            "CPF": lead.consultant?.cpf,
            "Telefone": lead.consultant?.telefone,
            "Cidade": lead.consultant?.address?.cidade,
            "Status": lead.status,
            "Data Cadastro": format(new Date(lead.createdAt), 'dd/MM/yyyy HH:mm'),
            "Promotor": lead.promotorId || 'N/A',
            "Motivo Reprovação": lead.motivoReprovacao || 'N/A'
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Relatorio");
        XLSX.writeFile(wb, `relatorio_detalhado_${period}_dias.xlsx`);
        setIsExporting(false);
        toast({ title: "Sucesso!", description: "Relatório exportado para Excel." });
    }
    
    if (loading || leadsLoading) {
      return (
          <ShaderBackground>
              <div className="min-h-screen flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
              </div>
          </ShaderBackground>
      );
    }
    
    return (
        <ShaderBackground>
            <div className={`min-h-screen ${poppins.variable} ${playfair.variable} font-sans`}>
                <header className="bg-white/10 backdrop-blur-lg border-b border-white/20">
                    <div className="container mx-auto px-4 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <Image src="/logo2.png" alt="Segunda Pele Lingerie" width={50} height={50} className="drop-shadow-lg" />
                                <div>
                                    <span className="text-xl font-bold text-white">Segunda Pele Lingerie</span>
                                    <p className="text-sm text-violet-200">Relatórios Detalhados</p>
                                </div>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => router.push('/admin/dashboard')} className="bg-white/10 text-white hover:bg-white/20">
                                <ChevronLeft className="w-4 h-4 mr-2" />
                                Voltar ao Dashboard
                            </Button>
                        </div>
                    </div>
                </header>

                <div className="container mx-auto px-4 py-8 text-white">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-3xl font-bold">Relatório de Cadastros</h1>
                            <p className="text-violet-200">Exibindo cadastros dos últimos {period} dias.</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <Select value={period} onValueChange={setPeriod}>
                                <SelectTrigger className="w-48 bg-white/10 border-white/20">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-violet-900/90 text-white border-violet-400/30">
                                    <SelectItem value="7">Últimos 7 dias</SelectItem>
                                    <SelectItem value="15">Últimos 15 dias</SelectItem>
                                    <SelectItem value="30">Últimos 30 dias</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button onClick={exportReportToExcel} disabled={isExporting}>
                                {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                                Exportar Dados
                            </Button>
                        </div>
                    </div>

                    <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-b border-white/20">
                                        <TableHead className="text-violet-200">Consultora</TableHead>
                                        <TableHead className="text-violet-200">Status</TableHead>
                                        <TableHead className="text-violet-200">Data</TableHead>
                                        <TableHead className="text-violet-200">Promotor</TableHead>
                                        <TableHead className="text-violet-200">Motivo (se reprovado)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredLeads.map((lead: any) => (
                                        <TableRow key={lead.id} className="border-b border-white/20 hover:bg-white/5">
                                            <TableCell className="font-medium text-white">{lead.consultant?.nome}</TableCell>
                                            <TableCell>{getStatusBadge(lead.status)}</TableCell>
                                            <TableCell className="text-white">{format(new Date(lead.createdAt), 'dd/MM/yyyy HH:mm')}</TableCell>
                                            <TableCell className="text-white">{lead.promotorId || 'N/A'}</TableCell>
                                            <TableCell className="text-white">{lead.motivoReprovacao || 'N/A'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </ShaderBackground>
    );
}