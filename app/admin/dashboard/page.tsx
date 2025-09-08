"use client"

import { useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import {
  Users,
  UserCheck,
  Clock,
  MessageCircle,
  LogOut,
  BarChart3,
  FileText,
  TrendingUp,
  Calendar,
  Search,
  AlertCircle,
  Download,
  Eye,
  FileSpreadsheet,
  Send,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import ShaderBackground from "@/components/shader-background"
import { Playfair_Display, Poppins } from "next/font/google"
import Image from "next/image"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import * as XLSX from 'xlsx'

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

// Dados mockados para demonstração
const pendingRegistrations = [
  { id: 1, nome: "Maria Silva", email: "maria@email.com", telefone: "(11) 98765-4321", cidade: "São Paulo", dataEnvio: "2024-01-10", status: "pendente" },
  { id: 2, nome: "Ana Santos", email: "ana@email.com", telefone: "(21) 98765-4321", cidade: "Rio de Janeiro", dataEnvio: "2024-01-11", status: "pendente" },
  { id: 3, nome: "Carla Oliveira", email: "carla@email.com", telefone: "(31) 98765-4321", cidade: "Belo Horizonte", dataEnvio: "2024-01-11", status: "pendente" },
  { id: 4, nome: "Juliana Costa", email: "juliana@email.com", telefone: "(41) 98765-4321", cidade: "Curitiba", dataEnvio: "2024-01-12", status: "pendente" },
  { id: 5, nome: "Patricia Lima", email: "patricia@email.com", telefone: "(51) 98765-4321", cidade: "Porto Alegre", dataEnvio: "2024-01-12", status: "pendente" },
]

const registrationData = [
  { date: "01/12", cadastros: 12, aprovados: 8, reprovados: 2 },
  { date: "02/12", cadastros: 19, aprovados: 14, reprovados: 3 },
  { date: "03/12", cadastros: 15, aprovados: 11, reprovados: 2 },
  { date: "04/12", cadastros: 22, aprovados: 18, reprovados: 1 },
  { date: "05/12", cadastros: 28, aprovados: 20, reprovados: 4 },
  { date: "06/12", cadastros: 25, aprovados: 19, reprovados: 3 },
  { date: "07/12", cadastros: 31, aprovados: 24, reprovados: 2 },
]

const whatsappData = [
  { hora: "08:00", cliques: 5 },
  { hora: "10:00", cliques: 12 },
  { hora: "12:00", cliques: 18 },
  { hora: "14:00", cliques: 25 },
  { hora: "16:00", cliques: 22 },
  { hora: "18:00", cliques: 15 },
  { hora: "20:00", cliques: 8 },
]

const statusData = [
  { name: "Aprovados", value: 892, color: "#22c55e" },
  { name: "Em Análise", value: 45, color: "#f59e0b" },
  { name: "Reprovados", value: 297, color: "#ef4444" },
]

const cityData = [
  { cidade: "São Paulo", cadastros: 234 },
  { cidade: "Rio de Janeiro", cadastros: 156 },
  { cidade: "Belo Horizonte", cadastros: 98 },
  { cidade: "Brasília", cadastros: 87 },
  { cidade: "Salvador", cadastros: 76 },
]

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const [selectedPeriod, setSelectedPeriod] = useState("30d")
  const [searchTerm, setSearchTerm] = useState("")
  
  // Estados para os modais
  const [showPendingModal, setShowPendingModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [isExporting, setIsExporting] = useState(false)
  const [whatsappNumber, setWhatsappNumber] = useState("")

  // Função para calcular relatório de 30 dias
  const calculate30DaysReport = () => {
    const today = new Date()
    const thirtyDaysAgo = new Date(today.setDate(today.getDate() - 30))
    
    // Dados mockados para demonstração
    return {
      periodo: `${format(thirtyDaysAgo, "dd/MM/yyyy", { locale: ptBR })} - ${format(new Date(), "dd/MM/yyyy", { locale: ptBR })}`,
      totalCadastros: 457,
      aprovados: 312,
      reprovados: 87,
      pendentesAnalise: 45,
      passadosPromotores: 13,
      taxaAprovacao: "68.3%",
      tempoMedioAnalise: "2.5 dias",
    }
  }

  // Função para exportar dados para Excel
  const exportToExcel = async () => {
    setIsExporting(true)
    
    // Simular busca de dados
    setTimeout(() => {
      // Dados mockados para exportação
      const data = [
        { Nome: "Maria Silva", Email: "maria@email.com", Telefone: "(11) 98765-4321", Cidade: "São Paulo", Data: "10/01/2024", Status: "Aprovado" },
        { Nome: "Ana Santos", Email: "ana@email.com", Telefone: "(21) 98765-4321", Cidade: "Rio de Janeiro", Data: "11/01/2024", Status: "Pendente" },
        { Nome: "Carla Oliveira", Email: "carla@email.com", Telefone: "(31) 98765-4321", Cidade: "Belo Horizonte", Data: "11/01/2024", Status: "Aprovado" },
        { Nome: "Juliana Costa", Email: "juliana@email.com", Telefone: "(41) 98765-4321", Cidade: "Curitiba", Data: "12/01/2024", Status: "Reprovado" },
      ]

      // Criar workbook e worksheet
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Cadastros")

      // Gerar arquivo Excel
      XLSX.writeFile(wb, `cadastros_${dateFrom}_${dateTo}.xlsx`)

      // Enviar via WhatsApp (simulado)
      if (whatsappNumber) {
        const message = `Arquivo de cadastros do período ${dateFrom} a ${dateTo} está pronto!`
        window.open(`https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank')
      }

      setIsExporting(false)
      setShowExportModal(false)
      
      // Reset form
      setDateFrom("")
      setDateTo("")
      setWhatsappNumber("")
    }, 2000)
  }

  const reportData = calculate30DaysReport()

  if (status === "loading") {
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

  if (!session) {
    window.location.href = "/admin/login"
    return null
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
                  <span className="text-xl font-bold text-white" style={{ fontFamily: "var(--font-playfair)" }}>
                    Segunda Pele Lingerie
                  </span>
                  <p className="text-sm text-violet-200" style={{ fontFamily: "var(--font-poppins)" }}>
                    Painel Administrativo
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-white" style={{ fontFamily: "var(--font-poppins)" }}>
                    {session.user?.email}
                  </p>
                  <p className="text-xs text-violet-200" style={{ fontFamily: "var(--font-poppins)" }}>
                    Cargo: {session.user?.role}
                  </p>
                </div>
                <Button
                  onClick={() => signOut({ callbackUrl: "/admin/login" })}
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
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
            <div>
              <h1
                className="text-4xl font-bold text-white mb-2 drop-shadow-lg"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                Dashboard Analytics
              </h1>
              <p className="text-violet-200 text-lg" style={{ fontFamily: "var(--font-poppins)" }}>
                Métricas detalhadas e análises em tempo real
              </p>
            </div>

            <div className="flex items-center gap-4">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-40 bg-white/10 backdrop-blur-sm border-white/20 text-white">
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-violet-900/90 backdrop-blur-lg border-violet-400/30">
                  <SelectItem value="7d" className="text-white hover:bg-violet-500/20">
                    Últimos 7 dias
                  </SelectItem>
                  <SelectItem value="30d" className="text-white hover:bg-violet-500/20">
                    Últimos 30 dias
                  </SelectItem>
                  <SelectItem value="90d" className="text-white hover:bg-violet-500/20">
                    Últimos 90 dias
                  </SelectItem>
                  <SelectItem value="1y" className="text-white hover:bg-violet-500/20">
                    Último ano
                  </SelectItem>
                </SelectContent>
              </Select>

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
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white" style={{ fontFamily: "var(--font-poppins)" }}>
                  Total de Cadastros
                </CardTitle>
                <Users className="h-4 w-4 text-violet-300" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-playfair)" }}>
                  1,234
                </div>
                <div className="flex items-center text-xs text-green-400">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +12% vs mês anterior
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white" style={{ fontFamily: "var(--font-poppins)" }}>
                  Taxa de Aprovação
                </CardTitle>
                <UserCheck className="h-4 w-4 text-violet-300" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-playfair)" }}>
                  72.3%
                </div>
                <div className="flex items-center text-xs text-green-400">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +2.1% vs mês anterior
                </div>
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
                  45
                </div>
                <div className="flex items-center text-xs text-orange-400">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Requer atenção
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white" style={{ fontFamily: "var(--font-poppins)" }}>
                  Engajamento WhatsApp
                </CardTitle>
                <MessageCircle className="h-4 w-4 text-violet-300" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-playfair)" }}>
                  156
                </div>
                <div className="flex items-center text-xs text-green-400">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +8% esta semana
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-white/10 backdrop-blur-lg border-white/20">
              <TabsTrigger
                value="overview"
                className="text-white data-[state=active]:bg-violet-500/50 data-[state=active]:text-white"
                style={{ fontFamily: "var(--font-poppins)" }}
              >
                Visão Geral
              </TabsTrigger>
              <TabsTrigger
                value="registrations"
                className="text-white data-[state=active]:bg-violet-500/50 data-[state=active]:text-white"
                style={{ fontFamily: "var(--font-poppins)" }}
              >
                Cadastros
              </TabsTrigger>
              <TabsTrigger
                value="engagement"
                className="text-white data-[state=active]:bg-violet-500/50 data-[state=active]:text-white"
                style={{ fontFamily: "var(--font-poppins)" }}
              >
                Engajamento
              </TabsTrigger>
              <TabsTrigger
                value="geography"
                className="text-white data-[state=active]:bg-violet-500/50 data-[state=active]:text-white"
                style={{ fontFamily: "var(--font-poppins)" }}
              >
                Geografia
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Conteúdo da aba Overview mantido igual */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center" style={{ fontFamily: "var(--font-playfair)" }}>
                      <BarChart3 className="w-5 h-5 mr-2" />
                      Navegação Rápida
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Link href="/admin/consultants">
                      <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10">
                        <Users className="w-4 h-4 mr-2" />
                        Gerenciar Consultoras
                      </Button>
                    </Link>
                    <Link href="/admin/reports">
                      <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10">
                        <FileText className="w-4 h-4 mr-2" />
                        Relatórios Detalhados
                      </Button>
                    </Link>
                    <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Configurar WhatsApp
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-white" style={{ fontFamily: "var(--font-playfair)" }}>
                      Atividade Recente
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm space-y-2">
                      <div className="flex items-center text-violet-200">
                        <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                        3 cadastros aprovados há 5min
                      </div>
                      <div className="flex items-center text-violet-200">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></div>
                        12 novos cadastros pendentes
                      </div>
                      <div className="flex items-center text-violet-200">
                        <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                        Relatório mensal gerado
                      </div>
                      <div className="flex items-center text-violet-200">
                        <div className="w-2 h-2 bg-purple-400 rounded-full mr-2"></div>
                        Nova campanha WhatsApp ativa
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-white" style={{ fontFamily: "var(--font-playfair)" }}>
                      Alertas do Sistema
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                      <div className="flex items-center text-red-300">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        <span className="text-sm font-medium">45 cadastros pendentes há mais de 24h</span>
                      </div>
                    </div>
                    <div className="p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                      <div className="flex items-center text-yellow-300">
                        <Clock className="w-4 h-4 mr-2" />
                        <span className="text-sm font-medium">Meta mensal: 82% atingida</span>
                      </div>
                    </div>
                    <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                      <div className="flex items-center text-green-300">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        <span className="text-sm font-medium">Conversão WhatsApp +15% esta semana</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-white" style={{ fontFamily: "var(--font-playfair)" }}>
                      Cadastros por Período
                    </CardTitle>
                    <CardDescription className="text-violet-200" style={{ fontFamily: "var(--font-poppins)" }}>
                      Evolução diária dos cadastros nos últimos 7 dias
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={registrationData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="date" stroke="#c4b5fd" />
                        <YAxis stroke="#c4b5fd" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(139, 92, 246, 0.9)",
                            border: "1px solid rgba(255,255,255,0.2)",
                            borderRadius: "8px",
                            color: "white",
                          }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="cadastros" stroke="#f59e0b" strokeWidth={3} />
                        <Line type="monotone" dataKey="aprovados" stroke="#22c55e" strokeWidth={3} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-white" style={{ fontFamily: "var(--font-playfair)" }}>
                      Status dos Cadastros
                    </CardTitle>
                    <CardDescription className="text-violet-200" style={{ fontFamily: "var(--font-poppins)" }}>
                      Distribuição atual por status
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(139, 92, 246, 0.9)",
                            border: "1px solid rgba(255,255,255,0.2)",
                            borderRadius: "8px",
                            color: "white",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="registrations" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-white" style={{ fontFamily: "var(--font-playfair)" }}>
                      Ações Rápidas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Modal Ver Cadastros Pendentes */}
                    <Dialog open={showPendingModal} onOpenChange={setShowPendingModal}>
                      <DialogTrigger asChild>
                        <Button className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700">
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Cadastros Pendentes ({pendingRegistrations.length})
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-violet-900/95 backdrop-blur-lg border-violet-400/30">
                        <DialogHeader>
                          <DialogTitle className="text-white text-xl">Cadastros Pendentes de Aprovação</DialogTitle>
                          <DialogDescription className="text-violet-200">
                            Lista de todos os cadastros aguardando análise
                          </DialogDescription>
                        </DialogHeader>
                        <div className="mt-4">
                          <Table>
                            <TableHeader>
                              <TableRow className="border-violet-400/30">
                                <TableHead className="text-violet-200">Nome</TableHead>
                                <TableHead className="text-violet-200">Email</TableHead>
                                <TableHead className="text-violet-200">Telefone</TableHead>
                                <TableHead className="text-violet-200">Cidade</TableHead>
                                <TableHead className="text-violet-200">Data Envio</TableHead>
                                <TableHead className="text-violet-200">Ações</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {pendingRegistrations.map((registration) => (
                                <TableRow key={registration.id} className="border-violet-400/30">
                                  <TableCell className="text-white">{registration.nome}</TableCell>
                                  <TableCell className="text-white">{registration.email}</TableCell>
                                  <TableCell className="text-white">{registration.telefone}</TableCell>
                                  <TableCell className="text-white">{registration.cidade}</TableCell>
                                  <TableCell className="text-white">{registration.dataEnvio}</TableCell>
                                  <TableCell>
                                    <div className="flex gap-2">
                                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                        <CheckCircle className="w-4 h-4" />
                                      </Button>
                                      <Button size="sm" className="bg-red-600 hover:bg-red-700">
                                        <XCircle className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Modal Exportar Cadastros */}
                    <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
                      <DialogTrigger asChild>
                        <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
                          <FileSpreadsheet className="w-4 h-4 mr-2" />
                          Exportar Cadastros
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-violet-900/95 backdrop-blur-lg border-violet-400/30">
                        <DialogHeader>
                          <DialogTitle className="text-white text-xl">Exportar Cadastros</DialogTitle>
                          <DialogDescription className="text-violet-200">
                            Selecione o período e envie o relatório via WhatsApp
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="date-from" className="text-white">Data Inicial</Label>
                              <Input
                                id="date-from"
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="bg-white/10 border-white/20 text-white"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="date-to" className="text-white">Data Final</Label>
                              <Input
                                id="date-to"
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="bg-white/10 border-white/20 text-white"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="whatsapp" className="text-white">WhatsApp (com DDD)</Label>
                            <Input
                              id="whatsapp"
                              placeholder="Ex: 11987654321"
                              value={whatsappNumber}
                              onChange={(e) => setWhatsappNumber(e.target.value)}
                              className="bg-white/10 border-white/20 text-white placeholder-violet-200"
                            />
                          </div>
                          <Button
                            onClick={exportToExcel}
                            disabled={!dateFrom || !dateTo || !whatsappNumber || isExporting}
                            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                          >
                            {isExporting ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Gerando arquivo...
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4 mr-2" />
                                Gerar Excel e Enviar via WhatsApp
                              </>
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Modal Exportar Relatório */}
                    <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
                      <DialogTrigger asChild>
                        <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700">
                          <FileText className="w-4 h-4 mr-2" />
                          Exportar Relatório
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl bg-violet-900/95 backdrop-blur-lg border-violet-400/30">
                        <DialogHeader>
                          <DialogTitle className="text-white text-xl">Relatório dos Últimos 30 Dias</DialogTitle>
                          <DialogDescription className="text-violet-200">
                            Resumo completo do período {reportData.periodo}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="mt-4 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <Card className="bg-white/10 border-white/20">
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-violet-200">Total de Cadastros</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <p className="text-2xl font-bold text-white">{reportData.totalCadastros}</p>
                              </CardContent>
                            </Card>
                            <Card className="bg-white/10 border-white/20">
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-violet-200">Taxa de Aprovação</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <p className="text-2xl font-bold text-white">{reportData.taxaAprovacao}</p>
                              </CardContent>
                            </Card>
                          </div>

                          <div className="grid grid-cols-3 gap-4">
                            <Card className="bg-green-500/20 border-green-500/30">
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-green-300">Aprovados</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <p className="text-xl font-bold text-white">{reportData.aprovados}</p>
                              </CardContent>
                            </Card>
                            <Card className="bg-red-500/20 border-red-500/30">
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-red-300">Reprovados</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <p className="text-xl font-bold text-white">{reportData.reprovados}</p>
                              </CardContent>
                            </Card>
                            <Card className="bg-yellow-500/20 border-yellow-500/30">
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-yellow-300">Pendentes</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <p className="text-xl font-bold text-white">{reportData.pendentesAnalise}</p>
                              </CardContent>
                            </Card>
                          </div>

                          <Card className="bg-purple-500/20 border-purple-500/30">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm text-purple-300">Passados para Promotores</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-xl font-bold text-white">{reportData.passadosPromotores}</p>
                              <p className="text-xs text-violet-200 mt-1">Ainda não atendidos</p>
                            </CardContent>
                          </Card>

                          <div className="flex justify-between items-center pt-4 border-t border-violet-400/30">
                            <div className="text-sm text-violet-200">
                              Tempo médio de análise: <span className="font-bold text-white">{reportData.tempoMedioAnalise}</span>
                            </div>
                            <Button
                              onClick={() => {
                                // Implementar download do relatório
                                console.log("Baixando relatório...")
                                setShowReportModal(false)
                              }}
                              className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Baixar PDF
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-white" style={{ fontFamily: "var(--font-playfair)" }}>
                      Resumo Mensal
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-violet-200">Meta do mês:</span>
                      <span className="text-white font-bold">1,500</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-violet-200">Atual:</span>
                      <span className="text-white font-bold">1,234</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-violet-200">Restante:</span>
                      <span className="text-orange-400 font-bold">266</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-gradient-to-r from-violet-500 to-purple-600 h-2 rounded-full" style={{width: '82.3%'}}></div>
                    </div>
                    <p className="text-xs text-violet-200 text-center">82.3% da meta atingida</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-white" style={{ fontFamily: "var(--font-playfair)" }}>
                    Análise Detalhada de Cadastros
                  </CardTitle>
                  <CardDescription className="text-violet-200" style={{ fontFamily: "var(--font-poppins)" }}>
                    Cadastros, aprovações e reprovações por dia
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={registrationData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="date" stroke="#c4b5fd" />
                      <YAxis stroke="#c4b5fd" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(139, 92, 246, 0.9)",
                          border: "1px solid rgba(255,255,255,0.2)",
                          borderRadius: "8px",
                          color: "white",
                        }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="cadastros"
                        stackId="1"
                        stroke="#f59e0b"
                        fill="#f59e0b"
                        fillOpacity={0.6}
                      />
                      <Area
                        type="monotone"
                        dataKey="aprovados"
                        stackId="2"
                        stroke="#22c55e"
                        fill="#22c55e"
                        fillOpacity={0.6}
                      />
                      <Area
                        type="monotone"
                        dataKey="reprovados"
                        stackId="3"
                        stroke="#ef4444"
                        fill="#ef4444"
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Outras tabs mantidas iguais */}
            <TabsContent value="engagement" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-white" style={{ fontFamily: "var(--font-playfair)" }}>
                      Link WhatsApp
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white mb-2">156</div>
                      <p className="text-violet-200 text-sm">Cliques hoje</p>
                    </div>
                    <Button className="w-full bg-green-600 hover:bg-green-700">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Copiar Link WhatsApp
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-white" style={{ fontFamily: "var(--font-playfair)" }}>
                      Taxa de Conversão
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white mb-2">24.8%</div>
                      <p className="text-violet-200 text-sm">WhatsApp → Cadastro</p>
                    </div>
                    <div className="flex items-center justify-center text-green-400">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      +3.2% vs semana passada
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-white" style={{ fontFamily: "var(--font-playfair)" }}>
                      Tempo Médio
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white mb-2">2.4min</div>
                      <p className="text-violet-200 text-sm">No formulário</p>
                    </div>
                    <div className="flex items-center justify-center text-blue-400">
                      <Clock className="w-4 h-4 mr-1" />
                      Tempo ideal: 2-3min
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-white" style={{ fontFamily: "var(--font-playfair)" }}>
                    Horários de Pico - WhatsApp
                  </CardTitle>
                  <CardDescription className="text-violet-200" style={{ fontFamily: "var(--font-poppins)" }}>
                    Cliques no botão WhatsApp por horário
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={whatsappData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="hora" stroke="#c4b5fd" />
                      <YAxis stroke="#c4b5fd" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(139, 92, 246, 0.9)",
                          border: "1px solid rgba(255,255,255,0.2)",
                          borderRadius: "8px",
                          color: "white",
                        }}
                      />
                      <Bar dataKey="cliques" fill="#d946ef" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="geography" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-white" style={{ fontFamily: "var(--font-playfair)" }}>
                      Regiões por Desempenho
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-violet-200">Sudeste</span>
                        <Badge className="bg-green-600">Alta performance</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-violet-200">Sul</span>
                        <Badge className="bg-blue-600">Estável</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-violet-200">Nordeste</span>
                        <Badge className="bg-yellow-600">Crescendo</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-violet-200">Centro-Oeste</span>
                        <Badge className="bg-orange-600">Potencial</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-violet-200">Norte</span>
                        <Badge className="bg-purple-600">Emergente</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-white" style={{ fontFamily: "var(--font-playfair)" }}>
                      Oportunidades
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg border border-yellow-500/30">
                      <h4 className="font-semibold text-white mb-2">Região Norte</h4>
                      <p className="text-sm text-violet-200">Baixa penetração, alto potencial de crescimento (+150%)</p>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg border border-blue-500/30">
                      <h4 className="font-semibold text-white mb-2">Interior SP</h4>
                      <p className="text-sm text-violet-200">Cidades médias com boa conversão (+45%)</p>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg border border-purple-500/30">
                      <h4 className="font-semibold text-white mb-2">Capitais NE</h4>
                      <p className="text-sm text-violet-200">Mercado aquecido, expandir operação (+30%)</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-white" style={{ fontFamily: "var(--font-playfair)" }}>
                    Cadastros por Cidade
                  </CardTitle>
                  <CardDescription className="text-violet-200" style={{ fontFamily: "var(--font-poppins)" }}>
                    Top 5 cidades com mais cadastros
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={cityData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis type="number" stroke="#c4b5fd" />
                      <YAxis dataKey="cidade" type="category" width={100} stroke="#c4b5fd" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(139, 92, 246, 0.9)",
                          border: "1px solid rgba(255,255,255,0.2)",
                          borderRadius: "8px",
                          color: "white",
                        }}
                      />
                      <Bar dataKey="cadastros" fill="#f472b6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ShaderBackground>
  )
}