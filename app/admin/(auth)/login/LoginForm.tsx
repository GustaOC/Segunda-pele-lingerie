// app/admin/(auth)/login/LoginForm.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client" // Importa o novo client!
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Shield, Loader2, AlertTriangle } from "lucide-react"
import Image from "next/image"

export default function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setIsSubmitting(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      if (error.message === 'Invalid login credentials') {
        setFormError("Credenciais inválidas. Verifique seu email e senha.")
      } else {
        setFormError("Ocorreu um erro ao tentar fazer login. Tente novamente.")
      }
      setIsSubmitting(false)
      return
    }

    // Sucesso! O middleware irá tratar do redirecionamento.
    // Apenas forçamos um refresh da página para o dashboard.
    router.push('/admin/dashboard')
    router.refresh()
  }

  return (
    <div className="w-full max-w-md">
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
            {formError && (
              <Alert variant="destructive" className="bg-red-500/20 border-red-400/30 text-red-200">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white font-medium font-poppins">Email</Label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="admin@segundapele.com" 
                disabled={isSubmitting} 
                className="bg-violet-900/40 border-violet-400 text-white placeholder-violet-200 focus:ring-violet-300 font-poppins" 
                autoComplete="email" 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white font-medium font-poppins">Senha</Label>
              <div className="relative">
                <Input 
                  id="password" 
                  name="password" 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="Digite sua senha" 
                  disabled={isSubmitting} 
                  className="bg-violet-900/40 border-violet-400 text-white placeholder-violet-200 focus:ring-violet-300 pr-10 font-poppins" 
                  autoComplete="current-password" 
                  required 
                />
                <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-violet-500/20 text-violet-300" onClick={() => setShowPassword(!showPassword)} disabled={isSubmitting} tabIndex={-1}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              {/* O "Lembrar-me" é gerenciado pelo Supabase por padrão */}
              <div></div>
              <Button type="button" variant="link" className="px-0 text-sm text-violet-300 hover:text-violet-200 font-poppins" disabled={isSubmitting}>
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