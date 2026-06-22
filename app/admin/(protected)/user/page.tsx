// app/admin/(protected)/user/page.tsx
"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import useSWR, { mutate } from 'swr'

// Componentes UI
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { Separator } from "@/components/ui/separator"
import {
  Users, UserPlus, Shield, Edit, Trash2, Search, Filter,
  Mail, Phone, MapPin, Calendar, Clock, CheckCircle,
  XCircle, AlertCircle, Loader2, RefreshCw, UserCog,
  Key, Eye, EyeOff, Lock, Unlock, UserCheck, UserX
} from "lucide-react"
import { Playfair_Display, Inter } from "next/font/google"
import Image from "next/image"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-playfair" });
const inter = Inter({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], variable: "--font-inter" });

const fetcher = (url: string) => fetch(url).then((res) => res.json())

// Tipos
interface SystemUser {
  id: string
  email: string
  nome: string
  role: 'ADMIN' | 'TRIAGEM' | 'PROMOTOR' | 'VISUALIZADOR'
  telefone?: string
  ativo: boolean
  created_at: string
  updated_at: string
  last_sign_in?: string
}

interface UserFormData {
  nome: string
  email: string
  password: string
  confirmPassword: string
  role: string
  telefone: string
}

// Componente principal
export default function UserManagementPage() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  
  // Estados
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState<UserFormData>({
    nome: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "TRIAGEM",
    telefone: ""
  })
  
  // Buscar usuários
  const { data: usersResponse, error: usersError, mutate: mutateUsers } = useSWR(
    '/api/admin/user',
    fetcher,
    { refreshInterval: 10000 }
  )
  
  const users = useMemo(() => usersResponse?.data || [], [usersResponse])
  
  // Verificar usuário atual
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/admin/login")
        return
      }
      setCurrentUser(user)
    }
    checkAuth()
  }, [router, supabase.auth])
  
  // Filtrar usuários
  const filteredUsers = useMemo(() => {
    return users.filter((user: SystemUser) => {
      const matchesSearch = 
        user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesRole = roleFilter === "all" || user.role === roleFilter
      const matchesStatus = 
        statusFilter === "all" || 
        (statusFilter === "active" && user.ativo) ||
        (statusFilter === "inactive" && !user.ativo)
      
      return matchesSearch && matchesRole && matchesStatus
    })
  }, [users, searchTerm, roleFilter, statusFilter])
  
  // Estatísticas
  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter((u: SystemUser) => u.ativo).length,
      admins: users.filter((u: SystemUser) => u.role === 'ADMIN').length,
      triagem: users.filter((u: SystemUser) => u.role === 'TRIAGEM').length,
      promotores: users.filter((u: SystemUser) => u.role === 'PROMOTOR').length,
      visualizadores: users.filter((u: SystemUser) => u.role === 'VISUALIZADOR').length
    }
  }, [users])
  
  // Funções
  const handleOpenModal = (user?: SystemUser) => {
    if (user) {
      setEditingUser(user)
      setFormData({
        nome: user.nome,
        email: user.email,
        password: "",
        confirmPassword: "",
        role: user.role,
        telefone: user.telefone || ""
      })
    } else {
      setEditingUser(null)
      setFormData({
        nome: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "TRIAGEM",
        telefone: ""
      })
    }
    setIsModalOpen(true)
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validações
    if (!editingUser && formData.password !== formData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive"
      })
      return
    }
    
    if (!editingUser && formData.password.length < 8) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 8 caracteres.",
        variant: "destructive"
      })
      return
    }
    
    // Validação de campos obrigatórios
    if (!formData.nome || !formData.email || (!editingUser && !formData.password)) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      })
      return
    }
    
    setIsLoading(true)
    
    try {
      const endpoint = editingUser 
        ? `/api/admin/user/${editingUser.id}`
        : '/api/admin/user'
      
      const method = editingUser ? 'PUT' : 'POST'
      
      // Preparar dados para envio
      const dataToSend = editingUser 
        ? {
            nome: formData.nome,
            role: formData.role,
            telefone: formData.telefone
          }
        : formData;
      
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || data.details || 'Erro ao salvar usuário')
      }
      
      toast({
        title: "Sucesso!",
        description: editingUser 
          ? "Usuário atualizado com sucesso."
          : "Usuário criado com sucesso.",
      })
      
      mutateUsers()
      setIsModalOpen(false)
      
      // Limpar formulário se for criação
      if (!editingUser) {
        setFormData({
          nome: "",
          email: "",
          password: "",
          confirmPassword: "",
          role: "TRIAGEM",
          telefone: ""
        })
      }
      
    } catch (error: any) {
      // Mensagem de erro mais específica
      let errorMessage = "Erro ao salvar usuário.";
      
      if (error.message?.includes('already registered') || 
          error.message?.includes('duplicate') ||
          error.message?.includes('já está cadastrado')) {
        errorMessage = "Este email já está cadastrado no sistema.";
      } else if (error.message?.includes('connection') || 
                 error.message?.includes('network')) {
        errorMessage = "Erro de conexão. Verifique sua internet.";
      } else if (error.message?.includes('permission') || 
                 error.message?.includes('unauthorized')) {
        errorMessage = "Você não tem permissão para esta ação.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/user/${userId}/toggle-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !currentStatus })
      })
      
      if (!response.ok) {
        throw new Error('Erro ao alterar status')
      }
      
      toast({
        title: "Status Alterado",
        description: `Usuário ${!currentStatus ? 'ativado' : 'desativado'} com sucesso.`,
      })
      
      mutateUsers()
      
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status.",
        variant: "destructive"
      })
    }
  }
  
  const handleResetPassword = async (userId: string, email: string) => {
    if (!confirm(`Deseja realmente resetar a senha de ${email}?`)) return
    
    try {
      const response = await fetch(`/api/admin/user/${userId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (!response.ok) {
        throw new Error('Erro ao resetar senha')
      }
      
      toast({
        title: "Senha Resetada",
        description: "Um email com instruções foi enviado ao usuário.",
      })
      
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível resetar a senha.",
        variant: "destructive"
      })
    }
  }
  
  const getRoleBadge = (role: string) => {
    const variants: Record<string, any> = {
      ADMIN: { className: "bg-red-100 text-red-800 border-red-200", icon: Shield },
      TRIAGEM: { className: "bg-blue-100 text-blue-800 border-blue-200", icon: UserCog },
      PROMOTOR: { className: "bg-green-100 text-green-800 border-green-200", icon: UserCheck },
      VISUALIZADOR: { className: "bg-gray-100 text-gray-800 border-gray-200", icon: Eye }
    }
    
    const variant = variants[role] || variants.VISUALIZADOR
    const Icon = variant.icon
    
    return (
      <Badge className={`${variant.className} rounded-lg`}>
        <Icon className="w-3 h-3 mr-1" />
        {role}
      </Badge>
    )
  }

  const refreshData = () => {
    mutateUsers();
    toast({
      title: "Dados atualizados!",
      description: "A lista de usuários foi recarregada.",
      duration: 2000
    });
  };
  
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-indigo-50/20 relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        </div>
        <div className="text-center p-8 bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 max-w-md z-10">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: "#5D3A5B" }}></div>
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2" style={{ fontFamily: "var(--font-playfair)" }}>Carregando</h2>
          <p className="text-slate-600" style={{ fontFamily: "var(--font-inter)" }}>Aguarde um momento...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-indigo-50/20 relative overflow-hidden ${inter.variable} ${playfair.variable} font-sans`}>
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
                <Image src="/logo2.png" alt="Segunda Pele" width={40} height={40} className="filter brightness-0 invert" />
              </div>
              <div>
                <span className="text-xl font-bold text-slate-800" style={{ fontFamily: "var(--font-playfair)" }}>Segunda Pele Lingerie</span>
                <p className="text-sm text-slate-600" style={{ fontFamily: "var(--font-inter)" }}>Gerenciamento de Usuários</p>
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/admin/dashboard')}
                className="border-white/50 bg-white/50 text-slate-700 hover:bg-white hover:text-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl"
              >
                ← Dashboard
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 relative z-10">
        {/* Título */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800 mb-1" style={{ fontFamily: "var(--font-playfair)" }}>
            Gerenciar Usuários
          </h1>
          <p className="text-slate-600" style={{ fontFamily: "var(--font-inter)" }}>Administre os usuários do sistema administrativo</p>
        </div>
        
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          <Card className="border border-white/50 bg-white/70 backdrop-blur-lg shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-xs" style={{ fontFamily: "var(--font-inter)" }}>Total</p>
                <p className="text-2xl font-bold text-slate-800" style={{ fontFamily: "var(--font-playfair)" }}>{stats.total}</p>
              </div>
              <Users className="h-8 w-8" style={{ color: "#5D3A5B" }} />
            </CardContent>
          </Card>
          
          <Card className="border border-white/50 bg-green-50/70 backdrop-blur-lg shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-xs" style={{ fontFamily: "var(--font-inter)" }}>Ativos</p>
                <p className="text-2xl font-bold text-slate-800" style={{ fontFamily: "var(--font-playfair)" }}>{stats.active}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </CardContent>
          </Card>
          
          <Card className="border border-white/50 bg-red-50/70 backdrop-blur-lg shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-xs" style={{ fontFamily: "var(--font-inter)" }}>Admins</p>
                <p className="text-2xl font-bold text-slate-800" style={{ fontFamily: "var(--font-playfair)" }}>{stats.admins}</p>
              </div>
              <Shield className="h-8 w-8 text-red-600" />
            </CardContent>
          </Card>
          
          <Card className="border border-white/50 bg-blue-50/70 backdrop-blur-lg shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-xs" style={{ fontFamily: "var(--font-inter)" }}>Triagem</p>
                <p className="text-2xl font-bold text-slate-800" style={{ fontFamily: "var(--font-playfair)" }}>{stats.triagem}</p>
              </div>
              <UserCog className="h-8 w-8 text-blue-600" />
            </CardContent>
          </Card>
          
          <Card className="border border-white/50 bg-green-50/70 backdrop-blur-lg shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-xs" style={{ fontFamily: "var(--font-inter)" }}>Promotores</p>
                <p className="text-2xl font-bold text-slate-800" style={{ fontFamily: "var(--font-playfair)" }}>{stats.promotores}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </CardContent>
          </Card>
          
          <Card className="border border-white/50 bg-gray-50/70 backdrop-blur-lg shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-xs" style={{ fontFamily: "var(--font-inter)" }}>Visualizadores</p>
                <p className="text-2xl font-bold text-slate-800" style={{ fontFamily: "var(--font-playfair)" }}>{stats.visualizadores}</p>
              </div>
              <Eye className="h-8 w-8 text-gray-600" />
            </CardContent>
          </Card>
        </div>
        
        {/* Controles */}
        <Card className="border border-white/50 bg-white/70 backdrop-blur-lg shadow-xl rounded-2xl mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex flex-1 gap-4 w-full lg:w-auto">
                <div className="relative flex-1 lg:max-w-sm">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Buscar por nome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-white/50 bg-white/80 focus:border-purple-500 focus:ring-purple-500 rounded-2xl"
                  />
                </div>
                
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-40 border-white/50 bg-white/80 focus:border-purple-500 focus:ring-purple-500 rounded-2xl">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos Cargos</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="TRIAGEM">Triagem</SelectItem>
                    <SelectItem value="PROMOTOR">Promotor</SelectItem>
                    <SelectItem value="VISUALIZADOR">Visualizador</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40 border-white/50 bg-white/80 focus:border-purple-500 focus:ring-purple-500 rounded-2xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos Status</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="inactive">Inativos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                onClick={() => handleOpenModal()}
                className="text-white font-semibold py-3 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-purple-500/20"
                style={{
                  background: "linear-gradient(to right, #5D3A5B, #4A2E49, #3B2338)"
                }}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Novo Usuário
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Tabela de Usuários */}
        <Card className="border border-white/50 bg-white/70 backdrop-blur-lg shadow-xl rounded-2xl">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-white/20">
                  <TableHead className="text-slate-600 font-medium" style={{ fontFamily: "var(--font-inter)" }}>Usuário</TableHead>
                  <TableHead className="text-slate-600 font-medium" style={{ fontFamily: "var(--font-inter)" }}>Email</TableHead>
                  <TableHead className="text-slate-600 font-medium" style={{ fontFamily: "var(--font-inter)" }}>Cargo</TableHead>
                  <TableHead className="text-slate-600 font-medium" style={{ fontFamily: "var(--font-inter)" }}>Status</TableHead>
                  <TableHead className="text-slate-600 font-medium" style={{ fontFamily: "var(--font-inter)" }}>Último Acesso</TableHead>
                  <TableHead className="text-slate-600 font-medium" style={{ fontFamily: "var(--font-inter)" }}>Criado em</TableHead>
                  <TableHead className="text-right text-slate-600 font-medium" style={{ fontFamily: "var(--font-inter)" }}>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user: SystemUser) => (
                  <TableRow key={user.id} className="border-b border-white/10 hover:bg-white/50">
                    <TableCell>
                      <div>
                        <div className="font-medium text-slate-800" style={{ fontFamily: "var(--font-inter)" }}>{user.nome}</div>
                        {user.telefone && (
                          <div className="text-xs text-slate-500 flex items-center mt-1" style={{ fontFamily: "var(--font-inter)" }}>
                            <Phone className="w-3 h-3 mr-1" />
                            {user.telefone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-slate-800" style={{ fontFamily: "var(--font-inter)" }}>
                        <Mail className="w-3 h-3 mr-1 text-slate-400" />
                        {user.email}
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>
                      <Badge className={user.ativo 
                        ? "bg-green-100 text-green-800 border-green-200 rounded-lg" 
                        : "bg-red-100 text-red-800 border-red-200 rounded-lg"
                      }>
                        {user.ativo ? (
                          <><Unlock className="w-3 h-3 mr-1" /> Ativo</>
                        ) : (
                          <><Lock className="w-3 h-3 mr-1" /> Inativo</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-slate-800 text-sm" style={{ fontFamily: "var(--font-inter)" }}>
                        {user.last_sign_in 
                          ? format(new Date(user.last_sign_in), "dd/MM/yyyy HH:mm", { locale: ptBR })
                          : "Nunca acessou"
                        }
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-slate-800 text-sm" style={{ fontFamily: "var(--font-inter)" }}>
                        <Calendar className="w-3 h-3 mr-1 text-slate-400" />
                        {format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenModal(user)}
                          className="bg-white/80 border-purple-200/50 text-purple-700 hover:bg-purple-50 rounded-xl"
                          disabled={user.id === currentUser.id}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(user.id, user.ativo)}
                          className="bg-white/80 border-gray-200/50 text-gray-700 hover:bg-gray-50 rounded-xl"
                          disabled={user.id === currentUser.id}
                        >
                          {user.ativo ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResetPassword(user.id, user.email)}
                          className="bg-white/80 border-gray-200/50 text-gray-700 hover:bg-gray-50 rounded-xl"
                          disabled={user.id === currentUser.id}
                        >
                          <Key className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      
      {/* Modal de Cadastro/Edição */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-white/95 backdrop-blur-lg border-white/50 shadow-2xl rounded-3xl max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-slate-800" style={{ fontFamily: "var(--font-playfair)" }}>
              {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
            </DialogTitle>
            <DialogDescription className="text-slate-600" style={{ fontFamily: "var(--font-inter)" }}>
              {editingUser 
                ? 'Atualize as informações do usuário do sistema.'
                : 'Cadastre um novo usuário para acessar o sistema administrativo.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome" className="text-slate-700 font-medium" style={{ fontFamily: "var(--font-inter)" }}>Nome Completo *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  required
                  className="border-white/50 bg-white/80 focus:border-purple-500 focus:ring-purple-500 rounded-2xl"
                  placeholder="João Silva"
                />
              </div>
              
              <div>
                <Label htmlFor="email" className="text-slate-700 font-medium" style={{ fontFamily: "var(--font-inter)" }}>Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                  disabled={!!editingUser}
                  className="border-white/50 bg-white/80 focus:border-purple-500 focus:ring-purple-500 disabled:bg-gray-50 rounded-2xl"
                  placeholder="joao@segundapele.com"
                />
              </div>
              
              <div>
                <Label htmlFor="telefone" className="text-slate-700 font-medium" style={{ fontFamily: "var(--font-inter)" }}>Telefone (opcional)</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                  className="border-white/50 bg-white/80 focus:border-purple-500 focus:ring-purple-500 rounded-2xl"
                  placeholder="(67) 99999-9999"
                />
              </div>
              
              <div>
                <Label htmlFor="role" className="text-slate-700 font-medium" style={{ fontFamily: "var(--font-inter)" }}>Cargo *</Label>
                <Select value={formData.role} onValueChange={(v) => setFormData({...formData, role: v})}>
                  <SelectTrigger className="border-white/50 bg-white/80 focus:border-purple-500 focus:ring-purple-500 rounded-2xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Administrador</SelectItem>
                    <SelectItem value="TRIAGEM">Triagem</SelectItem>
                    <SelectItem value="PROMOTOR">Promotor</SelectItem>
                    <SelectItem value="VISUALIZADOR">Visualizador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {!editingUser && (
                <>
                  <div>
                    <Label htmlFor="password" className="text-slate-700 font-medium" style={{ fontFamily: "var(--font-inter)" }}>Senha *</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        required
                        className="border-white/50 bg-white/80 focus:border-purple-500 focus:ring-purple-500 pr-10 rounded-2xl"
                        placeholder="Mínimo 8 caracteres"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-slate-600"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="confirmPassword" className="text-slate-700 font-medium" style={{ fontFamily: "var(--font-inter)" }}>Confirmar Senha *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                      required
                      className="border-white/50 bg-white/80 focus:border-purple-500 focus:ring-purple-500 rounded-2xl"
                      placeholder="Digite a senha novamente"
                    />
                  </div>
                </>
              )}
            </div>
            
            {/* Informações sobre os cargos */}
            <div className="bg-slate-50/70 backdrop-blur-sm rounded-2xl p-4 space-y-2 border border-white/30">
              <h4 className="font-semibold text-slate-800 mb-2" style={{ fontFamily: "var(--font-playfair)" }}>Permissões por Cargo:</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-red-600 mt-0.5" />
                  <div>
                    <span className="text-slate-800 font-medium" style={{ fontFamily: "var(--font-inter)" }}>Administrador:</span>
                    <span className="text-slate-600 ml-2" style={{ fontFamily: "var(--font-inter)" }}>Acesso total ao sistema, gerenciamento de usuários</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <UserCog className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div>
                    <span className="text-slate-800 font-medium" style={{ fontFamily: "var(--font-inter)" }}>Triagem:</span>
                    <span className="text-slate-600 ml-2" style={{ fontFamily: "var(--font-inter)" }}>Aprovar/reprovar cadastros, visualizar relatórios</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <UserCheck className="w-4 h-4 text-green-600 mt-0.5" />
                  <div>
                    <span className="text-slate-800 font-medium" style={{ fontFamily: "var(--font-inter)" }}>Promotor:</span>
                    <span className="text-slate-600 ml-2" style={{ fontFamily: "var(--font-inter)" }}>Gerenciar consultoras atribuídas, relatórios próprios</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Eye className="w-4 h-4 text-gray-600 mt-0.5" />
                  <div>
                    <span className="text-slate-800 font-medium" style={{ fontFamily: "var(--font-inter)" }}>Visualizador:</span>
                    <span className="text-slate-600 ml-2" style={{ fontFamily: "var(--font-inter)" }}>Apenas visualização de dados e relatórios</span>
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="border-white/50 bg-white/50 text-slate-700 hover:bg-white hover:text-slate-800 rounded-2xl"
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                style={{
                  background: "linear-gradient(to right, #5D3A5B, #4A2E49, #3B2338)"
                }}
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...</>
                ) : (
                  <>{editingUser ? 'Atualizar' : 'Cadastrar'} Usuário</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}