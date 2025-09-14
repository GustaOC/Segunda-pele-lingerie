"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import useSWR, { mutate } from 'swr';
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast";
import {
  Search,
  Filter,
  Eye,
  Check,
  X,
  MessageCircle,
  Copy,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Heart,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Loader2,
  Users,
  UserCheck,
  Clock,
  RefreshCw
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Playfair_Display, Inter } from "next/font/google"
import Image from "next/image"
import { format } from "date-fns"

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-playfair" });
const inter = Inter({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], variable: "--font-inter" });

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const rejectionReasons = [
  "Histórico de inadimplência",
  "Documentação incompleta",
  "Região já atendida",
  "Perfil não adequado",
  "Outros",
]

export default function ConsultantManagement() {
  const router = useRouter()
  const { toast } = useToast()
  
  // Fetching leads and promoters
  const { data: leadsResponse, error: leadsError, isLoading: leadsLoading } = useSWR('/api/leads/id', fetcher, { refreshInterval: 5000 });
  const { data: promotersResponse, error: promotersError, isLoading: promotersLoading } = useSWR('/api/promoters', fetcher);

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [cityFilter, setCityFilter] = useState("all")
  const [selectedConsultant, setSelectedConsultant] = useState<any>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isConfirmWhatsappOpen, setIsConfirmWhatsappOpen] = useState(false);
  const [whatsappData, setWhatsappData] = useState<{ promoter: any, consultant: any } | null>(null);

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  
  const consultants = useMemo(() => leadsResponse?.data || [], [leadsResponse]);
  const promoters = useMemo(() => promotersResponse?.data || [], [promotersResponse]);

  const filteredConsultants = useMemo(() => consultants.filter((consultant: any) => {
    const c = consultant.consultant;
    const address = c?.address;
    if (!c || !address) return false;

    const matchesSearch =
      c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.cpf.includes(searchTerm) ||
      c.telefone.includes(searchTerm) ||
      address.cidade.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || consultant.status === statusFilter
    const matchesCity = cityFilter === "all" || address.cidade === cityFilter

    return matchesSearch && matchesStatus && matchesCity
  }), [consultants, searchTerm, statusFilter, cityFilter]);

  const totalPages = Math.ceil(filteredConsultants.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedConsultants = filteredConsultants.slice(startIndex, startIndex + itemsPerPage)

  // Estatísticas
  const stats = useMemo(() => {
    return {
      total: consultants.length,
      approved: consultants.filter((c: any) => c.status === 'APROVADO').length,
      pending: consultants.filter((c: any) => c.status === 'EM_ANALISE').length,
      rejected: consultants.filter((c: any) => c.status === 'REPROVADO').length
    }
  }, [consultants])

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

  const handleStatusChange = async (leadId: string, newStatus: string, details: any) => {
    try {
        const endpoint = newStatus === 'APROVADO' ? `/api/leads/id/approve?id=${leadId}` : `/api/leads/id/reject?id=${leadId}`;
        const body = newStatus === 'APROVADO'
            ? { promotorId: details.promoter, observacoes: details.notes }
            : { motivo: details.rejectionReason, observacoes: details.notes };

        const response = await fetch(endpoint, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao atualizar status.');
      }
      
      toast({ title: "Sucesso!", description: `Cadastro ${newStatus === 'APROVADO' ? 'aprovado' : 'reprovado'}.` });
      mutate('/api/leads/id');
      
      if (newStatus === 'APROVADO') {
        const selectedPromoter = promoters.find((p: any) => p.name === details.promoter);
        if (selectedPromoter) {
            setWhatsappData({ promoter: selectedPromoter, consultant: selectedConsultant.consultant });
            setIsConfirmWhatsappOpen(true);
        }
      }

    } catch (error: any) {
      toast({ title: "Erro!", description: error.message || "Não foi possível atualizar o status.", variant: 'destructive' });
    }
    setIsDetailModalOpen(false);
  };
  
  const copyToClipboard = (lead: any, fieldName: string) => {
    const { consultant } = lead;
    const { address } = consultant;
    const formattedData = `
Nome: ${consultant.nome}
CPF: ${consultant.cpf}
Rua: ${address.rua}
Número: ${address.numero}
Bairro: ${address.bairro}
Cidade: ${address.cidade}
Telefone: ${consultant.telefone}
    `.trim();
    navigator.clipboard.writeText(formattedData);
    toast({ description: `${fieldName} copiado para a área de transferência!` });
  };

  const handleSendToWhatsapp = () => {
    if (!whatsappData) return;
    const { promoter, consultant } = whatsappData;
    const message = `
Olá, ${promoter.name}!
Um novo cadastro de consultora foi aprovado para você:

*Nome:* ${consultant.nome}
*CPF:* ${consultant.cpf}
*Telefone:* ${consultant.telefone}
*Endereço:* ${consultant.address.rua}, ${consultant.address.numero}, ${consultant.address.bairro}
*Cidade:* ${consultant.address.cidade} - ${consultant.address.uf}

Por favor, entre em contato para os próximos passos.
    `.trim();

    const phone = promoter.phone.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    setIsConfirmWhatsappOpen(false);
  };

  const refreshData = () => {
    mutate('/api/leads/id');
    mutate('/api/promoters');
    toast({
      title: "Dados atualizados!",
      description: "Os dados foram recarregados com sucesso.",
      duration: 2000
    });
  };

  if (leadsLoading || promotersLoading) {
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
                <p className="text-sm text-slate-600" style={{ fontFamily: "var(--font-inter)" }}>Gerenciamento de Consultoras</p>
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
              <Button variant="outline" size="sm" onClick={() => router.push('/admin/promoters')} className="border-white/50 bg-white/50 text-slate-700 hover:bg-white hover:text-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
                Gerenciar Promotores
              </Button>
              <Button variant="outline" size="sm" onClick={() => router.push('/admin/dashboard')} className="border-white/50 bg-white/50 text-slate-700 hover:bg-white hover:text-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
                ← Dashboard
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 relative z-10">
        {/* Título e estatísticas */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-1" style={{ fontFamily: "var(--font-playfair)" }}>
                Gerenciar Consultoras
              </h1>
              <p className="text-slate-600" style={{ fontFamily: "var(--font-inter)" }}>{filteredConsultants.length} consultora(s) encontrada(s)</p>
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
                <X className="h-8 w-8 text-red-600" />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filtros */}
        <Card className="border border-white/50 bg-white/70 backdrop-blur-lg shadow-xl rounded-2xl mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-4 w-full lg:w-auto">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Buscar por nome, CPF, telefone ou cidade..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-80 border-white/50 focus:border-purple-500 focus:ring-purple-500 bg-white/80 backdrop-blur-sm rounded-2xl"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40 border-white/50 focus:border-purple-500 focus:ring-purple-500 bg-white/80 backdrop-blur-sm rounded-2xl">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos Status</SelectItem>
                    <SelectItem value="EM_ANALISE">Em Análise</SelectItem>
                    <SelectItem value="APROVADO">Aprovados</SelectItem>
                    <SelectItem value="REPROVADO">Reprovados</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={cityFilter} onValueChange={setCityFilter}>
                  <SelectTrigger className="w-40 border-white/50 focus:border-purple-500 focus:ring-purple-500 bg-white/80 backdrop-blur-sm rounded-2xl">
                    <MapPin className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas Cidades</SelectItem>
                    {[...new Set(consultants.map((c: any) => c.consultant?.address?.cidade).filter(Boolean))]
                      .map((city: any) => <SelectItem key={city} value={city}>{city}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela */}
        <Card className="border border-white/50 bg-white/70 backdrop-blur-lg shadow-xl rounded-2xl">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-white/30">
                  <TableHead className="text-slate-600 font-medium" style={{ fontFamily: "var(--font-inter)" }}>Consultora</TableHead>
                  <TableHead className="text-slate-600 font-medium" style={{ fontFamily: "var(--font-inter)" }}>CPF</TableHead>
                  <TableHead className="text-slate-600 font-medium" style={{ fontFamily: "var(--font-inter)" }}>Contato</TableHead>
                  <TableHead className="text-slate-600 font-medium" style={{ fontFamily: "var(--font-inter)" }}>Localização</TableHead>
                  <TableHead className="text-slate-600 font-medium" style={{ fontFamily: "var(--font-inter)" }}>Status</TableHead>
                  <TableHead className="text-slate-600 font-medium" style={{ fontFamily: "var(--font-inter)" }}>Data Cadastro</TableHead>
                  <TableHead className="text-slate-600 font-medium" style={{ fontFamily: "var(--font-inter)" }}>Promotor</TableHead>
                  <TableHead className="text-right text-slate-600 font-medium" style={{ fontFamily: "var(--font-inter)" }}>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedConsultants.map((lead) => (
                  <TableRow key={lead.id} className="border-b border-white/30 hover:bg-white/50">
                    <TableCell>
                      <div className="font-medium text-slate-800" style={{ fontFamily: "var(--font-inter)" }}>{lead.consultant?.nome}</div>
                    </TableCell>
                    <TableCell>
                      <div 
                          className="text-sm text-slate-600 flex items-center gap-2 cursor-pointer hover:text-purple-600"
                          onClick={() => copyToClipboard(lead.consultant?.cpf, 'CPF')}
                      >
                          {lead.consultant?.cpf} <Copy className="w-3 h-3"/>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="flex items-center gap-1 text-sm text-slate-800" style={{ fontFamily: "var(--font-inter)" }}>
                          <Phone className="w-3 h-3" />
                          {lead.consultant?.telefone}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-slate-500" style={{ fontFamily: "var(--font-inter)" }}>
                          <Mail className="w-3 h-3" />
                          {lead.consultant?.email || 'N/A'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-slate-800" style={{ fontFamily: "var(--font-inter)" }}>
                        <MapPin className="w-3 h-3" />
                        {lead.consultant?.address?.cidade}, {lead.consultant?.address?.uf}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(lead.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-slate-800" style={{ fontFamily: "var(--font-inter)" }}>
                        <Calendar className="w-3 h-3" />
                        {new Date(lead.createdAt).toLocaleDateString("pt-BR")}
                      </div>
                    </TableCell>
                    <TableCell>
                      {lead.promotorId ? (
                        <Badge variant="outline" className="text-slate-700 border-slate-200" style={{ fontFamily: "var(--font-inter)" }}>{lead.promotorId}</Badge>
                      ) : (
                        <span className="text-slate-400 text-sm" style={{ fontFamily: "var(--font-inter)" }}>Não atribuído</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedConsultant(lead)
                            setIsDetailModalOpen(true)
                          }}
                          className="bg-white/80 backdrop-blur-sm border-white/50 text-slate-700 hover:bg-white hover:text-slate-800 rounded-2xl"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="bg-white/80 backdrop-blur-sm border-white/50 text-slate-700 hover:bg-white hover:text-slate-800 rounded-2xl">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white/95 backdrop-blur-lg border-white/50 rounded-2xl">
                            <DropdownMenuItem onClick={() => copyToClipboard(lead, 'Dados Completos')} className="rounded-xl">
                              <Copy className="w-4 h-4 mr-2" />
                              Copiar Dados
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Paginação */}
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-slate-600" style={{ fontFamily: "var(--font-inter)" }}>
            Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredConsultants.length)} de{" "}
            {filteredConsultants.length} resultados
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="bg-white/80 backdrop-blur-sm border-white/50 text-slate-700 hover:bg-white hover:text-slate-800 rounded-2xl"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <span className="text-sm text-slate-900" style={{ fontFamily: "var(--font-inter)" }}>
              Página {currentPage} de {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="bg-white/80 backdrop-blur-sm border-white/50 text-slate-700 hover:bg-white hover:text-slate-800 rounded-2xl"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-lg border-white/50 shadow-2xl rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-slate-800" style={{ fontFamily: "var(--font-playfair)" }}>Detalhes da Consultora</DialogTitle>
            <DialogDescription className="text-slate-600" style={{ fontFamily: "var(--font-inter)" }}>Visualize e gerencie as informações da consultora</DialogDescription>
          </DialogHeader>

          {selectedConsultant && (
            <ConsultantDetailForm
              lead={selectedConsultant}
              onStatusChange={handleStatusChange}
              promoters={promoters}
              rejectionReasons={rejectionReasons}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* WhatsApp Confirmation Modal */}
      <Dialog open={isConfirmWhatsappOpen} onOpenChange={setIsConfirmWhatsappOpen}>
        <DialogContent className="bg-white/95 backdrop-blur-lg border-white/50 shadow-2xl rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-slate-800" style={{ fontFamily: "var(--font-playfair)" }}>Enviar para o Promotor?</DialogTitle>
            <DialogDescription className="text-slate-600" style={{ fontFamily: "var(--font-inter)" }}>
              Deseja enviar os dados desta consultora para o WhatsApp de {whatsappData?.promoter?.name}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmWhatsappOpen(false)} className="rounded-2xl">Não</Button>
            <Button 
              className="text-white font-semibold py-2 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-purple-500/20"
              style={{
                background: "linear-gradient(to right, #5D3A5B, #4A2E49, #3B2338)"
              }}
              onClick={handleSendToWhatsapp}
            >
              Sim, Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ConsultantDetailForm({
    lead,
    onStatusChange,
    promoters,
    rejectionReasons,
  }: {
    lead: any
    onStatusChange: (leadId: string, status: string, details: any) => void
    promoters: any[]
    rejectionReasons: string[]
  }) {
    const consultant = lead.consultant;
    const address = consultant.address;
    const [notes, setNotes] = useState(lead.observacoes || "")
    const [selectedPromoter, setSelectedPromoter] = useState(lead.promotorId || "")
    const [rejectionReason, setRejectionReason] = useState(lead.motivoReprovacao || "")
    const [customReason, setCustomReason] = useState("")
  
    const handleApprove = () => {
      if (!selectedPromoter) {
        alert("Por favor, selecione um promotor antes de aprovar.")
        return
      }
      onStatusChange(lead.id, "APROVADO", { promoter: selectedPromoter, notes })
    }
  
    const handleReject = () => {
      const finalReason = rejectionReason === "Outros" ? customReason : rejectionReason
      if (!finalReason) {
        alert("Por favor, selecione ou digite um motivo para a reprovação.")
        return
      }
      onStatusChange(lead.id, "REPROVADO", { rejectionReason: finalReason, notes })
    }
  
    return (
      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-slate-100/70 backdrop-blur-sm p-1 rounded-2xl border border-white/30">
          <TabsTrigger value="info" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-purple-700 rounded-2xl py-2 transition-all duration-300" style={{ fontFamily: "var(--font-inter)" }}>Informações</TabsTrigger>
          <TabsTrigger value="actions" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-purple-700 rounded-2xl py-2 transition-all duration-300" style={{ fontFamily: "var(--font-inter)" }}>Ações</TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-purple-700 rounded-2xl py-2 transition-all duration-300" style={{ fontFamily: "var(--font-inter)" }}>Histórico</TabsTrigger>
        </TabsList>
  
        <TabsContent value="info" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label className="text-slate-700" style={{ fontFamily: "var(--font-inter)" }}>Nome Completo</Label><Input value={consultant.nome} readOnly className="bg-slate-50/70 backdrop-blur-sm rounded-2xl border-white/50"/></div>
            <div><Label className="text-slate-700" style={{ fontFamily: "var(--font-inter)" }}>CPF</Label><Input value={consultant.cpf} readOnly className="bg-slate-50/70 backdrop-blur-sm rounded-2xl border-white/50"/></div>
            <div><Label className="text-slate-700" style={{ fontFamily: "var(--font-inter)" }}>Telefone</Label><Input value={consultant.telefone} readOnly className="bg-slate-50/70 backdrop-blur-sm rounded-2xl border-white/50"/></div>
            <div><Label className="text-slate-700" style={{ fontFamily: "var(--font-inter)" }}>Email</Label><Input value={consultant.email || 'N/A'} readOnly className="bg-slate-50/70 backdrop-blur-sm rounded-2xl border-white/50"/></div>
            <div className="md:col-span-2"><Label className="text-slate-700" style={{ fontFamily: "var(--font-inter)" }}>Endereço</Label><Input value={`${address.rua}, ${address.numero}, ${address.bairro}`} readOnly className="bg-slate-50/70 backdrop-blur-sm rounded-2xl border-white/50"/></div>
            <div><Label className="text-slate-700" style={{ fontFamily: "var(--font-inter)" }}>Cidade</Label><Input value={address.cidade} readOnly className="bg-slate-50/70 backdrop-blur-sm rounded-2xl border-white/50"/></div>
            <div><Label className="text-slate-700" style={{ fontFamily: "var(--font-inter)" }}>CEP</Label><Input value={address.cep} readOnly className="bg-slate-50/70 backdrop-blur-sm rounded-2xl border-white/50"/></div>
          </div>
        </TabsContent>
  
        <TabsContent value="actions" className="space-y-4 pt-4">
            {lead.status === "EM_ANALISE" && (
                <>
                <div><Label htmlFor="promoter" className="text-slate-700" style={{ fontFamily: "var(--font-inter)" }}>Selecionar Promotor (para aprovação)</Label><Select value={selectedPromoter} onValueChange={setSelectedPromoter}><SelectTrigger className="bg-white/80 backdrop-blur-sm border-white/50 rounded-2xl"><SelectValue placeholder="Escolha um promotor" /></SelectTrigger><SelectContent>{promoters.map((p) => (<SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>))}</SelectContent></Select></div>
                <div><Label htmlFor="rejectionReason" className="text-slate-700" style={{ fontFamily: "var(--font-inter)" }}>Motivo da Reprovação (se aplicável)</Label><Select value={rejectionReason} onValueChange={setRejectionReason}><SelectTrigger className="bg-white/80 backdrop-blur-sm border-white/50 rounded-2xl"><SelectValue placeholder="Selecione um motivo" /></SelectTrigger><SelectContent>{rejectionReasons.map((r) => (<SelectItem key={r} value={r}>{r}</SelectItem>))}</SelectContent></Select></div>
                {rejectionReason === "Outros" && (<div><Label htmlFor="customReason" className="text-slate-700" style={{ fontFamily: "var(--font-inter)" }}>Motivo Personalizado</Label><Input id="customReason" value={customReason} onChange={(e) => setCustomReason(e.target.value)} placeholder="Digite o motivo da reprovação" className="bg-white/80 backdrop-blur-sm border-white/50 rounded-2xl" /></div>)}
                <div className="flex gap-4 pt-4"><Button onClick={handleApprove} className="flex-1 text-white font-semibold py-3 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-green-500/20" style={{ background: "linear-gradient(to right, #059669, #047857, #065f46)" }}><Check className="w-4 h-4 mr-2" />Aprovar</Button><Button onClick={handleReject} className="flex-1 text-white font-semibold py-3 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-red-500/20" style={{ background: "linear-gradient(to right, #dc2626, #b91c1c, #991b1b)" }}><X className="w-4 h-4 mr-2" />Reprovar</Button></div>
                </>
            )}
             {lead.status === "APROVADO" && <p className="text-green-700 p-4 bg-green-50/70 backdrop-blur-sm rounded-md border border-green-200" style={{ fontFamily: "var(--font-inter)" }}>Cadastro aprovado e encaminhado para o promotor: {lead.promotorId}.</p>}
             {lead.status === "REPROVADO" && <p className="text-red-700 p-4 bg-red-50/70 backdrop-blur-sm rounded-md border border-red-200" style={{ fontFamily: "var(--font-inter)" }}>Cadastro reprovado. Motivo: {lead.motivoReprovacao}.</p>}
        </TabsContent>
  
        <TabsContent value="history" className="space-y-4 pt-4">
          <p className="text-slate-600" style={{ fontFamily: "var(--font-inter)" }}>O histórico de alterações do lead aparecerá aqui.</p>
        </TabsContent>
      </Tabs>
    )
  }