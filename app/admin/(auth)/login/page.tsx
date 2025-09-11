// app/admin/(auth)/login/page.tsx

import { Suspense } from "react"
import ShaderBackground from "@/components/shader-background"
import { Playfair_Display, Poppins } from "next/font/google"
import { cn } from "@/lib/utils"
import LoginForm from "./LoginForm"
import { Loader2 } from "lucide-react"

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

// Componente de fallback para o Suspense
function LoadingFallback() {
  return (
    <div className="w-full max-w-md text-center text-white">
      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
      <p>Carregando...</p>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <ShaderBackground>
      <div className={cn(
        "min-h-screen flex items-center justify-center p-4",
        poppins.variable,
        playfair.variable,
        "font-sans"
      )}>
        <Suspense fallback={<LoadingFallback />}>
          <LoginForm />
        </Suspense>
      </div>
    </ShaderBackground>
  )
}