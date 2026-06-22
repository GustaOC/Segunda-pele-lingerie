// app/admin/(auth)/login/LoginForm.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Shield, Loader2, AlertTriangle, ArrowLeft } from "lucide-react"
import { Playfair_Display, Inter } from "next/font/google"
import Image from "next/image"
import Link from "next/link"

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-playfair" });
const inter = Inter({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], variable: "--font-inter" });

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

    router.push('/admin/dashboard')
    router.refresh()
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-indigo-50/20 flex items-center justify-center p-4 ${inter.variable} ${playfair.variable} font-sans relative overflow-hidden`}>
      {/* Background decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-300/10 to-pink-300/10 rounded-full blur-3xl"></div>
      </div>

      {/* Botão Voltar */}
      <div className="absolute top-4 left-4 z-10">
        <Link href="/">
          <Button variant="outline" size="sm" className="border-white/50 bg-white/50 text-slate-700 hover:bg-white hover:text-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Site
          </Button>
        </Link>
      </div>

      <div className="w-full max-w-md z-10">
        {/* Logo e Título */}
        <div className="text-center mb-8">
          <div className="flex flex-col items-center space-y-4 mb-6">
            <div className="p-4 rounded-2xl shadow-lg" style={{ background: "linear-gradient(to right, #5D3A5B, #4A2E49, #3B2338)" }}>
              <Image 
                src="/logo2.png" 
                alt="Segunda Pele Lingerie" 
                width={80} 
                height={80} 
                className="filter brightness-0 invert drop-shadow-lg" 
                priority
              />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-slate-800 mb-2 drop-shadow-sm" style={{ fontFamily: "var(--font-playfair)" }}>
            Área Administrativa
          </h1>
          <p className="text-slate-600 text-lg" style={{ fontFamily: "var(--font-inter)" }}>
            Acesse o painel de controle
          </p>
        </div>

        {/* Card de Login */}
        <Card className="border border-white/50 bg-white/80 backdrop-blur-lg shadow-xl rounded-2xl">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full" style={{ background: "rgba(93, 58, 91, 0.1)" }}>
                <Shield className="w-8 h-8" style={{ color: "#5D3A5B" }} />
              </div>
            </div>
            <CardTitle className="text-slate-800 text-2xl" style={{ fontFamily: "var(--font-playfair)" }}>
              Login Administrativo
            </CardTitle>
            <CardDescription className="text-slate-600" style={{ fontFamily: "var(--font-inter)" }}>
              Entre com suas credenciais para acessar o sistema
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-0">
            <form onSubmit={handleSubmit} className="space-y-6">
              {formError && (
                <Alert className="border-red-200 bg-red-50/70 backdrop-blur-sm">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">{formError}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-medium" style={{ fontFamily: "var(--font-inter)" }}>
                  Email
                </Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="admin@segundapele.com" 
                  disabled={isSubmitting} 
                  className="border-white/50 focus:border-purple-500 focus:ring-purple-500 h-12 bg-white/70 backdrop-blur-sm rounded-2xl" 
                  style={{ fontFamily: "var(--font-inter)" }}
                  autoComplete="email" 
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 font-medium" style={{ fontFamily: "var(--font-inter)" }}>
                  Senha
                </Label>
                <div className="relative">
                  <Input 
                    id="password" 
                    name="password" 
                    type={showPassword ? "text" : "password"} 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="Digite sua senha" 
                    disabled={isSubmitting} 
                    className="border-white/50 focus:border-purple-500 focus:ring-purple-500 h-12 pr-12 bg-white/70 backdrop-blur-sm rounded-2xl" 
                    style={{ fontFamily: "var(--font-inter)" }}
                    autoComplete="current-password" 
                    required 
                  />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-slate-600" 
                    onClick={() => setShowPassword(!showPassword)} 
                    disabled={isSubmitting} 
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div></div>
                <Button 
                  type="button" 
                  variant="link" 
                  className="px-0 text-sm" 
                  style={{ 
                    fontFamily: "var(--font-inter)",
                    color: "#5D3A5B"
                  }}
                  disabled={isSubmitting}
                >
                  Esqueci minha senha
                </Button>
              </div>
              
              <Button 
                type="submit" 
                className="w-full text-white font-semibold py-3 h-12 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-purple-500/20 rounded-2xl" 
                style={{ 
                  fontFamily: "var(--font-inter)",
                  background: "linear-gradient(to right, #5D3A5B, #4A2E49, #3B2338)"
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" /> 
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-slate-500" style={{ fontFamily: "var(--font-inter)" }}>
            © 2024 Segunda Pele Lingerie. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  )
}