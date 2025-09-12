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
  Loader2
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import ShaderBackground from "@/components/shader-background"
import Image from "next/image"
import { format } from "date-fns"

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

  const handleStatusChange = async (leadId: string, newStatus: string, details: any) => {
    try {
        const endpoint = newStatus === 'APROVADO' ? `/api/leads/${leadId}/approve` : `/api/leads/${leadId}/reject`;
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
  
  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
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

  if (leadsLoading || promotersLoading) {
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
        <header className="bg-white/10 backdrop-blur-lg border-b border-white/20">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Image src="/logo2.png" alt="Segunda Pele Lingerie" width={50} height={50} className="drop-shadow-lg" />
                        <div>
                            <span className="text-xl font-bold text-white">Segunda Pele Lingerie</span>
                            <p className="text-sm text-violet-200">Gerenciamento de Consultoras</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                         <Button variant="outline" size="sm" onClick={() => router.push('/admin/promoters')} className="bg-white/10 text-white hover:bg-white/20">
                            Gerenciar Promotores
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => router.push('/admin/dashboard')} className="bg-white/10 text-white hover:bg-white/20">
                            ← Dashboard
                        </Button>
                    </div>
                </div>
            </div>
        </header>

        <div className="container mx-auto px-4 py-8 text-white">
            <div className="mb-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <div>
                <h1 className="text-3xl font-bold mb-2">Gerenciar Consultoras</h1>
                <p className="text-violet-200">{filteredConsultants.length} consultora(s) encontrada(s)</p>
                </div>

                <div className="flex flex-wrap gap-4">
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-violet-300" />
                    <Input
                    placeholder="Buscar por nome, CPF, telefone ou cidade..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-80 bg-white/10 border-white/20 text-white placeholder-violet-200"
                    />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40 bg-white/10 border-white/20 text-white">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-violet-900/90 text-white border-violet-400/30">
                    <SelectItem value="all">Todos Status</SelectItem>
                    <SelectItem value="EM_ANALISE">Em Análise</SelectItem>
                    <SelectItem value="APROVADO">Aprovados</SelectItem>
                    <SelectItem value="REPROVADO">Reprovados</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={cityFilter} onValueChange={setCityFilter}>
                    <SelectTrigger className="w-40 bg-white/10 border-white/20 text-white">
                    <MapPin className="w-4 h-4 mr-2" />
                    <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-violet-900/90 text-white border-violet-400/30">
                    <SelectItem value="all">Todas Cidades</SelectItem>
                    {[...new Set(consultants.map((c: any) => c.consultant?.address?.cidade).filter(Boolean))]
                      .map((city: any) => <SelectItem key={city} value={city}>{city}</SelectItem>)}
                    </SelectContent>
                </Select>
                </div>
            </div>
            </div>

            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="p-0">
                <Table>
                <TableHeader>
                    <TableRow className="border-b border-white/20">
                    <TableHead className="text-violet-200">Consultora</TableHead>
                    <TableHead className="text-violet-200">CPF</TableHead>
                    <TableHead className="text-violet-200">Contato</TableHead>
                    <TableHead className="text-violet-200">Localização</TableHead>
                    <TableHead className="text-violet-200">Status</TableHead>
                    <TableHead className="text-violet-200">Data Cadastro</TableHead>
                    <TableHead className="text-violet-200">Promotor</TableHead>
                    <TableHead className="text-right text-violet-200">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {paginatedConsultants.map((lead) => (
                    <TableRow key={lead.id} className="border-b border-white/20 hover:bg-white/5">
                        <TableCell>
                          <div className="font-medium text-white">{lead.consultant?.nome}</div>
                        </TableCell>
                        <TableCell>
                          <div 
                              className="text-sm text-violet-300 flex items-center gap-2 cursor-pointer"
                              onClick={() => copyToClipboard(lead.consultant?.cpf, 'CPF')}
                          >
                              {lead.consultant?.cpf} <Copy className="w-3 h-3"/>
                          </div>
                        </TableCell>
                        <TableCell>
                        <div>
                            <div className="flex items-center gap-1 text-sm text-white">
                            <Phone className="w-3 h-3" />
                            {lead.consultant?.telefone}
                            </div>
                            <div className="flex items-center gap-1 text-sm text-violet-300">
                            <Mail className="w-3 h-3" />
                            {lead.consultant?.email || 'N/A'}
                            </div>
                        </div>
                        </TableCell>
                        <TableCell>
                        <div className="flex items-center gap-1 text-white">
                            <MapPin className="w-3 h-3" />
                            {lead.consultant?.address?.cidade}, {lead.consultant?.address?.uf}
                        </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(lead.status)}</TableCell>
                        <TableCell>
                        <div className="flex items-center gap-1 text-sm text-white">
                            <Calendar className="w-3 h-3" />
                            {new Date(lead.createdAt).toLocaleDateString("pt-BR")}
                        </div>
                        </TableCell>
                        <TableCell>
                        {lead.promotorId ? (
                            <Badge variant="outline" className="text-white border-white/20">{lead.promotorId}</Badge>
                        ) : (
                            <span className="text-violet-300 text-sm">Não atribuído</span>
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
                            className="bg-white/10 text-white hover:bg-white/20"
                            >
                            <Eye className="w-4 h-4" />
                            </Button>

                            <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="bg-white/10 text-white hover:bg-white/20">
                                <MoreHorizontal className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-violet-900/90 text-white border-violet-400/30">
                                <DropdownMenuItem onClick={() => copyToClipboard(JSON.stringify(lead, null, 2), 'Dados Completos')} className="hover:bg-violet-500/20">
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

            <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-violet-200">
                Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredConsultants.length)} de{" "}
                {filteredConsultants.length} resultados
            </p>

            <div className="flex items-center gap-2">
                <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="bg-white/10 text-white hover:bg-white/20"
                >
                <ChevronLeft className="w-4 h-4" />
                </Button>

                <span className="text-sm text-white">
                Página {currentPage} de {totalPages}
                </span>

                <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                 className="bg-white/10 text-white hover:bg-white/20"
                >
                <ChevronRight className="w-4 h-4" />
                </Button>
            </div>
            </div>
        </div>

        <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-violet-900/95 text-white border-violet-400/30">
            <DialogHeader>
                <DialogTitle>Detalhes da Consultora</DialogTitle>
                <DialogDescription>Visualize e gerencie as informações da consultora</DialogDescription>
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
            <DialogContent className="bg-violet-900/95 text-white border-violet-400/30">
                <DialogHeader>
                    <DialogTitle>Enviar para o Promotor?</DialogTitle>
                    <DialogDescription>
                        Deseja enviar os dados desta consultora para o WhatsApp de {whatsappData?.promoter?.name}?
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsConfirmWhatsappOpen(false)}>Não</Button>
                    <Button onClick={handleSendToWhatsapp}>Sim, Enviar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </ShaderBackground>
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="info">Informações</TabsTrigger>
          <TabsTrigger value="actions">Ações</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>
  
        <TabsContent value="info" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Nome Completo</Label><Input value={consultant.nome} readOnly className="bg-white/10"/></div>
            <div><Label>CPF</Label><Input value={consultant.cpf} readOnly className="bg-white/10"/></div>
            <div><Label>Telefone</Label><Input value={consultant.telefone} readOnly className="bg-white/10"/></div>
            <div><Label>Email</Label><Input value={consultant.email || 'N/A'} readOnly className="bg-white/10"/></div>
            <div className="md:col-span-2"><Label>Endereço</Label><Input value={`${address.rua}, ${address.numero}, ${address.bairro}`} readOnly className="bg-white/10"/></div>
            <div><Label>Cidade</Label><Input value={address.cidade} readOnly className="bg-white/10"/></div>
            <div><Label>CEP</Label><Input value={address.cep} readOnly className="bg-white/10"/></div>
          </div>
        </TabsContent>
  
        <TabsContent value="actions" className="space-y-4 pt-4">
            {lead.status === "EM_ANALISE" && (
                <>
                <div><Label htmlFor="promoter">Selecionar Promotor (para aprovação)</Label><Select value={selectedPromoter} onValueChange={setSelectedPromoter}><SelectTrigger className="bg-white/10"><SelectValue placeholder="Escolha um promotor" /></SelectTrigger><SelectContent className="bg-violet-800">{promoters.map((p) => (<SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>))}</SelectContent></Select></div>
                <div><Label htmlFor="rejectionReason">Motivo da Reprovação (se aplicável)</Label><Select value={rejectionReason} onValueChange={setRejectionReason}><SelectTrigger className="bg-white/10"><SelectValue placeholder="Selecione um motivo" /></SelectTrigger><SelectContent className="bg-violet-800">{rejectionReasons.map((r) => (<SelectItem key={r} value={r}>{r}</SelectItem>))}</SelectContent></Select></div>
                {rejectionReason === "Outros" && (<div><Label htmlFor="customReason">Motivo Personalizado</Label><Input id="customReason" value={customReason} onChange={(e) => setCustomReason(e.target.value)} placeholder="Digite o motivo da reprovação" className="bg-white/10" /></div>)}
                <div className="flex gap-4 pt-4"><Button onClick={handleApprove} className="flex-1"><Check className="w-4 h-4 mr-2" />Aprovar</Button><Button onClick={handleReject} variant="destructive" className="flex-1"><X className="w-4 h-4 mr-2" />Reprovar</Button></div>
                </>
            )}
             {lead.status === "APROVADO" && <p className="text-green-400 p-4 bg-green-500/10 rounded-md">Cadastro aprovado e encaminhado para o promotor: {lead.promotorId}.</p>}
             {lead.status === "REPROVADO" && <p className="text-red-400 p-4 bg-red-500/10 rounded-md">Cadastro reprovado. Motivo: {lead.motivoReprovacao}.</p>}
        </TabsContent>
  
        <TabsContent value="history" className="space-y-4 pt-4">
          <p>O histórico de alterações do lead aparecerá aqui.</p>
        </TabsContent>
      </Tabs>
    )
  }