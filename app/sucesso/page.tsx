"use client"

import { Button } from "@/components/ui/button"
import { CheckCircle, Heart, Package, ArrowRight } from "lucide-react"
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
          Obrigado por escolher a <span className="font-medium text-[#5D3A5B]">Segunda Pele Lingerie</span>. 
          Seu pedido foi recebido e já estamos preparando com muito carinho para o envio.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10 text-left">
          <div className="bg-pink-50/50 p-6 rounded-2xl border border-pink-100 flex items-start space-x-4">
            <div className="bg-white p-2 rounded-full shadow-sm text-[#5D3A5B]">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900">Rastreamento</h4>
              <p className="text-sm text-slate-500 mt-1">Em breve você receberá o código de rastreio no seu e-mail.</p>
            </div>
          </div>
          
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-start space-x-4">
            <div className="bg-white p-2 rounded-full shadow-sm text-pink-500">
              <Heart className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900">Mimo Exclusivo</h4>
              <p className="text-sm text-slate-500 mt-1">Um presente surpresa foi adicionado à sua caixinha!</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/" className="w-full sm:w-auto">
            <Button size="lg" className="w-full bg-[#5D3A5B] hover:bg-[#4A2E49] text-white rounded-full px-8 h-14 text-lg shadow-lg hover:shadow-xl transition-all">
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
