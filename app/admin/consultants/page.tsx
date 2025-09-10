"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
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
  LogOut,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Users,
  UserCheck,
  Clock,
  AlertCircle,
  Send,
  Bell,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import ShaderBackground from "@/components/shader-background"
import { Playfair_Display, Poppins } from "next/font/google"
import Image from "next/image"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-playfair",
})

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
})

// Interface para alertas
interface Alert {
  id: string
  consultantId: number
  consultantName: string
  promoter: string
  sentDate: string
  dueDate: string
  method: 'whatsapp' | 'email'
  status: 'pending' | 'responded' | 'overdue'
  response?: {
    attended: boolean
    reason: string
    responseDate: string
  }
}

// Interface para consultora
interface Consultant {
  id: number
  name: string
  cpf: string
  phone: string
  email: string
  city: string
  state: string
  address: string
  cep: string
  status: 'pending' | 'approved' | 'rejected'
  registrationDate: string
  promoter: string | null
  notes: string
  rejectionReason: string
}

// Mock data atualizado - Todas de Mato Grosso do Sul
const mockConsultantsMS: Consultant[] = [
  {
    id: 1,
    name: "Maria Silva Santos",
    cpf: "123.456.789-00",
    phone: "(67) 99999-1234",
    email: "maria.silva@email.com",
    city: "Campo Grande",
    state: "MS",
    address: "Rua das Flores, 123 - Centro",
    cep: "79002-567",
    status: "pending",
    registrationDate: "2024-12-07T10:30:00",
    promoter: null,
    notes: "",
    rejectionReason: "",
  },
  // ... (seus dados mock permanecem os mesmos)
]

const promoters = ["Carlos Mendes", "Juliana Santos", "Roberto Silva", "Patricia Lima", "Anderson Costa"]

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
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [consultants, setConsultants] = useState<Consultant[]>(mockConsultantsMS)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [cityFilter, setCityFilter] = useState("all")
  const [selectedConsultant, setSelectedConsultant] = useState<Consultant | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Estados para o sistema de envio e alertas
  const [isSendModalOpen, setIsSendModalOpen] = useState(false)
  const [consultantToSend, setConsultantToSend] = useState<Consultant | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false)
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false)

  const supabase = createClientComponentClient()

  // Efeito para verificar autenticação
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error || !session) {
          router.push("/admin/login")
          return
        }
        
        setUser(session.user)
        setLoading(false)
      } catch (error) {
        console.error("Auth error:", error)
        router.push("/admin/login")
      }
    }

    checkAuth()
  }, [router, supabase.auth])

  // Efeito para verificar alertas vencidos
  useEffect(() => {
    const checkOverdueAlerts = () => {
      const now = new Date()
      setAlerts(prev => prev.map(alert => ({
        ...alert,
        status: alert.status === 'pending' && new Date(alert.dueDate) < now ? 'overdue' : alert.status
      })))
    }

    const interval = setInterval(checkOverdueAlerts, 60000) // Verifica a cada minuto
    return () => clearInterval(interval)
  }, [])

  // Loading state
  if (loading) {
    return (
      <ShaderBackground>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-400 mx-auto mb-4"></div>
            <p className="text-violet-200">Verificando autenticação...</p>
          </div>
        </div>
      </ShaderBackground>
    )
  }

  // Not authenticated
  if (!user) {
    return (
      <ShaderBackground>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-violet-200 mb-4">Redirecionando para login...</p>
          </div>
        </div>
      </ShaderBackground>
    )
  }

  // Check if user has admin role
  const userRole = user.user_metadata?.role
  if (userRole !== "ADMIN") {
    return (
      <ShaderBackground>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-400 mb-4">Acesso negado. Você não tem permissão para acessar esta página.</p>
            <Button onClick={() => router.push("/admin/login")} className="bg-violet-600 hover:bg-violet-700">
              Voltar ao Login
            </Button>
          </div>
        </div>
      </ShaderBackground>
    )
  }

  const filteredConsultants = consultants.filter((consultant) => {
    const matchesSearch =
      consultant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      consultant.cpf.includes(searchTerm) ||
      consultant.phone.includes(searchTerm) ||
      consultant.city.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || consultant.status === statusFilter
    const matchesCity = cityFilter === "all" || consultant.city === cityFilter

    return matchesSearch && matchesStatus && matchesCity
  })

  const totalPages = Math.ceil(filteredConsultants.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedConsultants = filteredConsultants.slice(startIndex, startIndex + itemsPerPage)

  // Estatísticas dos consultores
  const stats = {
    total: consultants.length,
    pending: consultants.filter(c => c.status === "pending").length,
    approved: consultants.filter(c => c.status === "approved").length,
    rejected: consultants.filter(c => c.status === "rejected").length,
  }

  // Estatísticas dos alertas
  const alertStats = {
    pending: alerts.filter(a => a.status === 'pending').length,
    overdue: alerts.filter(a => a.status === 'overdue').length,
    responded: alerts.filter(a => a.status === 'responded').length,
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
            Em Análise
          </Badge>
        )
      case "approved":
        return (
          <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
            Aprovado
          </Badge>
        )
      case "rejected":
        return (
          <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
            Reprovado
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleStatusChange = (
    consultantId: number,
    newStatus: string,
    notes?: string,
    promoter?: string,
    rejectionReason?: string,
  ) => {
    const consultant = consultants.find(c => c.id === consultantId)
    
    setConsultants((prev) =>
      prev.map((consultant) =>
        consultant.id === consultantId
          ? {
              ...consultant,
              status: newStatus as 'pending' | 'approved' | 'rejected',
              notes: notes || consultant.notes,
              promoter: promoter || consultant.promoter,
              rejectionReason: rejectionReason || consultant.rejectionReason,
            }
          : consultant,
      ),
    )

    // Se foi aprovado, criar alerta automático de acompanhamento
    if (newStatus === 'approved' && consultant && promoter) {
      const now = new Date()
      const dueDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 dias para primeiro contato

      const newAlert: Alert = {
        id: `alert-auto-${Date.now()}`,
        consultantId: consultant.id,
        consultantName: consultant.name,
        promoter: promoter,
        sentDate: now.toISOString(),
        dueDate: dueDate.toISOString(),
        method: 'whatsapp', // método padrão
        status: 'pending'
      }

      setAlerts(prev => [...prev, newAlert])
      
      toast({
        title: "Cadastro aprovado",
        description: `Consultora aprovada! Alerta de acompanhamento criado para ${promoter}.`,
      })
    } else {
      toast({
        title: "Status atualizado",
        description: `Consultora ${newStatus === 'approved' ? 'aprovada' : 'reprovada'} com sucesso.`,
      })
    }

    setIsDetailModalOpen(false)
  }

  const copyConsultantData = (consultant: Consultant) => {
    const data = `
Nome: ${consultant.name}
CPF: ${consultant.cpf}
Telefone: ${consultant.phone}
Email: ${consultant.email}
Endereço: ${consultant.address}
Cidade: ${consultant.city} - ${consultant.state}
CEP: ${consultant.cep}
Data de Cadastro: ${new Date(consultant.registrationDate).toLocaleString("pt-BR")}
    `.trim()

    navigator.clipboard.writeText(data)
    toast({
      title: "Dados copiados",
      description: "Informações da consultora copiadas para a área de transferência.",
    })
  }

  const sendToWhatsApp = (consultant: Consultant) => {
    const message = `🎀 NOVA CONSULTORA APROVADA - Segunda Pele Lingerie

👤 Nome: ${consultant.name}
📱 Telefone: ${consultant.phone}
📧 Email: ${consultant.email}
📍 Cidade: ${consultant.city} - ${consultant.state}
🏠 Endereço: ${consultant.address}
📅 Data de Cadastro: ${new Date(consultant.registrationDate).toLocaleString("pt-BR")}
👨‍💼 Promotor: ${consultant.promoter || 'Não atribuído'}

✨ Status: APROVADA ✅

Segunda Pele Lingerie - Transformando sonhos em realidade!`

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")
    
    toast({
      title: "WhatsApp aberto",
      description: "Mensagem preparada para envio via WhatsApp.",
    })
  }

  const sendToEmail = (consultant: Consultant) => {
    const subject = `Nova Consultora Aprovada - ${consultant.name}`
    const body = `Olá!

Temos uma nova consultora aprovada na Segunda Pele Lingerie:

DADOS DA CONSULTORA:
Nome: ${consultant.name}
CPF: ${consultant.cpf}
Telefone: ${consultant.phone}
Email: ${consultant.email}
Endereço: ${consultant.address}
Cidade: ${consultant.city} - ${consultant.state}
CEP: ${consultant.cep}
Data de Cadastro: ${new Date(consultant.registrationDate).toLocaleString("pt-BR")}
Promotor Responsável: ${consultant.promoter || 'Não atribuído'}

Status: APROVADA ✅

${consultant.notes ? `Observações: ${consultant.notes}` : ''}

Atenciosamente,
Equipe Segunda Pele Lingerie`

    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.open(mailtoUrl, "_blank")
    
    toast({
      title: "Email preparado",
      description: "Cliente de email aberto com os dados da consultora.",
    })
  }

  // Função para abrir modal de envio
  const handleSendToPromoter = (consultant: Consultant) => {
    if (!consultant.promoter) {
      toast({
        title: "Erro",
        description: "Esta consultora ainda não tem um promotor atribuído.",
        variant: "destructive",
      })
      return
    }
    setConsultantToSend(consultant)
    setIsSendModalOpen(true)
  }

  // Função para enviar cadastro ao promotor
  const handleSendConsultant = (method: 'whatsapp' | 'email') => {
    if (!consultantToSend) return

    const consultant = consultantToSend
    const now = new Date()
    const dueDate = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000) // 5 dias

    // Criar novo alerta
    const newAlert: Alert = {
      id: `alert-${Date.now()}`,
      consultantId: consultant.id,
      consultantName: consultant.name,
      promoter: consultant.promoter!,
      sentDate: now.toISOString(),
      dueDate: dueDate.toISOString(),
      method,
      status: 'pending'
    }

    setAlerts(prev => [...prev, newAlert])

    // Enviar via método selecionado
    if (method === 'whatsapp') {
      const message = `📋 NOVO CADASTRO PARA ATENDIMENTO

Consultora: ${consultant.name}
CPF: ${consultant.cpf}
Telefone: ${consultant.phone}
Email: ${consultant.email}
Cidade: ${consultant.city} - ${consultant.state}
Endereço: ${consultant.address}

⏰ PRAZO: Você tem 5 dias para retornar o status do atendimento.

Por favor, confirme se conseguiu atender esta consultora e informe o motivo caso não tenha sido possível.`

      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
      window.open(whatsappUrl, "_blank")
    } else {
      // Simular envio de email
      const subject = `Novo Cadastro - ${consultant.name}`
      const body = `Olá ${consultant.promoter},

Você recebeu um novo cadastro para atendimento:

Nome: ${consultant.name}
CPF: ${consultant.cpf}
Telefone: ${consultant.phone}
Email: ${consultant.email}
Cidade: ${consultant.city} - ${consultant.state}
Endereço: ${consultant.address}

PRAZO: Você tem 5 dias para retornar o status do atendimento.

Por favor, confirme se conseguiu atender esta consultora e informe o motivo caso não tenha sido possível.

Atenciosamente,
Equipe Segunda Pele Lingerie`

      const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      window.open(mailtoUrl, "_blank")
    }

    toast({
      title: "Cadastro enviado",
      description: `Cadastro enviado via ${method === 'whatsapp' ? 'WhatsApp' : 'Email'}! Alerta de 5 dias criado.`,
    })
    setIsSendModalOpen(false)
    setConsultantToSend(null)
  }

  // Função para responder alerta
  const handleAlertResponse = (alertId: string, attended: boolean, reason: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? {
            ...alert,
            status: 'responded' as const,
            response: {
              attended,
              reason,
              responseDate: new Date().toISOString()
            }
          }
        : alert
    ))

    // Atualizar observações da consultora
    if (attended) {
      setConsultants(prev => prev.map(consultant =>
        consultant.id === selectedAlert?.consultantId
          ? { ...consultant, notes: `${consultant.notes}\n\nCadastro atendido pelo promotor em ${new Date().toLocaleDateString('pt-BR')}. Motivo: ${reason}`.trim() }
          : consultant
      ))
    }

    toast({
      title: "Resposta registrada",
      description: "Resposta do promotor registrada com sucesso!",
    })
    setIsResponseModalOpen(false)
    setSelectedAlert(null)
  }

  const handleBackToDashboard = () => {
    router.push("/admin/dashboard")
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/admin/login")
  }

  return (
    <ShaderBackground>
      <div className={`min-h-screen ${poppins.variable} ${playfair.variable} font-sans`}>
        {/* Header */}
        <header className="bg-white/10 backdrop-blur-lg border-b border-white/20">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Image src="/logo2.png" alt="Segunda Pele Lingerie" width={50} height={50} className="drop-shadow-lg" />
                <div>
                  <span className="text-xl font-bold text-white" style={{ fontFamily: "var(--font-playfair)" }}>
                    Segunda Pele Lingerie
                  </span>
                  <p className="text-sm text-violet-200" style={{ fontFamily: "var(--font-poppins)" }}>
                    Gerenciamento de Consultoras
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {/* Botão de Alertas */}
                <Button
                  onClick={() => setIsAlertsModalOpen(true)}
                  variant="outline"
                  size="sm"
                  className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 hover:border-white/30 relative"
                  style={{ fontFamily: "var(--font-poppins)" }}
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Alertas
                  {(alertStats.pending + alertStats.overdue) > 0 && (
                    <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1 py-0 min-w-[20px] h-5">
                      {alertStats.pending + alertStats.overdue}
                    </Badge>
                  )}
                </Button>

                <Button
                  onClick={handleBackToDashboard}
                  variant="outline"
                  size="sm"
                  className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 hover:border-white/30"
                  style={{ fontFamily: "var(--font-poppins)" }}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
                <div className="text-right">
                  <p className="text-sm font-medium text-white" style={{ fontFamily: "var(--font-poppins)" }}>
                    {user.email}
                  </p>
                  <p className="text-xs text-violet-200" style={{ fontFamily: "var(--font-poppins)" }}>
                    Cargo: {userRole}
                  </p>
                </div>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 hover:border-white/30"
                  style={{ fontFamily: "var(--font-poppins)" }}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          {/* Title Section */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
            <div>
              <h1
                className="text-4xl font-bold text-white mb-2 drop-shadow-lg"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                Gerenciar Consultoras
              </h1>
              <p className="text-violet-200 text-lg" style={{ fontFamily: "var(--font-poppins)" }}>
                {filteredConsultants.length} consultora(s) encontrada(s)
              </p>
            </div>

            {/* Search and Filters */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-violet-300" />
                <Input
                  placeholder="Buscar consultoras..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64 bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder-violet-200"
                  style={{ fontFamily: "var(--font-poppins)" }}
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 bg-white/10 backdrop-blur-sm border-white/20 text-white">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-violet-900/90 backdrop-blur-lg border-violet-400/30">
                  <SelectItem value="all" className="text-white hover:bg-violet-500/20">Todos</SelectItem>
                  <SelectItem value="pending" className="text-white hover:bg-violet-500/20">Em Análise</SelectItem>
                  <SelectItem value="approved" className="text-white hover:bg-violet-500/20">Aprovados</SelectItem>
                  <SelectItem value="rejected" className="text-white hover:bg-violet-500/20">Reprovados</SelectItem>
                </SelectContent>
              </Select>

              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger className="w-40 bg-white/10 backdrop-blur-sm border-white/20 text-white">
                  <MapPin className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-violet-900/90 backdrop-blur-lg border-violet-400/30 max-h-60 overflow-y-auto">
                  <SelectItem value="all" className="text-white hover:bg-violet-500/20">Todas</SelectItem>
                  <SelectItem value="Campo Grande" className="text-white hover:bg-violet-500/20">Campo Grande</SelectItem>
                  <SelectItem value="Dourados" className="text-white hover:bg-violet-500/20">Dourados</SelectItem>
                  <SelectItem value="Três Lagoas" className="text-white hover:bg-violet-500/20">Três Lagoas</SelectItem>
                  <SelectItem value="Corumbá" className="text-white hover:bg-violet-500/20">Corumbá</SelectItem>
                  <SelectItem value="Ponta Porã" className="text-white hover:bg-violet-500/20">Ponta Porã</SelectItem>
                  <SelectItem value="Aquidauana" className="text-white hover:bg-violet-500/20">Aquidauana</SelectItem>
                  <SelectItem value="Naviraí" className="text-white hover:bg-violet-500/20">Naviraí</SelectItem>
                  <SelectItem value="Nova Andradina" className="text-white hover:bg-violet-500/20">Nova Andradina</SelectItem>
                  <SelectItem value="Sidrolândia" className="text-white hover:bg-violet-500/20">Sidrolândia</SelectItem>
                  <SelectItem value="Maracaju" className="text-white hover:bg-violet-500/20">Maracaju</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white" style={{ fontFamily: "var(--font-poppins)" }}>
                  Total de Consultoras
                </CardTitle>
                <Users className="h-4 w-4 text-violet-300" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-playfair)" }}>
                  {stats.total}
                </div>
                <p className="text-xs text-violet-200">Total no sistema</p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white" style={{ fontFamily: "var(--font-poppins)" }}>
                  Aprovadas
                </CardTitle>
                <UserCheck className="h-4 w-4 text-violet-300" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-playfair)" }}>
                  {stats.approved}
                </div>
                <p className="text-xs text-green-400">Ativas no sistema</p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white" style={{ fontFamily: "var(--font-poppins)" }}>
                  Pendentes
                </CardTitle>
                <Clock className="h-4 w-4 text-violet-300" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-playfair)" }}>
                  {stats.pending}
                </div>
                <div className="flex items-center text-xs text-orange-400">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Aguardando análise
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white" style={{ fontFamily: "var(--font-poppins)" }}>
                  Reprovadas
                </CardTitle>
                <X className="h-4 w-4 text-violet-300" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-playfair)" }}>
                  {stats.rejected}
                </div>
                <p className="text-xs text-red-400">Não aprovadas</p>
              </CardContent>
            </Card>
          </div>

          {/* Table Card */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="text-white" style={{ fontFamily: "var(--font-playfair)" }}>
                Lista de Consultoras
              </CardTitle>
              <CardDescription className="text-violet-200" style={{ fontFamily: "var(--font-poppins)" }}>
                Gerencie e analise os cadastros das consultoras
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/20 hover:bg-white/5">
                    <TableHead className="text-violet-200">Consultora</TableHead>
                    <TableHead className="text-violet-200">Contato</TableHead>
                    <TableHead className="text-violet-200">Localização</TableHead>
                    <TableHead className="text-violet-200">Status</TableHead>
                    <TableHead className="text-violet-200">Data Cadastro</TableHead>
                    <TableHead className="text-violet-200">Promotor</TableHead>
                    <TableHead className="text-right text-violet-200">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedConsultants.map((consultant) => (
                    <TableRow key={consultant.id} className="border-white/20 hover:bg-white/5">
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium text-white">{consultant.name}</div>
                          <div className="text-violet-300">{consultant.cpf}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          <div className="flex items-center gap-1.5 text-white">
                            <Phone className="h-3 w-3" />
                            {consultant.phone}
                          </div>
                          <div className="flex items-center gap-1.5 text-violet-300">
                            <Mail className="h-3 w-3" />
                            {consultant.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-white">
                          <MapPin className="h-3 w-3" />
                          {consultant.city}, {consultant.state}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(consultant.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-white">
                          <Calendar className="h-3 w-3" />
                          {new Date(consultant.registrationDate).toLocaleDateString("pt-BR")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-white">
                          {consultant.promoter || (
                            <span className="text-violet-400 italic">Não atribuído</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Botão Ver Detalhes - sempre visível */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedConsultant(consultant)
                              setIsDetailModalOpen(true)
                            }}
                            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                            title="Ver Detalhes"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          
                          {/* Botão de ação rápida apenas para enviar ao promotor */}
                          {consultant.status === "approved" && consultant.promoter && (
                            <Button
                              size="sm"
                              onClick={() => handleSendToPromoter(consultant)}
                              className="bg-violet-600 hover:bg-violet-700 text-white"
                              title="Enviar ao Promotor"
                            >
                              <Send className="h-3 w-3" />
                            </Button>
                          )}
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                className="h-8 w-8 p-0 text-violet-300 hover:text-white hover:bg-white/10"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent 
                              align="end" 
                              className="bg-violet-900/90 backdrop-blur-lg border-violet-400/30"
                            >
                              <DropdownMenuItem
                                onClick={() => copyConsultantData(consultant)}
                                className="text-white hover:bg-violet-500/20 cursor-pointer"
                              >
                                <Copy className="w-4 h-4 mr-2" />
                                Copiar Dados
                              </DropdownMenuItem>
                              {consultant.status === "approved" && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => sendToWhatsApp(consultant)}
                                    className="text-white hover:bg-violet-500/20 cursor-pointer"
                                  >
                                    <MessageCircle className="w-4 h-4 mr-2" />
                                    Enviar WhatsApp
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => sendToEmail(consultant)}
                                    className="text-white hover:bg-violet-500/20 cursor-pointer"
                                  >
                                    <Mail className="w-4 h-4 mr-2" />
                                    Enviar Email
                                  </DropdownMenuItem>
                                  {consultant.promoter && (
                                    <DropdownMenuItem
                                      onClick={() => handleSendToPromoter(consultant)}
                                      className="text-white hover:bg-violet-500/20 cursor-pointer"
                                    >
                                      <Send className="w-4 h-4 mr-2" />
                                      Enviar ao Promotor
                                    </DropdownMenuItem>
                                  )}
                                </>
                              )}
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

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-violet-200">
              Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredConsultants.length)} de{" "}
              {filteredConsultants.length} resultados
            </p>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center justify-center text-sm text-white px-3">
                Página {currentPage} de {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Modal de Detalhes da Consultora */}
        <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
          <DialogContent 
            className="max-w-4xl max-h-[90vh] overflow-y-auto bg-violet-900/95 backdrop-blur-lg border-violet-400/30"
          >
            <DialogHeader>
              <DialogTitle className="text-white" style={{ fontFamily: "var(--font-playfair)" }}>
                Detalhes da Consultora
              </DialogTitle>
              <DialogDescription className="text-violet-200" style={{ fontFamily: "var(--font-poppins)" }}>
                Visualize e gerencie as informações da consultora
              </DialogDescription>
            </DialogHeader>

            {selectedConsultant && (
              <ConsultantDetailForm
                consultant={selectedConsultant}
                onStatusChange={handleStatusChange}
                promoters={promoters}
                rejectionReasons={rejectionReasons}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de Envio ao Promotor */}
        <Dialog open={isSendModalOpen} onOpenChange={setIsSendModalOpen}>
          <DialogContent 
            className="max-w-md bg-violet-900/95 backdrop-blur-lg border-violet-400/30"
          >
            <DialogHeader>
              <DialogTitle className="text-white" style={{ fontFamily: "var(--font-playfair)" }}>
                Enviar Cadastro ao Promotor
              </DialogTitle>
              <DialogDescription className="text-violet-200" style={{ fontFamily: "var(--font-poppins)" }}>
                Escolha como enviar o cadastro de <strong>{consultantToSend?.name}</strong> para o promotor <strong>{consultantToSend?.promoter}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-300 mb-2">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium">Prazo de Resposta</span>
                </div>
                <p className="text-sm text-yellow-200">
                  Após o envio, será gerado um alerta de 5 dias para o promotor confirmar o atendimento.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <Button 
                  onClick={() => handleSendConsultant('whatsapp')}
                  className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white p-4 h-auto"
                >
                  <MessageCircle className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium">Enviar via WhatsApp</div>
                    <div className="text-sm opacity-80">Envio rápido e direto</div>
                  </div>
                </Button>

                <Button 
                  onClick={() => handleSendConsultant('email')}
                  className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white p-4 h-auto"
                >
                  <Mail className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium">Enviar via Email</div>
                    <div className="text-sm opacity-80">Registro formal por email</div>
                  </div>
                </Button>
              </div>

              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setIsSendModalOpen(false)}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Alertas */}
        <Dialog open={isAlertsModalOpen} onOpenChange={setIsAlertsModalOpen}>
          <DialogContent 
            className="max-w-6xl max-h-[90vh] overflow-y-auto bg-violet-900/95 backdrop-blur-lg border-violet-400/30"
          >
            <DialogHeader>
              <DialogTitle className="text-white" style={{ fontFamily: "var(--font-playfair)" }}>
                Gerenciar Alertas de Prazo
              </DialogTitle>
              <DialogDescription className="text-violet-200" style={{ fontFamily: "var(--font-poppins)" }}>
                Acompanhe os prazos de resposta dos promotores
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Estatísticas dos Alertas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-violet-200">Pendentes</p>
                        <p className="text-2xl font-bold text-yellow-300">{alertStats.pending}</p>
                      </div>
                      <Clock className="h-8 w-8 text-yellow-300" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-violet-200">Vencidos</p>
                        <p className="text-2xl font-bold text-red-300">{alertStats.overdue}</p>
                      </div>
                      <AlertCircle className="h-8 w-8 text-red-300" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-violet-200">Respondidos</p>
                        <p className="text-2xl font-bold text-green-300">{alertStats.responded}</p>
                      </div>
                      <Check className="h-8 w-8 text-green-300" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Lista de Alertas */}
              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Lista de Alertas</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {alerts.length === 0 ? (
                    <div className="p-8 text-center text-violet-300">
                      <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum alerta encontrado</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/20">
                          <TableHead className="text-violet-200">Consultora</TableHead>
                          <TableHead className="text-violet-200">Promotor</TableHead>
                          <TableHead className="text-violet-200">Método</TableHead>
                          <TableHead className="text-violet-200">Enviado</TableHead>
                          <TableHead className="text-violet-200">Prazo</TableHead>
                          <TableHead className="text-violet-200">Status</TableHead>
                          <TableHead className="text-violet-200">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {alerts.map((alert) => (
                          <TableRow key={alert.id} className="border-white/20 hover:bg-white/5">
                            <TableCell className="text-white">{alert.consultantName}</TableCell>
                            <TableCell className="text-violet-300">{alert.promoter}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {alert.method === 'whatsapp' ? 'WhatsApp' : 'Email'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-violet-300">
                              {new Date(alert.sentDate).toLocaleDateString('pt-BR')}
                            </TableCell>
                            <TableCell className="text-violet-300">
                              {new Date(alert.dueDate).toLocaleDateString('pt-BR')}
                            </TableCell>
                            <TableCell>
                              {alert.status === 'pending' && (
                                <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                                  Pendente
                                </Badge>
                              )}
                              {alert.status === 'overdue' && (
                                <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
                                  Vencido
                                </Badge>
                              )}
                              {alert.status === 'responded' && (
                                <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                                  Respondido
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {alert.status !== 'responded' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedAlert(alert)
                                    setIsResponseModalOpen(true)
                                  }}
                                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                                >
                                  Responder
                                </Button>
                              )}
                              {alert.status === 'responded' && alert.response && (
                                <div className="text-xs text-green-300">
                                  {alert.response.attended ? '✅ Atendido' : '❌ Não atendido'}
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Resposta do Promotor */}
        <Dialog open={isResponseModalOpen} onOpenChange={setIsResponseModalOpen}>
          <DialogContent 
            className="max-w-md bg-violet-900/95 backdrop-blur-lg border-violet-400/30"
          >
            <DialogHeader>
              <DialogTitle className="text-white">Resposta do Promotor</DialogTitle>
              <DialogDescription className="text-violet-200">
                Registre a resposta sobre o atendimento da consultora <strong>{selectedAlert?.consultantName}</strong>
              </DialogDescription>
            </DialogHeader>

            <PromoterResponseForm 
              alert={selectedAlert}
              onResponse={handleAlertResponse}
              onCancel={() => setIsResponseModalOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </ShaderBackground>
  )
}

// Componente para resposta do promotor
function PromoterResponseForm({
  alert,
  onResponse,
  onCancel
}: {
  alert: Alert | null
  onResponse: (alertId: string, attended: boolean, reason: string) => void
  onCancel: () => void
}) {
  const [attended, setAttended] = useState<boolean | null>(null)
  const [reason, setReason] = useState("")
  const { toast } = useToast()

  if (!alert) return null

  const handleSubmit = () => {
    if (attended === null) {
      toast({
        title: "Erro",
        description: "Por favor, selecione se o cadastro foi atendido ou não.",
        variant: "destructive",
      })
      return
    }
    if (!reason.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, informe o motivo/observação.",
        variant: "destructive",
      })
      return
    }
    onResponse(alert.id, attended, reason.trim())
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
        <p className="text-sm text-blue-200">
          <strong>Promotor:</strong> {alert.promoter}<br />
          <strong>Prazo:</strong> {new Date(alert.dueDate).toLocaleDateString('pt-BR')}<br />
          <strong>Status:</strong> {alert.status === 'overdue' ? 'Vencido' : 'No prazo'}
        </p>
      </div>

      <div>
        <Label className="text-violet-200">O cadastro foi atendido?</Label>
        <div className="grid grid-cols-2 gap-3 mt-2">
          <Button
            variant={attended === true ? "default" : "outline"}
            onClick={() => setAttended(true)}
            className={attended === true 
              ? "bg-green-600 hover:bg-green-700" 
              : "bg-white/10 border-white/20 text-white hover:bg-white/20"
            }
          >
            <Check className="w-4 h-4 mr-2" />
            Sim, Atendido
          </Button>
          <Button
            variant={attended === false ? "default" : "outline"}
            onClick={() => setAttended(false)}
            className={attended === false 
              ? "bg-red-600 hover:bg-red-700" 
              : "bg-white/10 border-white/20 text-white hover:bg-white/20"
            }
          >
            <X className="w-4 h-4 mr-2" />
            Não Atendido
          </Button>
        </div>
      </div>

      <div>
        <Label className="text-violet-200">
          {attended === true ? "Observações sobre o atendimento:" : "Motivo de não ter atendido:"}
        </Label>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={attended === true 
            ? "Ex: Cliente foi atendida com sucesso, realizou pedido inicial..." 
            : "Ex: Cliente não respondeu às tentativas de contato..."
          }
          className="bg-white/10 border-white/20 text-white placeholder-violet-300 mt-2"
          rows={3}
        />
      </div>

      <div className="flex gap-3">
        <Button
          onClick={handleSubmit}
          className="flex-1 bg-violet-600 hover:bg-violet-700"
        >
          Registrar Resposta
        </Button>
        <Button
          variant="outline"
          onClick={onCancel}
          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
        >
          Cancelar
        </Button>
      </div>
    </div>
  )
}

function ConsultantDetailForm({
  consultant,
  onStatusChange,
  promoters,
  rejectionReasons,
}: {
  consultant: Consultant
  onStatusChange: (id: number, status: string, notes?: string, promoter?: string, rejectionReason?: string) => void
  promoters: string[]
  rejectionReasons: string[]
}) {
  const [notes, setNotes] = useState(consultant.notes || "")
  const [selectedPromoter, setSelectedPromoter] = useState(consultant.promoter || "")
  const [rejectionReason, setRejectionReason] = useState(consultant.rejectionReason || "")
  const [customReason, setCustomReason] = useState("")
  const { toast } = useToast()

  const handleApprove = () => {
    if (!selectedPromoter) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um promotor antes de aprovar.",
        variant: "destructive",
      })
      return
    }
    onStatusChange(consultant.id, "approved", notes, selectedPromoter)
  }

  const handleReject = () => {
    const finalReason = rejectionReason === "Outros" ? customReason : rejectionReason
    if (!finalReason) {
      toast({
        title: "Erro",
        description: "Por favor, selecione ou digite um motivo para a reprovação.",
        variant: "destructive",
      })
      return
    }
    onStatusChange(consultant.id, "rejected", notes, "", finalReason)
  }

  return (
    <Tabs defaultValue="info" className="w-full">
      <TabsList className="grid w-full grid-cols-3 bg-white/10 backdrop-blur-lg border-white/20">
        <TabsTrigger
          value="info"
          className="text-white data-[state=active]:bg-violet-500/50 data-[state=active]:text-white"
        >
          Informações
        </TabsTrigger>
        <TabsTrigger
          value="actions"
          className="text-white data-[state=active]:bg-violet-500/50 data-[state=active]:text-white"
        >
          Ações
        </TabsTrigger>
        <TabsTrigger
          value="history"
          className="text-white data-[state=active]:bg-violet-500/50 data-[state=active]:text-white"
        >
          Histórico
        </TabsTrigger>
      </TabsList>

      <TabsContent value="info" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-violet-200">Nome Completo</Label>
            <Input 
              value={consultant.name} 
              readOnly 
              className="bg-white/10 border-white/20 text-white"
            />
          </div>
          <div>
            <Label className="text-violet-200">CPF</Label>
            <Input 
              value={consultant.cpf} 
              readOnly 
              className="bg-white/10 border-white/20 text-white"
            />
          </div>
          <div>
            <Label className="text-violet-200">Telefone</Label>
            <Input 
              value={consultant.phone} 
              readOnly 
              className="bg-white/10 border-white/20 text-white"
            />
          </div>
          <div>
            <Label className="text-violet-200">Email</Label>
            <Input 
              value={consultant.email} 
              readOnly 
              className="bg-white/10 border-white/20 text-white"
            />
          </div>
          <div className="md:col-span-2">
            <Label className="text-violet-200">Endereço Completo</Label>
            <Input 
              value={consultant.address} 
              readOnly 
              className="bg-white/10 border-white/20 text-white"
            />
          </div>
          <div>
            <Label className="text-violet-200">Cidade</Label>
            <Input 
              value={consultant.city} 
              readOnly 
              className="bg-white/10 border-white/20 text-white"
            />
          </div>
          <div>
            <Label className="text-violet-200">Estado</Label>
            <Input 
              value={consultant.state} 
              readOnly 
              className="bg-white/10 border-white/20 text-white"
            />
          </div>
          <div>
            <Label className="text-violet-200">CEP</Label>
            <Input 
              value={consultant.cep} 
              readOnly 
              className="bg-white/10 border-white/20 text-white"
            />
          </div>
          <div>
            <Label className="text-violet-200">Status Atual</Label>
            <div className="pt-2">
              {consultant.status === "pending" && (
                <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                  Em Análise
                </Badge>
              )}
              {consultant.status === "approved" && (
                <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                  Aprovado
                </Badge>
              )}
              {consultant.status === "rejected" && (
                <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
                  Reprovado
                </Badge>
              )}
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="actions" className="space-y-4">
        <div className="space-y-4">
          <div>
            <Label htmlFor="notes" className="text-violet-200">Observações</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Adicione observações sobre esta consultora..."
              rows={3}
              className="bg-white/10 border-white/20 text-white placeholder-violet-300"
            />
          </div>

          {consultant.status === "pending" && (
            <>
              <div>
                <Label htmlFor="promoter" className="text-violet-200">Selecionar Promotor (para aprovação)</Label>
                <Select value={selectedPromoter} onValueChange={setSelectedPromoter}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Escolha um promotor" />
                  </SelectTrigger>
                  <SelectContent className="bg-violet-900/90 backdrop-blur-lg border-violet-400/30">
                    {promoters.map((promoter) => (
                      <SelectItem 
                        key={promoter} 
                        value={promoter}
                        className="text-white hover:bg-violet-500/20"
                      >
                        {promoter}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="rejectionReason" className="text-violet-200">Motivo da Reprovação (se aplicável)</Label>
                <Select value={rejectionReason} onValueChange={setRejectionReason}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Selecione um motivo" />
                  </SelectTrigger>
                  <SelectContent className="bg-violet-900/90 backdrop-blur-lg border-violet-400/30">
                    {rejectionReasons.map((reason) => (
                      <SelectItem 
                        key={reason} 
                        value={reason}
                        className="text-white hover:bg-violet-500/20"
                      >
                        {reason}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {rejectionReason === "Outros" && (
                <div>
                  <Label htmlFor="customReason" className="text-violet-200">Motivo Personalizado</Label>
                  <Input
                    id="customReason"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Digite o motivo da reprovação"
                    className="bg-white/10 border-white/20 text-white placeholder-violet-300"
                  />
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <Button 
                  onClick={handleApprove} 
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Aprovar Cadastro
                </Button>
                <Button 
                  onClick={handleReject} 
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                >
                  <X className="w-4 h-4 mr-2" />
                  Reprovar Cadastro
                </Button>
              </div>
            </>
          )}

          {consultant.status === "approved" && (
            <>
              <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-green-300 mb-2">
                  <Check className="w-4 h-4" />
                  <span className="font-medium">Consultora Aprovada</span>
                </div>
                <p className="text-sm text-green-200">
                  Promotor responsável: <strong>{consultant.promoter}</strong>
                </p>
              </div>
              
              {/* Ações para consultora aprovada */}
              <div className="space-y-3">
                <Label className="text-violet-200">Ações Disponíveis</Label>
                
                <div className="grid grid-cols-1 gap-3">
                  <Button 
                    onClick={() => sendToWhatsApp(consultant)}
                    className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white p-4 h-auto"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-medium">Compartilhar via WhatsApp</div>
                      <div className="text-sm opacity-80">Enviar dados da consultora</div>
                    </div>
                  </Button>

                  <Button 
                    onClick={() => sendToEmail(consultant)}
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white p-4 h-auto"
                  >
                    <Mail className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-medium">Enviar por Email</div>
                      <div className="text-sm opacity-80">Enviar dados por email</div>
                    </div>
                  </Button>

                  {consultant.promoter && (
                    <Button 
                      onClick={() => handleSendToPromoter(consultant)}
                      className="flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white p-4 h-auto"
                    >
                      <Send className="w-5 h-5" />
                      <div className="text-left">
                        <div className="font-medium">Enviar ao Promotor</div>
                        <div className="text-sm opacity-80">Notificar {consultant.promoter}</div>
                      </div>
                    </Button>
                  )}

                  <Button 
                    onClick={() => copyConsultantData(consultant)}
                    variant="outline"
                    className="flex items-center justify-center gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20 p-4 h-auto"
                  >
                    <Copy className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-medium">Copiar Dados</div>
                      <div className="text-sm opacity-80">Copiar para área de transferência</div>
                    </div>
                  </Button>
                </div>
              </div>
            </>
          )}

          {consultant.status === "rejected" && (
            <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
              <div className="flex items-center gap-2 text-red-300 mb-2">
                <X className="w-4 h-4" />
                <span className="font-medium">Consultora Reprovada</span>
              </div>
              <p className="text-sm text-red-200">
                Motivo: <strong>{consultant.rejectionReason}</strong>
              </p>
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="history" className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
            <div className="w-2 h-2 bg-violet-400 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">Cadastro realizado</p>
              <p className="text-xs text-violet-300">
                {new Date(consultant.registrationDate).toLocaleString("pt-BR")}
              </p>
            </div>
          </div>

          {consultant.status !== "pending" && (
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
              <div
                className={`w-2 h-2 rounded-full ${
                  consultant.status === "approved" ? "bg-green-400" : "bg-red-400"
                }`}
              ></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">
                  Status alterado para {consultant.status === "approved" ? "Aprovado" : "Reprovado"}
                </p>
                <p className="text-xs text-violet-300">Hoje às 14:30</p>
              </div>
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  )
}