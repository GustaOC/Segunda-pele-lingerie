"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { Playfair_Display, Inter } from "next/font/google"
import { createClient } from "@/lib/supabase/client"

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-playfair" })
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-inter" })

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/conta`,
      },
    })
    if (error) {
      console.error("Erro ao fazer login com Google:", error.message)
      setIsLoading(false)
    }
  }

  return (
    <div className={`min-h-screen bg-slate-50 flex flex-col justify-center items-center ${inter.variable} ${playfair.variable} font-sans p-6`}>
      <div className="absolute top-8 left-8">
        <Link href="/" className="inline-flex items-center text-slate-500 hover:text-[#5D3A5B] transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para a Loja
        </Link>
      </div>

      <div className="w-full max-w-md bg-white p-10 rounded-3xl shadow-xl border border-slate-100 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-pink-50/50 rounded-3xl pointer-events-none"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-slate-900 mb-2" style={{ fontFamily: "var(--font-playfair)" }}>Bem-vinda</h1>
          <p className="text-slate-500 mb-8">Faça login para salvar seus favoritos, ver pedidos e finalizar compras.</p>

          <Button 
            onClick={handleGoogleLogin} 
            disabled={isLoading}
            variant="outline" 
            className="w-full h-14 rounded-2xl border-slate-200 text-slate-700 font-medium text-lg flex items-center justify-center hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 mr-3 animate-spin text-slate-500" />
            ) : (
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            Continuar com o Google
          </Button>

          <p className="mt-8 text-xs text-slate-400">
            Ao continuar, você concorda com nossos <br/>Termos de Serviço e Política de Privacidade.
          </p>
        </div>
      </div>
    </div>
  )
}
