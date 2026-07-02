"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, Star, Heart, Plus, Trash2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Navbar } from "@/components/Navbar"
import { useState, useEffect } from "react"
import { Playfair_Display, Inter } from "next/font/google"
import { createClient } from "@/lib/supabase/client"

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-playfair" })
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-inter" })

const FALLBACK_PRODUCTS = [
  { id: 1, name: "Conjunto Rendado Aurora", price: 189.90, oldPrice: 229.90, image: "https://images.unsplash.com/photo-1565597920392-1262d1ec8656?q=80&w=800&auto=format&fit=crop", rating: 5 },
  { id: 3, name: "Roupão Seda Supreme", price: 349.90, oldPrice: 399.90, image: "https://images.unsplash.com/photo-1515347619152-16e6d1ebbf13?q=80&w=800&auto=format&fit=crop", rating: 5 },
]

export default function SalePage() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.email === 'admin@segundapele.com') {
        setIsAdmin(true)
      }
    }
    checkAdmin()

    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .not('old_price', 'is', null)

      if (error || !data || data.length === 0) {
        setProducts(FALLBACK_PRODUCTS)
      } else {
        setProducts(data)
      }
    }
    fetchProducts()
  }, [supabase, supabase.auth])

  return (
    <div className={`min-h-screen bg-slate-50 ${inter.variable} ${playfair.variable} font-sans`}>
      <Navbar />
      <div className="pt-32 pb-24 max-w-7xl mx-auto px-6">
        <Link href="/" className="inline-flex items-center text-slate-500 hover:text-red-500 transition-colors mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para Home
        </Link>
        
        <div className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-red-600 mb-4" style={{ fontFamily: "var(--font-playfair)" }}>
              Promoções
            </h1>
            <p className="text-slate-500 text-lg">Aproveite as melhores peças com descontos exclusivos.</p>
          </div>
          {isAdmin && (
            <Link href="/admin/novo-produto">
              <Button className="bg-green-500 hover:bg-green-600 text-white rounded-full font-semibold shadow-md flex items-center transition-all mb-2">
                <Plus className="w-5 h-5 mr-2" />
                Adicionar Oferta
              </Button>
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((product) => (
            <Link href={`/produto/${product.id}`} key={product.id} className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-red-100">
              <div className="relative h-[380px] overflow-hidden bg-slate-100">
                <div className="absolute top-4 left-4 z-10 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm uppercase tracking-wider">
                  Oferta
                </div>
                {isAdmin ? (
                  <button onClick={(e) => { e.preventDefault(); alert("Produto excluído (mock)"); }} className="absolute top-4 right-4 z-20 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-red-500 hover:text-white hover:bg-red-500 shadow-md transition-colors translate-x-4 group-hover:translate-x-0 opacity-0 group-hover:opacity-100 duration-300">
                    <Trash2 className="w-5 h-5" />
                  </button>
                ) : (
                  <button className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-white shadow-sm transition-colors opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 duration-300">
                    <Heart className="w-5 h-5" />
                  </button>
                )}
                <Image src={product.image} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-5 flex flex-col flex-grow">
                <div className="flex items-center mb-2">
                  {[...Array(product.rating)].map((_, i) => <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                </div>
                <div className="text-lg font-medium text-slate-900 group-hover:text-red-600 transition-colors mb-2 line-clamp-2">
                  {product.name}
                </div>
                <div className="mt-auto flex items-center space-x-3">
                  <span className="text-slate-400 line-through text-sm">R$ {(product.old_price || product.oldPrice)?.toFixed(2).replace('.', ',')}</span>
                  <span className="text-lg font-bold text-red-600">R$ {product.price?.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
