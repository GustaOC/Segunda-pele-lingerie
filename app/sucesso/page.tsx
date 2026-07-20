"use client"

import { Button } from "@/components/ui/button"
import { CheckCircle, Heart, Receipt, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Playfair_Display, Inter } from "next/font/google"
import Confetti from 'react-confetti'
import { useState, useEffect } from 'react'

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-playfair" })
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-inter" })

export default function SucessoPage() {
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight })
  }, [])

  return (
    <div className={`min-h-screen bg-slate-50 flex flex-col items-center justify-center ${inter.variable} ${playfair.variable} font-sans relative overflow-hidden px-6`}>
      {windowSize.width > 0 && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={400}
          gravity={0.15}
          colors={['#5D3A5B', '#ec4899', '#fce7f3', '#10b981', '#fbbf24']}
        />
      )}

      <div className="bg-white p-10 md:p-14 rounded-3xl shadow-xl max-w-2xl w-full text-center relative z-10 border border-slate-100 animate-in zoom-in-95 duration-500">
        
        <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce" style={{ animationIterationCount: 2 }}>
          <CheckCircle className="w-12 h-12" />
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4" style={{ fontFamily: "var(--font-playfair)" }}>
          Pedido Confirmado!
        </h1>
        
        <p className="text-lg text-slate-500 mb-10 max-w-md mx-auto leading-relaxed">
          Obrigado por escolher a <span className="font-medium text-brand-plum">Segunda Pele Lingerie</span>. 
          Seu pedido foi recebido e já estamos preparando com muito carinho para o envio.
        </p>

        <div className="flex justify-center mb-10 text-left">
          <div className="bg-brand-peach/50 p-6 rounded-2xl border border-brand-peach flex items-start space-x-4 max-w-md w-full">
            <div className="bg-white p-2 rounded-full shadow-sm text-brand-plum">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900">Nota Fiscal</h4>
              <p className="text-sm text-slate-500 mt-1">A nota fiscal do seu pedido foi enviada para o seu e-mail.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/" className="w-full sm:w-auto">
            <Button size="lg" className="w-full bg-brand-plum hover:bg-brand-rose text-white rounded-full px-8 h-14 text-lg shadow-lg hover:shadow-xl transition-all">
              Continuar Comprando
            </Button>
          </Link>
          <Link href="/conta" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full rounded-full px-8 h-14 text-lg border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900">
              Ver Meus Pedidos <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
