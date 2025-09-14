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
import { Playfair_Display, Poppins } from "next/font/google"
import Image from "next/image"
import { format } from "date-fns"

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-playfair" });
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-poppins" });

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
                <p className="text-sm text-gray-600" style={{ fontFamily: "var(--font-poppins)" }}>Gerenciamento de Consultoras</p>
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
              <Button variant="outline" size="sm" onClick={() => router.push('/admin/promoters')} className="border-purple-200 bg-white text-purple-700 hover:bg-purple-50 hover:text-purple-800 shadow-sm">
                Gerenciar Promotores
              </Button>
              <Button variant="outline" size="sm" onClick={() => router.push('/admin/dashboard')} className="border-purple-200 bg-white text-purple-700 hover:bg-purple-50 hover:text-purple-800 shadow-sm">
                ← Dashboard
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Título e estatísticas */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1" style={{ fontFamily: "var(--font-playfair)" }}>
                Gerenciar Consultoras
              </h1>
              <p className="text-gray-600">{filteredConsultants.length} consultora(s) encontrada(s)</p>
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
                <X className="h-8 w-8 text-red-600" />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filtros */}
        <Card className="border-0 shadow-md mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-4 w-full lg:w-auto">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Buscar por nome, CPF, telefone ou cidade..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-80 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40 border-gray-200 focus:border-purple-500 focus:ring-purple-500">
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
                  <SelectTrigger className="w-40 border-gray-200 focus:border-purple-500 focus:ring-purple-500">
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
        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-200">
                  <TableHead className="text-gray-600 font-medium">Consultora</TableHead>
                  <TableHead className="text-gray-600 font-medium">CPF</TableHead>
                  <TableHead className="text-gray-600 font-medium">Contato</TableHead>
                  <TableHead className="text-gray-600 font-medium">Localização</TableHead>
                  <TableHead className="text-gray-600 font-medium">Status</TableHead>
                  <TableHead className="text-gray-600 font-medium">Data Cadastro</TableHead>
                  <TableHead className="text-gray-600 font-medium">Promotor</TableHead>
                  <TableHead className="text-right text-gray-600 font-medium">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedConsultants.map((lead) => (
                  <TableRow key={lead.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <TableCell>
                      <div className="font-medium text-gray-900">{lead.consultant?.nome}</div>
                    </TableCell>
                    <TableCell>
                      <div 
                          className="text-sm text-gray-600 flex items-center gap-2 cursor-pointer hover:text-purple-600"
                          onClick={() => copyToClipboard(lead.consultant?.cpf, 'CPF')}
                      >
                          {lead.consultant?.cpf} <Copy className="w-3 h-3"/>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="flex items-center gap-1 text-sm text-gray-900">
                          <Phone className="w-3 h-3" />
                          {lead.consultant?.telefone}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Mail className="w-3 h-3" />
                          {lead.consultant?.email || 'N/A'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-gray-900">
                        <MapPin className="w-3 h-3" />
                        {lead.consultant?.address?.cidade}, {lead.consultant?.address?.uf}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(lead.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-gray-900">
                        <Calendar className="w-3 h-3" />
                        {new Date(lead.createdAt).toLocaleDateString("pt-BR")}
                      </div>
                    </TableCell>
                    <TableCell>
                      {lead.promotorId ? (
                        <Badge variant="outline" className="text-gray-700 border-gray-200">{lead.promotorId}</Badge>
                      ) : (
                        <span className="text-gray-400 text-sm">Não atribuído</span>
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
                          className="bg-white border-purple-200 text-purple-700 hover:bg-purple-50"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => copyToClipboard(lead, 'Dados Completos')}>
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
          <p className="text-sm text-gray-600">
            Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredConsultants.length)} de{" "}
            {filteredConsultants.length} resultados
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <span className="text-sm text-gray-900">
              Página {currentPage} de {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Detalhes da Consultora</DialogTitle>
            <DialogDescription className="text-gray-600">Visualize e gerencie as informações da consultora</DialogDescription>
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
        <DialogContent className="bg-white border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Enviar para o Promotor?</DialogTitle>
            <DialogDescription className="text-gray-600">
              Deseja enviar os dados desta consultora para o WhatsApp de {whatsappData?.promoter?.name}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmWhatsappOpen(false)}>Não</Button>
            <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700" onClick={handleSendToWhatsapp}>Sim, Enviar</Button>
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
        <TabsList className="grid w-full grid-cols-3 bg-gray-100">
          <TabsTrigger value="info" className="data-[state=active]:bg-white">Informações</TabsTrigger>
          <TabsTrigger value="actions" className="data-[state=active]:bg-white">Ações</TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-white">Histórico</TabsTrigger>
        </TabsList>
  
        <TabsContent value="info" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label className="text-gray-700">Nome Completo</Label><Input value={consultant.nome} readOnly className="bg-gray-50"/></div>
            <div><Label className="text-gray-700">CPF</Label><Input value={consultant.cpf} readOnly className="bg-gray-50"/></div>
            <div><Label className="text-gray-700">Telefone</Label><Input value={consultant.telefone} readOnly className="bg-gray-50"/></div>
            <div><Label className="text-gray-700">Email</Label><Input value={consultant.email || 'N/A'} readOnly className="bg-gray-50"/></div>
            <div className="md:col-span-2"><Label className="text-gray-700">Endereço</Label><Input value={`${address.rua}, ${address.numero}, ${address.bairro}`} readOnly className="bg-gray-50"/></div>
            <div><Label className="text-gray-700">Cidade</Label><Input value={address.cidade} readOnly className="bg-gray-50"/></div>
            <div><Label className="text-gray-700">CEP</Label><Input value={address.cep} readOnly className="bg-gray-50"/></div>
          </div>
        </TabsContent>
  
        <TabsContent value="actions" className="space-y-4 pt-4">
            {lead.status === "EM_ANALISE" && (
                <>
                <div><Label htmlFor="promoter" className="text-gray-700">Selecionar Promotor (para aprovação)</Label><Select value={selectedPromoter} onValueChange={setSelectedPromoter}><SelectTrigger className="bg-white border-gray-200"><SelectValue placeholder="Escolha um promotor" /></SelectTrigger><SelectContent>{promoters.map((p) => (<SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>))}</SelectContent></Select></div>
                <div><Label htmlFor="rejectionReason" className="text-gray-700">Motivo da Reprovação (se aplicável)</Label><Select value={rejectionReason} onValueChange={setRejectionReason}><SelectTrigger className="bg-white border-gray-200"><SelectValue placeholder="Selecione um motivo" /></SelectTrigger><SelectContent>{rejectionReasons.map((r) => (<SelectItem key={r} value={r}>{r}</SelectItem>))}</SelectContent></Select></div>
                {rejectionReason === "Outros" && (<div><Label htmlFor="customReason" className="text-gray-700">Motivo Personalizado</Label><Input id="customReason" value={customReason} onChange={(e) => setCustomReason(e.target.value)} placeholder="Digite o motivo da reprovação" className="bg-white border-gray-200" /></div>)}
                <div className="flex gap-4 pt-4"><Button onClick={handleApprove} className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"><Check className="w-4 h-4 mr-2" />Aprovar</Button><Button onClick={handleReject} className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"><X className="w-4 h-4 mr-2" />Reprovar</Button></div>
                </>
            )}
             {lead.status === "APROVADO" && <p className="text-green-700 p-4 bg-green-50 rounded-md border border-green-200">Cadastro aprovado e encaminhado para o promotor: {lead.promotorId}.</p>}
             {lead.status === "REPROVADO" && <p className="text-red-700 p-4 bg-red-50 rounded-md border border-red-200">Cadastro reprovado. Motivo: {lead.motivoReprovacao}.</p>}
        </TabsContent>
  
        <TabsContent value="history" className="space-y-4 pt-4">
          <p className="text-gray-600">O histórico de alterações do lead aparecerá aqui.</p>
        </TabsContent>
      </Tabs>
    )
  }