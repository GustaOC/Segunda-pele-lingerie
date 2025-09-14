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
import { Playfair_Display, Poppins } from "next/font/google"
import Image from "next/image"
import Link from "next/link"

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-playfair" });
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-poppins" });

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
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 flex items-center justify-center p-4 ${poppins.variable} ${playfair.variable} font-sans`}>
      {/* Botão Voltar */}
      <div className="absolute top-4 left-4 z-10">
        <Link href="/">
          <Button variant="outline" size="sm" className="border-purple-200 bg-white text-purple-700 hover:bg-purple-50 hover:text-purple-800 shadow-sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Site
          </Button>
        </Link>
      </div>

      <div className="w-full max-w-md">
        {/* Logo e Título */}
        <div className="text-center mb-8">
          <div className="flex flex-col items-center space-y-4 mb-6">
            <div className="p-4 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl shadow-lg">
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2 drop-shadow-sm" style={{ fontFamily: "var(--font-playfair)" }}>
            Área Administrativa
          </h1>
          <p className="text-gray-600 text-lg" style={{ fontFamily: "var(--font-poppins)" }}>
            Acesse o painel de controle
          </p>
        </div>

        {/* Card de Login */}
        <Card className="border-0 shadow-xl bg-white">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-full">
                <Shield className="w-8 h-8 text-purple-600" />
              </div>
            </div>
            <CardTitle className="text-gray-900 text-2xl" style={{ fontFamily: "var(--font-playfair)" }}>
              Login Administrativo
            </CardTitle>
            <CardDescription className="text-gray-600" style={{ fontFamily: "var(--font-poppins)" }}>
              Entre com suas credenciais para acessar o sistema
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-0">
            <form onSubmit={handleSubmit} className="space-y-6">
              {formError && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">{formError}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium" style={{ fontFamily: "var(--font-poppins)" }}>
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
                  className="border-gray-200 focus:border-purple-500 focus:ring-purple-500 h-12" 
                  style={{ fontFamily: "var(--font-poppins)" }}
                  autoComplete="email" 
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium" style={{ fontFamily: "var(--font-poppins)" }}>
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
                    className="border-gray-200 focus:border-purple-500 focus:ring-purple-500 h-12 pr-12" 
                    style={{ fontFamily: "var(--font-poppins)" }}
                    autoComplete="current-password" 
                    required 
                  />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-gray-600" 
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
                  className="px-0 text-sm text-purple-600 hover:text-purple-700" 
                  style={{ fontFamily: "var(--font-poppins)" }}
                  disabled={isSubmitting}
                >
                  Esqueci minha senha
                </Button>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 h-12 shadow-lg" 
                style={{ fontFamily: "var(--font-poppins)" }}
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
          <p className="text-sm text-gray-500" style={{ fontFamily: "var(--font-poppins)" }}>
            © 2024 Segunda Pele Lingerie. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  )
}