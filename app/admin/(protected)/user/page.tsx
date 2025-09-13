// app/admin/(protected)/users/page.tsx
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
import ShaderBackground from "@/components/shader-background"
import Image from "next/image"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

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
    '/api/admin/users',
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
      
      // Verificar se é admin
      const userRole = user.user_metadata?.role
      if (userRole !== 'ADMIN') {
        toast({
          title: "Acesso Negado",
          description: "Apenas administradores podem gerenciar usuários.",
          variant: "destructive"
        })
        router.push("/admin/dashboard")
      }
    }
    checkAuth()
  }, [router, supabase.auth, toast])
  
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
    
    setIsLoading(true)
    
    try {
      const endpoint = editingUser 
        ? `/api/admin/users/${editingUser.id}`
        : '/api/admin/users'
      
      const method = editingUser ? 'PUT' : 'POST'
      
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao salvar usuário')
      }
      
      toast({
        title: "Sucesso!",
        description: editingUser 
          ? "Usuário atualizado com sucesso."
          : "Usuário criado com sucesso.",
      })
      
      mutateUsers()
      setIsModalOpen(false)
      
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar usuário.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/toggle-status`, {
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
      const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
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
      ADMIN: { className: "bg-red-500/20 text-red-300 border-red-500/30", icon: Shield },
      TRIAGEM: { className: "bg-blue-500/20 text-blue-300 border-blue-500/30", icon: UserCog },
      PROMOTOR: { className: "bg-green-500/20 text-green-300 border-green-500/30", icon: UserCheck },
      VISUALIZADOR: { className: "bg-gray-500/20 text-gray-300 border-gray-500/30", icon: Eye }
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
  
  if (!currentUser) {
    return (
      <ShaderBackground>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
        </div>
      </ShaderBackground>
    )
  }
  
  return (
    <ShaderBackground>
      <div className="min-h-screen">
        {/* Header */}
        <header className="bg-white/10 backdrop-blur-lg border-b border-white/20">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Image src="/logo2.png" alt="Segunda Pele" width={50} height={50} />
                <div>
                  <span className="text-xl font-bold text-white">Segunda Pele Lingerie</span>
                  <p className="text-sm text-violet-200">Gerenciamento de Usuários</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/admin/dashboard')}
                  className="bg-white/10 text-white hover:bg-white/20"
                >
                  ← Dashboard
                </Button>
              </div>
            </div>
          </div>
        </header>
        
        <div className="container mx-auto px-4 py-8">
          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-violet-200 text-xs">Total</p>
                    <p className="text-2xl font-bold text-white">{stats.total}</p>
                  </div>
                  <Users className="h-8 w-8 text-violet-300" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-violet-200 text-xs">Ativos</p>
                    <p className="text-2xl font-bold text-white">{stats.active}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-violet-200 text-xs">Admins</p>
                    <p className="text-2xl font-bold text-white">{stats.admins}</p>
                  </div>
                  <Shield className="h-8 w-8 text-red-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-violet-200 text-xs">Triagem</p>
                    <p className="text-2xl font-bold text-white">{stats.triagem}</p>
                  </div>
                  <UserCog className="h-8 w-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-violet-200 text-xs">Promotores</p>
                    <p className="text-2xl font-bold text-white">{stats.promotores}</p>
                  </div>
                  <UserCheck className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-violet-200 text-xs">Visualizadores</p>
                    <p className="text-2xl font-bold text-white">{stats.visualizadores}</p>
                  </div>
                  <Eye className="h-8 w-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Controles */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                <div className="flex flex-1 gap-4 w-full lg:w-auto">
                  <div className="relative flex-1 lg:max-w-sm">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-violet-300" />
                    <Input
                      placeholder="Buscar por nome ou email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder-violet-200"
                    />
                  </div>
                  
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-40 bg-white/10 border-white/20 text-white">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-violet-900/90 text-white border-violet-400/30">
                      <SelectItem value="all">Todos Cargos</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="TRIAGEM">Triagem</SelectItem>
                      <SelectItem value="PROMOTOR">Promotor</SelectItem>
                      <SelectItem value="VISUALIZADOR">Visualizador</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40 bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-violet-900/90 text-white border-violet-400/30">
                      <SelectItem value="all">Todos Status</SelectItem>
                      <SelectItem value="active">Ativos</SelectItem>
                      <SelectItem value="inactive">Inativos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button
                  onClick={() => handleOpenModal()}
                  className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Novo Usuário
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Tabela de Usuários */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-white/20">
                    <TableHead className="text-violet-200">Usuário</TableHead>
                    <TableHead className="text-violet-200">Email</TableHead>
                    <TableHead className="text-violet-200">Cargo</TableHead>
                    <TableHead className="text-violet-200">Status</TableHead>
                    <TableHead className="text-violet-200">Último Acesso</TableHead>
                    <TableHead className="text-violet-200">Criado em</TableHead>
                    <TableHead className="text-right text-violet-200">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user: SystemUser) => (
                    <TableRow key={user.id} className="border-b border-white/20 hover:bg-white/5">
                      <TableCell>
                        <div>
                          <div className="font-medium text-white">{user.nome}</div>
                          {user.telefone && (
                            <div className="text-xs text-violet-300 flex items-center mt-1">
                              <Phone className="w-3 h-3 mr-1" />
                              {user.telefone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-white">
                          <Mail className="w-3 h-3 mr-1 text-violet-300" />
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>
                        <Badge className={user.ativo 
                          ? "bg-green-500/20 text-green-300 border-green-500/30" 
                          : "bg-red-500/20 text-red-300 border-red-500/30"
                        }>
                          {user.ativo ? (
                            <><Unlock className="w-3 h-3 mr-1" /> Ativo</>
                          ) : (
                            <><Lock className="w-3 h-3 mr-1" /> Inativo</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-white text-sm">
                          {user.last_sign_in 
                            ? format(new Date(user.last_sign_in), "dd/MM/yyyy HH:mm", { locale: ptBR })
                            : "Nunca acessou"
                          }
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-white text-sm">
                          <Calendar className="w-3 h-3 mr-1 text-violet-300" />
                          {format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenModal(user)}
                            className="bg-white/10 text-white hover:bg-white/20"
                            disabled={user.id === currentUser.id}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(user.id, user.ativo)}
                            className="bg-white/10 text-white hover:bg-white/20"
                            disabled={user.id === currentUser.id}
                          >
                            {user.ativo ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResetPassword(user.id, user.email)}
                            className="bg-white/10 text-white hover:bg-white/20"
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
          <DialogContent className="bg-violet-900/95 text-white border-violet-400/30 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
              </DialogTitle>
              <DialogDescription className="text-violet-200">
                {editingUser 
                  ? 'Atualize as informações do usuário do sistema.'
                  : 'Cadastre um novo usuário para acessar o sistema administrativo.'
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome" className="text-violet-200">Nome Completo</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    required
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="João Silva"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email" className="text-violet-200">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                    disabled={!!editingUser}
                    className="bg-white/10 border-white/20 text-white disabled:opacity-50"
                    placeholder="joao@segundapele.com"
                  />
                </div>
                
                <div>
                  <Label htmlFor="telefone" className="text-violet-200">Telefone (opcional)</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="(67) 99999-9999"
                  />
                </div>
                
                <div>
                  <Label htmlFor="role" className="text-violet-200">Cargo</Label>
                  <Select value={formData.role} onValueChange={(v) => setFormData({...formData, role: v})}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-violet-900/90 text-white border-violet-400/30">
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
                      <Label htmlFor="password" className="text-violet-200">Senha</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) => setFormData({...formData, password: e.target.value})}
                          required
                          className="bg-white/10 border-white/20 text-white pr-10"
                          placeholder="Mínimo 8 caracteres"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 text-violet-300 hover:text-white"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="confirmPassword" className="text-violet-200">Confirmar Senha</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                        required
                        className="bg-white/10 border-white/20 text-white"
                        placeholder="Digite a senha novamente"
                      />
                    </div>
                  </>
                )}
              </div>
              
              {/* Informações sobre os cargos */}
              <div className="bg-white/5 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-white mb-2">Permissões por Cargo:</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-red-400 mt-0.5" />
                    <div>
                      <span className="text-white font-medium">Administrador:</span>
                      <span className="text-violet-200 ml-2">Acesso total ao sistema, gerenciamento de usuários</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <UserCog className="w-4 h-4 text-blue-400 mt-0.5" />
                    <div>
                      <span className="text-white font-medium">Triagem:</span>
                      <span className="text-violet-200 ml-2">Aprovar/reprovar cadastros, visualizar relatórios</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <UserCheck className="w-4 h-4 text-green-400 mt-0.5" />
                    <div>
                      <span className="text-white font-medium">Promotor:</span>
                      <span className="text-violet-200 ml-2">Gerenciar consultoras atribuídas, relatórios próprios</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Eye className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <span className="text-white font-medium">Visualizador:</span>
                      <span className="text-violet-200 ml-2">Apenas visualização de dados e relatórios</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-white/10 text-white hover:bg-white/20"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
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
    </ShaderBackground>
  )
}