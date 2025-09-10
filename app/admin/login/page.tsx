"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Shield } from "lucide-react"
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

export default function AdminLogin() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  // Verificar se já existe uma sessão ativa
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push("/admin/dashboard")
      }
    }
    
    checkSession()
  }, [router, supabase.auth])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (error) setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Validação básica
    if (!formData.email || !formData.password) {
      setError("Por favor, preencha todos os campos")
      setIsLoading(false)
      return
    }

    if (!formData.email.includes("@")) {
      setError("Por favor, insira um email válido")
      setIsLoading(false)
      return
    }

    try {
      // Fazer login com Supabase
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (signInError) {
        console.error("Erro de login:", signInError)
        setError("Credenciais inválidas. Verifique seu email e senha.")
        return
      }

      if (data.session) {
        // Se "Lembrar-me" estiver marcado, a sessão dura mais tempo (configurado no Supabase)
        router.push("/admin/dashboard")
        router.refresh()
      }
    } catch (err) {
      console.error("Erro inesperado:", err)
      setError("Erro ao fazer login. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!formData.email) {
      setError("Por favor, informe seu email para redefinir a senha")
      return
    }

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        formData.email,
        { redirectTo: `${window.location.origin}/admin/reset-password` }
      )

      if (resetError) {
        console.error("Erro ao solicitar redefinição:", resetError)
        setError("Erro ao solicitar redefinição de senha. Tente novamente.")
        return
      }

      alert("Email de redefinição de senha enviado! Verifique sua caixa de entrada.")
    } catch (err) {
      console.error("Erro inesperado:", err)
      setError("Erro ao solicitar redefinição de senha.")
    }
  }

  return (
    <ShaderBackground>
      <div
        className={`min-h-screen flex items-center justify-center p-4 ${poppins.variable} ${playfair.variable} font-sans`}
      >
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex flex-col items-center space-y-4 mb-6">
              <Image 
                src="/logo2.png" 
                alt="Segunda Pele Lingerie" 
                width={120} 
                height={120} 
                className="drop-shadow-lg" 
              />
            </div>
            <h1
              className="text-4xl font-bold text-white mb-2 drop-shadow-lg"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              Área Administrativa
            </h1>
            <p className="text-violet-200 text-lg" style={{ fontFamily: "var(--font-poppins)" }}>
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
              <CardTitle className="text-white text-2xl" style={{ fontFamily: "var(--font-playfair)" }}>
                Login Administrativo
              </CardTitle>
              <CardDescription className="text-violet-200" style={{ fontFamily: "var(--font-poppins)" }}>
                Entre com suas credenciais para acessar o sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive" className="bg-red-500/20 border-red-400/30 text-red-200">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-white font-medium"
                    style={{ fontFamily: "var(--font-poppins)" }}
                  >
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="admin@segundapele.com"
                    disabled={isLoading}
                    className="bg-violet-900/40 border-violet-400 text-white placeholder-violet-200 focus:ring-violet-300"
                    style={{ fontFamily: "var(--font-poppins)" }}
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-white font-medium"
                    style={{ fontFamily: "var(--font-poppins)" }}
                  >
                    Senha
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      placeholder="Digite sua senha"
                      disabled={isLoading}
                      className="bg-violet-900/40 border-violet-400 text-white placeholder-violet-200 focus:ring-violet-300 pr-10"
                      style={{ fontFamily: "var(--font-poppins)" }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-violet-500/20 text-violet-300"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="rememberMe"
                      checked={formData.rememberMe}
                      onCheckedChange={(checked) => handleInputChange("rememberMe", checked as boolean)}
                      disabled={isLoading}
                      className="border-violet-400 data-[state=checked]:bg-violet-500"
                    />
                    <Label
                      htmlFor="rememberMe"
                      className="text-sm text-white"
                      style={{ fontFamily: "var(--font-poppins)" }}
                    >
                      Lembrar-me
                    </Label>
                  </div>

                  <Button
                    type="button"
                    variant="link"
                    className="px-0 text-sm text-violet-300 hover:text-violet-200"
                    onClick={handleForgotPassword}
                    disabled={isLoading}
                    style={{ fontFamily: "var(--font-poppins)" }}
                  >
                    Esqueci minha senha
                  </Button>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-violet-500 hover:bg-violet-600 text-white font-semibold py-3 shadow-lg"
                  disabled={isLoading}
                  style={{ fontFamily: "var(--font-poppins)" }}
                >
                  {isLoading ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="text-center mt-6">
            <Button
              variant="link"
              onClick={() => router.push("/")}
              className="text-sm text-violet-300 hover:text-violet-200"
              style={{ fontFamily: "var(--font-poppins)" }}
            >
              ← Voltar para o site
            </Button>
          </div>
        </div>
      </div>
    </ShaderBackground>
  )
}