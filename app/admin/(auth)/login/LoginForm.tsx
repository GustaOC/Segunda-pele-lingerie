// app/admin/(auth)/login/LoginForm.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Shield, Loader2, AlertTriangle } from "lucide-react"
import Image from "next/image"
import { useAuth } from "@/hooks/useAuth"

interface LoginFormData {
  email: string
  password: string
  rememberMe: boolean
}

const INITIAL_FORM_DATA: LoginFormData = {
  email: "",
  password: "",
  rememberMe: false,
}

export default function LoginForm() {
  // State
  const [formData, setFormData] = useState<LoginFormData>(INITIAL_FORM_DATA)
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  
  // Hooks
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signIn, isAuthenticated, user, loading, error: authError, clearError } = useAuth()
  
  // Parâmetros da URL
  const callbackUrl = searchParams.get('callbackUrl') || '/admin/dashboard'
  const urlError = searchParams.get('error')

  // Redirecionamento se já autenticado
  useEffect(() => {
    if (isAuthenticated && user && !loading) {
      console.log(`✅ Usuário já autenticado (${user.email}), redirecionando para: ${callbackUrl}`)
      router.replace(callbackUrl)
    }
  }, [isAuthenticated, user, loading, callbackUrl, router])

  // Tratar erros da URL
  useEffect(() => {
    if (urlError) {
      switch (urlError) {
        case 'Unauthorized':
          setFormError('Acesso negado. Você não tem permissão para acessar esta área.')
          break
        case 'System error':
          setFormError('Erro do sistema. Tente novamente em alguns instantes.')
          break
        default:
          setFormError('Erro na autenticação. Tente fazer login novamente.')
      }
    }
  }, [urlError])

  // Limpar erros quando os dados do formulário mudam
  useEffect(() => {
    if (formError) {
      setFormError(null)
    }
    if (authError) {
      clearError()
    }
  }, [formData.email, formData.password]) // eslint-disable-line react-hooks/exhaustive-deps

  // Handlers
  const handleInputChange = useCallback((field: keyof LoginFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  const validateForm = useCallback((): string | null => {
    if (!formData.email.trim()) return "Email é obrigatório"
    if (!formData.password) return "Senha é obrigatória"
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) return "Formato de email inválido"
    if (formData.password.length < 6) return "Senha deve ter pelo menos 6 caracteres"
    return null
  }, [formData])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    const validationError = validateForm()
    if (validationError) {
      setFormError(validationError)
      return
    }

    setIsSubmitting(true)
    setFormError(null)

    try {
      console.log(`🔐 Iniciando login para: ${formData.email}`)
      const result = await signIn(formData.email, formData.password)
      if (result.success) {
        console.log(`✅ Login bem-sucedido, redirecionando para: ${callbackUrl}`)
        setTimeout(() => router.replace(callbackUrl), 100)
      } else {
        setFormError(result.error || 'Erro desconhecido no login')
      }
    } catch (error) {
      console.error('Erro inesperado no login:', error)
      setFormError('Erro inesperado. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, validateForm, signIn, callbackUrl, router])

  const handleForgotPassword = useCallback(async () => {
    if (!formData.email) {
      setFormError("Por favor, informe seu email para redefinir a senha")
      return
    }
    console.log('Reset de senha solicitado para:', formData.email)
    alert("Funcionalidade de reset de senha será implementada em breve.")
  }, [formData.email])

  // Renderização
  const currentError = formError || authError

  if (isAuthenticated && user) {
    return (
      <div className="w-full max-w-md text-center text-white">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
        <p>Redirecionando...</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex flex-col items-center space-y-4 mb-6">
          <Image 
            src="/logo2.png" 
            alt="Segunda Pele Lingerie" 
            width={120} 
            height={120} 
            className="drop-shadow-lg" 
            priority
          />
        </div>
        <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg font-playfair">
          Área Administrativa
        </h1>
        <p className="text-violet-200 text-lg font-poppins">
          Acesse o painel de controle
        </p>
      </div>

      {/* Login Card */}
      <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-violet-500/20 rounded-full border border-violet-400/30">
              <Shield className="w-8 h-8 text-violet-300" />
            </div>
          </div>
          <CardTitle className="text-white text-2xl font-playfair">
            Login Administrativo
          </CardTitle>
          <CardDescription className="text-violet-200 font-poppins">
            Entre com suas credenciais para acessar o sistema
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {currentError && (
              <Alert variant="destructive" className="bg-red-500/20 border-red-400/30 text-red-200">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{currentError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white font-medium font-poppins">Email</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={(e) => handleInputChange("email", e.target.value)} placeholder="admin@segundapele.com" disabled={isSubmitting} className="bg-violet-900/40 border-violet-400 text-white placeholder-violet-200 focus:ring-violet-300 font-poppins" autoComplete="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white font-medium font-poppins">Senha</Label>
              <div className="relative">
                <Input id="password" name="password" type={showPassword ? "text" : "password"} value={formData.password} onChange={(e) => handleInputChange("password", e.target.value)} placeholder="Digite sua senha" disabled={isSubmitting} className="bg-violet-900/40 border-violet-400 text-white placeholder-violet-200 focus:ring-violet-300 pr-10 font-poppins" autoComplete="current-password" required />
                <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-violet-500/20 text-violet-300" onClick={() => setShowPassword(!showPassword)} disabled={isSubmitting} tabIndex={-1}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox id="rememberMe" checked={formData.rememberMe} onCheckedChange={(checked) => handleInputChange("rememberMe", checked as boolean)} disabled={isSubmitting} className="border-violet-400 data-[state=checked]:bg-violet-500" />
                <Label htmlFor="rememberMe" className="text-sm text-white font-poppins">Lembrar-me</Label>
              </div>
              <Button type="button" variant="link" className="px-0 text-sm text-violet-300 hover:text-violet-200 font-poppins" onClick={handleForgotPassword} disabled={isSubmitting}>
                Esqueci minha senha
              </Button>
            </div>
            <Button type="submit" className="w-full bg-violet-500 hover:bg-violet-600 text-white font-semibold py-3 shadow-lg font-poppins" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Entrando...</> : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <div className="text-center mt-6">
        <Button variant="link" onClick={() => router.push("/")} className="text-sm text-violet-300 hover:text-violet-200 font-poppins" disabled={isSubmitting}>
          ← Voltar para o site
        </Button>
      </div>
    </div>
  )
}