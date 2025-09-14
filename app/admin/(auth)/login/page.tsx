// app/admin/(auth)/login/page.tsx

import { Suspense } from "react"
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

export default function AdminLoginPage() {
  return (
    <div className={cn(
      poppins.variable,
      playfair.variable,
      "font-sans"
    )}>
      <Suspense fallback={<LoadingFallback />}>
        <LoginForm />
      </Suspense>
    </div>
  )
}