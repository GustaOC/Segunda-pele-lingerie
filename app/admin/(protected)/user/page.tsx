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
import { Playfair_Display, Poppins } from "next/font/google"
import Image from "next/image"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-playfair" });
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-poppins" });

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
    
    console.log('🚀 Iniciando envio do formulário');
    console.log('📋 Dados do formulário:', {
      nome: formData.nome,
      email: formData.email,
      role: formData.role,
      telefone: formData.telefone,
      password: formData.password ? '[OCULTADO]' : 'vazio',
      confirmPassword: formData.confirmPassword ? '[OCULTADO]' : 'vazio',
      isEditing: !!editingUser
    });
    
    // Validações
    if (!editingUser && formData.password !== formData.confirmPassword) {
      console.error('❌ Senhas não coincidem');
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive"
      })
      return
    }
    
    if (!editingUser && formData.password.length < 8) {
      console.error('❌ Senha muito curta');
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 8 caracteres.",
        variant: "destructive"
      })
      return
    }
    
    // Validação de campos obrigatórios
    if (!formData.nome || !formData.email || (!editingUser && !formData.password)) {
      console.error('❌ Campos obrigatórios não preenchidos');
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      })
      return
    }
    
    setIsLoading(true)
    console.log('⏳ Loading iniciado...');
    
    try {
      const endpoint = editingUser 
        ? `/api/admin/user/${editingUser.id}`
        : '/api/admin/user'
      
      const method = editingUser ? 'PUT' : 'POST'
      
      console.log(`📤 Fazendo ${method} para ${endpoint}`);
      
      // Preparar dados para envio
      const dataToSend = editingUser 
        ? {
            nome: formData.nome,
            role: formData.role,
            telefone: formData.telefone
          }
        : formData;
      
      console.log('📤 Dados sendo enviados:', {
        ...dataToSend,
        password: dataToSend.password ? '[OCULTADO]' : undefined,
        confirmPassword: dataToSend.confirmPassword ? '[OCULTADO]' : undefined
      });
      
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      })
      
      console.log('📥 Resposta recebida:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: {
          'content-type': response.headers.get('content-type')
        }
      });
      
      const data = await response.json()
      
      console.log('📥 Dados da resposta:', data);
      
      if (!response.ok) {
        console.error('❌ Resposta não OK:', {
          status: response.status,
          error: data.error,
          details: data.details
        });
        throw new Error(data.error || data.details || 'Erro ao salvar usuário')
      }
      
      console.log('✅ Usuário salvo com sucesso!');
      
      toast({
        title: "Sucesso!",
        description: editingUser 
          ? "Usuário atualizado com sucesso."
          : "Usuário criado com sucesso.",
      })
      
      console.log('🔄 Recarregando lista de usuários...');
      mutateUsers()
      
      console.log('🔒 Fechando modal...');
      setIsModalOpen(false)
      
      // Limpar formulário se for criação
      if (!editingUser) {
        console.log('🧹 Limpando formulário...');
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
      console.error('❌ Erro completo:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        cause: error.cause
      });
      
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
      console.log('⏹️ Loading finalizado');
    }
  }
  
  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    console.log(`🔄 Alternando status do usuário ${userId} de ${currentStatus} para ${!currentStatus}`);
    
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
      console.error('❌ Erro ao alterar status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status.",
        variant: "destructive"
      })
    }
  }
  
  const handleResetPassword = async (userId: string, email: string) => {
    if (!confirm(`Deseja realmente resetar a senha de ${email}?`)) return
    
    console.log(`🔑 Resetando senha do usuário ${userId} (${email})`);
    
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
      console.error('❌ Erro ao resetar senha:', error);
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
      <Badge className={variant.className}>
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Carregando</h2>
          <p className="text-gray-600">Aguarde um momento...</p>
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
                <Image src="/logo2.png" alt="Segunda Pele" width={40} height={40} className="filter brightness-0 invert" />
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900" style={{ fontFamily: "var(--font-playfair)" }}>Segunda Pele Lingerie</span>
                <p className="text-sm text-gray-600" style={{ fontFamily: "var(--font-poppins)" }}>Gerenciamento de Usuários</p>
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/admin/dashboard')}
                className="border-purple-200 bg-white text-purple-700 hover:bg-purple-50 hover:text-purple-800 shadow-sm"
              >
                ← Dashboard
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Título */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-1" style={{ fontFamily: "var(--font-playfair)" }}>
            Gerenciar Usuários
          </h1>
          <p className="text-gray-600">Administre os usuários do sistema administrativo</p>
        </div>
        
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-white to-purple-50">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-white to-green-50">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs">Ativos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-white to-red-50">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs">Admins</p>
                <p className="text-2xl font-bold text-gray-900">{stats.admins}</p>
              </div>
              <Shield className="h-8 w-8 text-red-600" />
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-white to-blue-50">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs">Triagem</p>
                <p className="text-2xl font-bold text-gray-900">{stats.triagem}</p>
              </div>
              <UserCog className="h-8 w-8 text-blue-600" />
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-white to-green-50">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs">Promotores</p>
                <p className="text-2xl font-bold text-gray-900">{stats.promotores}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-white to-gray-50">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs">Visualizadores</p>
                <p className="text-2xl font-bold text-gray-900">{stats.visualizadores}</p>
              </div>
              <Eye className="h-8 w-8 text-gray-600" />
            </CardContent>
          </Card>
        </div>
        
        {/* Controles */}
        <Card className="border-0 shadow-md mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex flex-1 gap-4 w-full lg:w-auto">
                <div className="relative flex-1 lg:max-w-sm">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Buscar por nome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>
                
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-40 border-gray-200 focus:border-purple-500 focus:ring-purple-500">
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
                  <SelectTrigger className="w-40 border-gray-200 focus:border-purple-500 focus:ring-purple-500">
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
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Novo Usuário
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Tabela de Usuários */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-200">
                  <TableHead className="text-gray-600 font-medium">Usuário</TableHead>
                  <TableHead className="text-gray-600 font-medium">Email</TableHead>
                  <TableHead className="text-gray-600 font-medium">Cargo</TableHead>
                  <TableHead className="text-gray-600 font-medium">Status</TableHead>
                  <TableHead className="text-gray-600 font-medium">Último Acesso</TableHead>
                  <TableHead className="text-gray-600 font-medium">Criado em</TableHead>
                  <TableHead className="text-right text-gray-600 font-medium">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user: SystemUser) => (
                  <TableRow key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">{user.nome}</div>
                        {user.telefone && (
                          <div className="text-xs text-gray-500 flex items-center mt-1">
                            <Phone className="w-3 h-3 mr-1" />
                            {user.telefone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-gray-900">
                        <Mail className="w-3 h-3 mr-1 text-gray-400" />
                        {user.email}
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>
                      <Badge className={user.ativo 
                        ? "bg-green-100 text-green-800 border-green-200" 
                        : "bg-red-100 text-red-800 border-red-200"
                      }>
                        {user.ativo ? (
                          <><Unlock className="w-3 h-3 mr-1" /> Ativo</>
                        ) : (
                          <><Lock className="w-3 h-3 mr-1" /> Inativo</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-gray-900 text-sm">
                        {user.last_sign_in 
                          ? format(new Date(user.last_sign_in), "dd/MM/yyyy HH:mm", { locale: ptBR })
                          : "Nunca acessou"
                        }
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-gray-900 text-sm">
                        <Calendar className="w-3 h-3 mr-1 text-gray-400" />
                        {format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenModal(user)}
                          className="bg-white border-purple-200 text-purple-700 hover:bg-purple-50"
                          disabled={user.id === currentUser.id}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(user.id, user.ativo)}
                          className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                          disabled={user.id === currentUser.id}
                        >
                          {user.ativo ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResetPassword(user.id, user.email)}
                          className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
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
        <DialogContent className="bg-white border-gray-200 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-gray-900">
              {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {editingUser 
                ? 'Atualize as informações do usuário do sistema.'
                : 'Cadastre um novo usuário para acessar o sistema administrativo.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome" className="text-gray-700 font-medium">Nome Completo *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  required
                  className="border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                  placeholder="João Silva"
                />
              </div>
              
              <div>
                <Label htmlFor="email" className="text-gray-700 font-medium">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                  disabled={!!editingUser}
                  className="border-gray-200 focus:border-purple-500 focus:ring-purple-500 disabled:bg-gray-50"
                  placeholder="joao@segundapele.com"
                />
              </div>
              
              <div>
                <Label htmlFor="telefone" className="text-gray-700 font-medium">Telefone (opcional)</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                  className="border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                  placeholder="(67) 99999-9999"
                />
              </div>
              
              <div>
                <Label htmlFor="role" className="text-gray-700 font-medium">Cargo *</Label>
                <Select value={formData.role} onValueChange={(v) => setFormData({...formData, role: v})}>
                  <SelectTrigger className="border-gray-200 focus:border-purple-500 focus:ring-purple-500">
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
                    <Label htmlFor="password" className="text-gray-700 font-medium">Senha *</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        required
                        className="border-gray-200 focus:border-purple-500 focus:ring-purple-500 pr-10"
                        placeholder="Mínimo 8 caracteres"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-gray-600"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">Confirmar Senha *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                      required
                      className="border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                      placeholder="Digite a senha novamente"
                    />
                  </div>
                </>
              )}
            </div>
            
            {/* Informações sobre os cargos */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <h4 className="font-semibold text-gray-900 mb-2">Permissões por Cargo:</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-red-600 mt-0.5" />
                  <div>
                    <span className="text-gray-900 font-medium">Administrador:</span>
                    <span className="text-gray-600 ml-2">Acesso total ao sistema, gerenciamento de usuários</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <UserCog className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div>
                    <span className="text-gray-900 font-medium">Triagem:</span>
                    <span className="text-gray-600 ml-2">Aprovar/reprovar cadastros, visualizar relatórios</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <UserCheck className="w-4 h-4 text-green-600 mt-0.5" />
                  <div>
                    <span className="text-gray-900 font-medium">Promotor:</span>
                    <span className="text-gray-600 ml-2">Gerenciar consultoras atribuídas, relatórios próprios</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Eye className="w-4 h-4 text-gray-600 mt-0.5" />
                  <div>
                    <span className="text-gray-900 font-medium">Visualizador:</span>
                    <span className="text-gray-600 ml-2">Apenas visualização de dados e relatórios</span>
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="border-gray-200 text-gray-700 hover:bg-gray-50"
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
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