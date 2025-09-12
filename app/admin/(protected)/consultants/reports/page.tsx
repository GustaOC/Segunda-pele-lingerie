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
  Copy
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

    const { data: leadsResponse, error: leadsError, isLoading: leadsLoading } = useSWR('/api/leads/id', fetcher);

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
                            <h1 className="text-3xl font-bold">
                                {promoter ? `Relatório do Promotor: ${promoter}` : 'Relatório de Cadastros'}
                            </h1>
                            <p className="text-violet-200">
                                {period ? `Exibindo cadastros dos últimos ${period} dias.` : 'Exibindo todos os cadastros do promotor.'}
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
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
                                        <TableHead className="text-violet-200">CPF</TableHead>
                                        <TableHead className="text-violet-200">Telefone</TableHead>
                                        <TableHead className="text-violet-200">Status</TableHead>
                                        <TableHead className="text-violet-200">Data Cadastro</TableHead>
                                        <TableHead className="text-violet-200">Promotor</TableHead>
                                        <TableHead className="text-violet-200">Data Transferência</TableHead>
                                        <TableHead className="text-violet-200">Observações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredLeads.map((lead: any) => (
                                        <TableRow key={lead.id} className="border-b border-white/20 hover:bg-white/5">
                                            <TableCell className="font-medium text-white">{lead.consultant?.nome}</TableCell>
                                            <TableCell
                                                className="text-white cursor-pointer hover:text-violet-300"
                                                onClick={() => copyToClipboard(lead.consultant?.cpf)}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {lead.consultant?.cpf}
                                                    <Copy className="w-3 h-3" />
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-white">{lead.consultant?.telefone}</TableCell>
                                            <TableCell>{getStatusBadge(lead.status)}</TableCell>
                                            <TableCell className="text-white">{format(new Date(lead.createdAt), 'dd/MM/yyyy HH:mm')}</TableCell>
                                            <TableCell className="text-white">{lead.promotorId || 'N/A'}</TableCell>
                                            <TableCell className="text-white">
                                                {lead.encaminhadoEm ? format(new Date(lead.encaminhadoEm), 'dd/MM/yyyy HH:mm') : 'N/A'}
                                            </TableCell>
                                            <TableCell className="text-white">{lead.observacoes || 'N/A'}</TableCell>
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