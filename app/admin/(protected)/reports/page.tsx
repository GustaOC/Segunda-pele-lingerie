"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import {
  Download,
  FileText,
  CalendarIcon,
  Users,
  UserCheck,
  Clock,
  MessageCircle,
  LogOut,
  BarChart3,
  FileSpreadsheet,
  Mail,
  RefreshCw,
  ChevronLeft,
  TrendingUp,
  Target,
  DollarSign,
  Activity,
  Filter,
  Search,
  MapPin,
} from "lucide-react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
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

// Mock data for reports
const promoterPerformance = [
  { promoter: "Carlos Mendes", consultoras: 45, ativas: 38, vendas: 125000, comissao: 50000, conversao: 84.4 },
  { promoter: "Juliana Santos", consultoras: 32, ativas: 28, vendas: 98000, comissao: 39200, conversao: 87.5 },
  { promoter: "Roberto Silva", consultoras: 28, ativas: 25, vendas: 87000, comissao: 34800, conversao: 89.3 },
  { promoter: "Patricia Lima", consultoras: 22, ativas: 19, vendas: 65000, comissao: 26000, conversao: 86.4 },
  { promoter: "Anderson Costa", consultoras: 18, ativas: 16, vendas: 52000, comissao: 20800, conversao: 88.9 },
]

const monthlyData = [
  { mes: "Jan", cadastros: 89, aprovados: 64, ativos: 58, vendas: 287000 },
  { mes: "Fev", cadastros: 95, aprovados: 71, ativos: 65, vendas: 312000 },
  { mes: "Mar", cadastros: 112, aprovados: 84, ativos: 78, vendas: 398000 },
  { mes: "Abr", cadastros: 98, aprovados: 73, ativos: 68, vendas: 356000 },
  { mes: "Mai", cadastros: 125, aprovados: 92, ativos: 85, vendas: 445000 },
  { mes: "Jun", cadastros: 134, aprovados: 98, ativos: 91, vendas: 478000 },
]

const regionData = [
  { regiao: "Sudeste", consultoras: 456, percentual: 45.6, vendas: 1200000 },
  { regiao: "Nordeste", consultoras: 234, percentual: 23.4, vendas: 680000 },
  { regiao: "Sul", consultoras: 178, percentual: 17.8, vendas: 520000 },
  { regiao: "Centro-Oeste", consultoras: 89, percentual: 8.9, vendas: 245000 },
  { regiao: "Norte", consultoras: 43, percentual: 4.3, vendas: 115000 },
]

const engagementData = [
  { periodo: "Hoje", whatsappClicks: 23, emailClicks: 12, cadastros: 8, conversao: 34.3 },
  { periodo: "Ontem", whatsappClicks: 31, emailClicks: 18, cadastros: 12, conversao: 38.8 },
  { periodo: "Esta semana", whatsappClicks: 156, emailClicks: 89, cadastros: 67, conversao: 36.5 },
  { periodo: "Semana passada", whatsappClicks: 143, emailClicks: 82, cadastros: 59, conversao: 35.1 },
  { periodo: "Este mês", whatsappClicks: 687, emailClicks: 398, cadastros: 298, conversao: 36.8 },
]

const cityData = [
  { cidade: "Campo Grande", consultoras: 487, percentual: 39.5, vendas: 1050000 },
  { cidade: "Dourados", consultoras: 156, percentual: 12.6, vendas: 378000 },
  { cidade: "Três Lagoas", consultoras: 134, percentual: 10.9, vendas: 324000 },
  { cidade: "Corumbá", consultoras: 98, percentual: 7.9, vendas: 245000 },
  { cidade: "Ponta Porã", consultoras: 87, percentual: 7.1, vendas: 198000 },
  { cidade: "Aquidauana", consultoras: 76, percentual: 6.2, vendas: 167000 },
  { cidade: "Naviraí", consultoras: 65, percentual: 5.3, vendas: 145000 },
  { cidade: "Nova Andradina", consultoras: 54, percentual: 4.4, vendas: 125000 },
  { cidade: "Sidrolândia", consultoras: 43, percentual: 3.5, vendas: 98000 },
  { cidade: "Maracaju", consultoras: 34, percentual: 2.8, vendas: 76000 },
]

// Consolidated consultant statistics
const consultantStats = {
  approved: 892,
  pending: 45,
  rejected: 297,
  total: 1234,
  approvalRate: 72.3,
}

export default function ReportsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState("overview")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [selectedPromoters, setSelectedPromoters] = useState<string[]>([])
  const [selectedCities, setSelectedCities] = useState<string[]>([])
  const [exportFormat, setExportFormat] = useState("excel")
  const [isGenerating, setIsGenerating] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

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

  const handleExport = async () => {
    setIsGenerating(true)

    // Simulate export generation
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const filename = `relatorio_${selectedReport}_${new Date().toISOString().split('T')[0]}.${exportFormat === "excel" ? "xlsx" : "csv"}`
    
    toast({
      title: "Relatório gerado",
      description: `Relatório "${filename}" foi gerado com sucesso!`,
    })

    setIsGenerating(false)
  }

  const handleScheduleReport = () => {
    toast({
      title: "Agendamento",
      description: "Funcionalidade de agendamento será implementeda em breve.",
    })
  }

  const handleBackToDashboard = () => {
    router.push("/admin/dashboard")
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/admin/login")
  }

  const filteredPromoters = promoterPerformance.filter(promoter =>
    promoter.promoter.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Verificando autenticação</h2>
          <p className="text-gray-600">Aguarde um momento...</p>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
          <p className="text-gray-600 mb-4">Redirecionando para login...</p>
        </div>
      </div>
    )
  }

  // Check if user has admin role
  const userRole = user.user_metadata?.role
  if (userRole !== "ADMIN") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
          <p className="text-red-600 mb-4">Acesso negado. Você não tem permissão para acessar esta página.</p>
          <Button onClick={() => router.push("/admin/login")} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
            Voltar ao Login
          </Button>
        </div>
      </div>
    )
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
                <span className="text-xl font-bold text-gray-900" style={{ fontFamily: "var(--font-playfair)" }}>
                  Segunda Pele Lingerie
                </span>
                <p className="text-sm text-gray-600" style={{ fontFamily: "var(--font-poppins)" }}>
                  Relatórios e Análises
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Button
                onClick={handleBackToDashboard}
                variant="outline"
                size="sm"
                className="border-purple-200 bg-white text-purple-700 hover:bg-purple-50 hover:text-purple-800 shadow-sm"
                style={{ fontFamily: "var(--font-poppins)" }}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium text-gray-900" style={{ fontFamily: "var(--font-poppins)" }}>
                  {user.email}
                </p>
                <p className="text-xs text-gray-600" style={{ fontFamily: "var(--font-poppins)" }}>
                  Cargo: {userRole}
                </p>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="border-purple-200 bg-white text-purple-700 hover:bg-purple-50 hover:text-purple-800 shadow-sm"
                style={{ fontFamily: "var(--font-poppins)" }}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Título */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-1" style={{ fontFamily: "var(--font-playfair)" }}>
            Relatórios Avançados
          </h1>
          <p className="text-gray-600" style={{ fontFamily: "var(--font-poppins)" }}>
            Análises detalhadas e exportação de dados
          </p>
        </div>

        <div className="flex flex-col xl:flex-row gap-6">
          {/* Sidebar de configurações */}
          <div className="xl:w-80">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900" style={{ fontFamily: "var(--font-playfair)" }}>
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  Gerar Relatório
                </CardTitle>
                <CardDescription className="text-gray-600" style={{ fontFamily: "var(--font-poppins)" }}>
                  Configure e exporte relatórios personalizados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-gray-700 font-medium">Tipo de Relatório</Label>
                  <Select value={selectedReport} onValueChange={setSelectedReport}>
                    <SelectTrigger className="border-gray-200 focus:border-purple-500 focus:ring-purple-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="overview">Visão Geral</SelectItem>
                      <SelectItem value="promoters">Performance por Promotor</SelectItem>
                      <SelectItem value="consultants">Cadastros de Consultoras</SelectItem>
                      <SelectItem value="regions">Análise Regional</SelectItem>
                      <SelectItem value="cities">Análise por Cidades</SelectItem>
                      <SelectItem value="engagement">Engajamento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-gray-700 font-medium">Período</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-gray-500">De:</Label>
                      <Input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Até:</Label>
                      <Input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-gray-700 font-medium">Promotores (opcional)</Label>
                  <div className="space-y-2 mt-2 max-h-32 overflow-y-auto">
                    {["Carlos Mendes", "Juliana Santos", "Roberto Silva", "Patricia Lima", "Anderson Costa"].map((promoter) => (
                      <div key={promoter} className="flex items-center space-x-2">
                        <Checkbox
                          id={promoter}
                          checked={selectedPromoters.includes(promoter)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedPromoters((prev) => [...prev, promoter])
                            } else {
                              setSelectedPromoters((prev) => prev.filter((p) => p !== promoter))
                            }
                          }}
                        />
                        <Label htmlFor={promoter} className="text-sm text-gray-700">
                          {promoter}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-gray-700 font-medium">Cidades (opcional)</Label>
                  <div className="space-y-2 mt-2 max-h-32 overflow-y-auto">
                    {["Campo Grande", "Dourados", "Três Lagoas", "Corumbá", "Ponta Porã", "Aquidauana"].map((city) => (
                      <div key={city} className="flex items-center space-x-2">
                        <Checkbox
                          id={city}
                          checked={selectedCities.includes(city)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedCities((prev) => [...prev, city])
                            } else {
                              setSelectedCities((prev) => prev.filter((c) => c !== city))
                            }
                          }}
                        />
                        <Label htmlFor={city} className="text-sm text-gray-700">
                          {city}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-gray-700 font-medium">Formato de Exportação</Label>
                  <Select value={exportFormat} onValueChange={setExportFormat}>
                    <SelectTrigger className="border-gray-200 focus:border-purple-500 focus:ring-purple-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excel">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="w-4 h-4" />
                          Excel (.xlsx)
                        </div>
                      </SelectItem>
                      <SelectItem value="csv">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          CSV (.csv)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Button 
                    onClick={handleExport} 
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700" 
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Exportar Relatório
                      </>
                    )}
                  </Button>

                  <Button 
                    onClick={handleScheduleReport} 
                    variant="outline" 
                    className="w-full border-gray-200 text-gray-700 hover:bg-gray-50"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Agendar Envio
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Conteúdo principal */}
          <div className="flex-1">
            <Tabs value={selectedReport} onValueChange={setSelectedReport} className="space-y-6">
              <TabsList className="grid w-full grid-cols-6 bg-gray-100 p-1 rounded-lg">
                <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-purple-700 rounded-md py-2">
                  Geral
                </TabsTrigger>
                <TabsTrigger value="promoters" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-purple-700 rounded-md py-2">
                  Promotores
                </TabsTrigger>
                <TabsTrigger value="consultants" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-purple-700 rounded-md py-2">
                  Consultoras
                </TabsTrigger>
                <TabsTrigger value="regions" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-purple-700 rounded-md py-2">
                  Regiões
                </TabsTrigger>
                <TabsTrigger value="cities" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-purple-700 rounded-md py-2">
                  Cidades
                </TabsTrigger>
                <TabsTrigger value="engagement" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-purple-700 rounded-md py-2">
                  Engajamento
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Cards de estatísticas */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-white to-purple-50">
                    <CardContent className="p-6 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Total Consultoras</p>
                        <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: "var(--font-playfair)" }}>
                          {consultantStats.total.toLocaleString()}
                        </p>
                        <p className="text-xs text-green-600">+12% este mês</p>
                      </div>
                      <Users className="w-8 h-8 text-purple-600" />
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-white to-green-50">
                    <CardContent className="p-6 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Taxa Aprovação</p>
                        <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: "var(--font-playfair)" }}>
                          {consultantStats.approvalRate}%
                        </p>
                        <p className="text-xs text-green-600">+3.2% este mês</p>
                      </div>
                      <UserCheck className="w-8 h-8 text-green-600" />
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-white to-blue-50">
                    <CardContent className="p-6 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Vendas Totais</p>
                        <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: "var(--font-playfair)" }}>R$ 2.8M</p>
                        <p className="text-xs text-green-600">+18% este mês</p>
                      </div>
                      <DollarSign className="w-8 h-8 text-blue-600" />
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-white to-orange-50">
                    <CardContent className="p-6 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Engajamento</p>
                        <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: "var(--font-playfair)" }}>1,567</p>
                        <p className="text-xs text-green-600">WhatsApp cliques</p>
                      </div>
                      <MessageCircle className="w-8 h-8 text-orange-600" />
                    </CardContent>
                  </Card>
                </div>

                {/* Gráfico de evolução mensal */}
                <Card className="border-0 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-gray-900" style={{ fontFamily: "var(--font-playfair)" }}>
                      Evolução Mensal
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Cadastros, aprovações e vendas ao longo do tempo
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="mes" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "white", 
                            border: "1px solid #e5e7eb", 
                            borderRadius: "8px",
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                          }} 
                        />
                        <Legend />
                        <Line type="monotone" dataKey="cadastros" stroke="#f59e0b" strokeWidth={3} name="Cadastros" />
                        <Line type="monotone" dataKey="aprovados" stroke="#22c55e" strokeWidth={3} name="Aprovados" />
                        <Line type="monotone" dataKey="ativos" stroke="#3b82f6" strokeWidth={3} name="Ativos" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="promoters" className="space-y-6">
                {/* Barra de pesquisa */}
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Buscar promotor..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <Card className="border-0 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-gray-900" style={{ fontFamily: "var(--font-playfair)" }}>
                      Performance por Promotor
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Análise detalhada do desempenho de cada promotor
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-gray-200">
                          <TableHead className="text-gray-600 font-medium">Promotor</TableHead>
                          <TableHead className="text-gray-600 font-medium">Consultoras</TableHead>
                          <TableHead className="text-gray-600 font-medium">Ativas</TableHead>
                          <TableHead className="text-gray-600 font-medium">Vendas (R$)</TableHead>
                          <TableHead className="text-gray-600 font-medium">Comissão (R$)</TableHead>
                          <TableHead className="text-gray-600 font-medium">Taxa Ativação</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPromoters.map((promoter) => (
                          <TableRow key={promoter.promoter} className="border-b border-gray-100 hover:bg-gray-50">
                            <TableCell className="font-medium text-gray-900">{promoter.promoter}</TableCell>
                            <TableCell className="text-gray-900">{promoter.consultoras}</TableCell>
                            <TableCell className="text-gray-900">{promoter.ativas}</TableCell>
                            <TableCell className="text-gray-900">R$ {promoter.vendas.toLocaleString("pt-BR")}</TableCell>
                            <TableCell className="text-gray-900">R$ {promoter.comissao.toLocaleString("pt-BR")}</TableCell>
                            <TableCell>
                              <Badge 
                                className={`${promoter.conversao >= 87 ? 'bg-green-100 text-green-800 border-green-200' : 
                                            promoter.conversao >= 85 ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                            'bg-red-100 text-red-800 border-red-200'}`}
                              >
                                {promoter.conversao.toFixed(1)}%
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-gray-900" style={{ fontFamily: "var(--font-playfair)" }}>
                      Ranking de Vendas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={promoterPerformance}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="promoter" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "white", 
                            border: "1px solid #e5e7eb", 
                            borderRadius: "8px",
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                          }} 
                        />
                        <Bar dataKey="vendas" fill="#8b5cf6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="consultants" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-white to-green-50">
                    <CardContent className="p-6 text-center">
                      <div className="text-3xl font-bold text-green-600 mb-2" style={{ fontFamily: "var(--font-playfair)" }}>
                        {consultantStats.approved.toLocaleString()}
                      </div>
                      <p className="text-sm text-gray-600">Consultoras Aprovadas</p>
                      <p className="text-xs text-green-600 mt-1">{consultantStats.approvalRate}% do total</p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-white to-amber-50">
                    <CardContent className="p-6 text-center">
                      <div className="text-3xl font-bold text-amber-600 mb-2" style={{ fontFamily: "var(--font-playfair)" }}>
                        {consultantStats.pending}
                      </div>
                      <p className="text-sm text-gray-600">Em Análise</p>
                      <p className="text-xs text-amber-600 mt-1">{((consultantStats.pending / consultantStats.total) * 100).toFixed(1)}% pendentes</p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-white to-red-50">
                    <CardContent className="p-6 text-center">
                      <div className="text-3xl font-bold text-red-600 mb-2" style={{ fontFamily: "var(--font-playfair)" }}>
                        {consultantStats.rejected}
                      </div>
                      <p className="text-sm text-gray-600">Reprovadas</p>
                      <p className="text-xs text-red-600 mt-1">Taxa: {((consultantStats.rejected / consultantStats.total) * 100).toFixed(1)}%</p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-0 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-gray-900" style={{ fontFamily: "var(--font-playfair)" }}>
                      Cadastros por Status
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Distribuição atual das {consultantStats.total.toLocaleString()} consultoras cadastradas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Pie
                          data={[
                            { name: "Aprovadas", value: consultantStats.approved, color: "#22c55e" },
                            { name: "Reprovadas", value: consultantStats.rejected, color: "#ef4444" },
                            { name: "Em Análise", value: consultantStats.pending, color: "#f59e0b" },
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {[
                            { name: "Aprovadas", value: consultantStats.approved, color: "#22c55e" },
                            { name: "Reprovadas", value: consultantStats.rejected, color: "#ef4444" },
                            { name: "Em Análise", value: consultantStats.pending, color: "#f59e0b" },
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "white", 
                            border: "1px solid #e5e7eb", 
                            borderRadius: "8px",
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                          }} 
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="regions" className="space-y-6">
                <Card className="border-0 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-gray-900" style={{ fontFamily: "var(--font-playfair)" }}>
                      Distribuição por Regiões
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Consultoras e vendas por região do Brasil
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {regionData.map((region) => (
                        <div
                          key={region.regiao}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100"
                        >
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-medium text-gray-900">{region.regiao}</p>
                              <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                                {region.percentual}%
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-gray-600">Consultoras</p>
                                <p className="text-gray-900 font-medium">{region.consultoras}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Vendas</p>
                                <p className="text-gray-900 font-medium">R$ {region.vendas.toLocaleString("pt-BR")}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-gray-900" style={{ fontFamily: "var(--font-playfair)" }}>
                      Vendas por Região
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Performance de vendas nas regiões brasileiras
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={regionData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="regiao" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "white", 
                            border: "1px solid #e5e7eb", 
                            borderRadius: "8px",
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                          }} 
                        />
                        <Bar dataKey="vendas" fill="#8b5cf6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="cities" className="space-y-6">
                <Card className="border-0 shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-900" style={{ fontFamily: "var(--font-playfair)" }}>
                      <MapPin className="w-5 h-5 text-purple-600" />
                      Distribuição por Cidades - MS
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Consultoras e vendas por cidade de Mato Grosso do Sul
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {cityData.map((city) => (
                        <div
                          key={city.cidade}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100"
                        >
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-medium text-gray-900">{city.cidade}</p>
                              <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                                {city.percentual}%
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-gray-600">Consultoras</p>
                                <p className="text-gray-900 font-medium">{city.consultoras}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Vendas</p>
                                <p className="text-gray-900 font-medium">R$ {city.vendas.toLocaleString("pt-BR")}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-gray-900" style={{ fontFamily: "var(--font-playfair)" }}>
                      Vendas por Cidade - MS
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Performance de vendas nas principais cidades do estado
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={cityData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                          dataKey="cidade" 
                          stroke="#6b7280" 
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis stroke="#6b7280" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "white", 
                            border: "1px solid #e5e7eb", 
                            borderRadius: "8px",
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                          }} 
                        />
                        <Bar dataKey="vendas" fill="#8b5cf6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-gray-900" style={{ fontFamily: "var(--font-playfair)" }}>
                      Distribuição de Consultoras por Cidade
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Concentração de consultoras nas cidades de MS
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Pie
                          data={cityData.slice(0, 6)} // Mostra apenas as 6 principais cidades
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ cidade, percentual }) => `${cidade} ${percentual}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="consultoras"
                        >
                          {cityData.slice(0, 6).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={`hsl(${250 + index * 30}, 70%, ${60 + index * 5}%)`} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "white", 
                            border: "1px solid #e5e7eb", 
                            borderRadius: "8px",
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                          }} 
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="engagement" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-white to-green-50">
                    <CardContent className="p-6 text-center">
                      <div className="text-2xl font-bold text-green-600 mb-2" style={{ fontFamily: "var(--font-playfair)" }}>
                        687
                      </div>
                      <p className="text-sm text-gray-600">Cliques WhatsApp</p>
                      <p className="text-xs text-green-600 mt-1">Este mês</p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-white to-blue-50">
                    <CardContent className="p-6 text-center">
                      <div className="text-2xl font-bold text-blue-600 mb-2" style={{ fontFamily: "var(--font-playfair)" }}>
                        398
                      </div>
                      <p className="text-sm text-gray-600">Cliques Email</p>
                      <p className="text-xs text-blue-600 mt-1">Este mês</p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-white to-purple-50">
                    <CardContent className="p-6 text-center">
                      <div className="text-2xl font-bold text-purple-600 mb-2" style={{ fontFamily: "var(--font-playfair)" }}>
                        36.8%
                      </div>
                      <p className="text-sm text-gray-600">Taxa Conversão</p>
                      <p className="text-xs text-green-600 mt-1">+2.1% vs mês anterior</p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-white to-orange-50">
                    <CardContent className="p-6 text-center">
                      <div className="text-2xl font-bold text-orange-600 mb-2" style={{ fontFamily: "var(--font-playfair)" }}>
                        298
                      </div>
                      <p className="text-sm text-gray-600">Novos Cadastros</p>
                      <p className="text-xs text-orange-600 mt-1">Via links</p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-0 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-gray-900" style={{ fontFamily: "var(--font-playfair)" }}>
                      Métricas de Engajamento Detalhadas
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Análise de interações e conversões por período
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-gray-200">
                          <TableHead className="text-gray-600 font-medium">Período</TableHead>
                          <TableHead className="text-gray-600 font-medium">WhatsApp</TableHead>
                          <TableHead className="text-gray-600 font-medium">Email</TableHead>
                          <TableHead className="text-gray-600 font-medium">Cadastros</TableHead>
                          <TableHead className="text-gray-600 font-medium">Conversão</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {engagementData.map((item) => (
                          <TableRow key={item.periodo} className="border-b border-gray-100 hover:bg-gray-50">
                            <TableCell className="font-medium text-gray-900">{item.periodo}</TableCell>
                            <TableCell className="text-gray-900">{item.whatsappClicks}</TableCell>
                            <TableCell className="text-gray-900">{item.emailClicks}</TableCell>
                            <TableCell className="text-gray-900">{item.cadastros}</TableCell>
                            <TableCell>
                              <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                                {item.conversao}%
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}