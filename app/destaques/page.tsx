"use client"

import { Navbar } from "@/components/Navbar"
import { createClient } from "@/lib/supabase/client"
import { Playfair_Display, Inter } from "next/font/google"
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { Star, Heart, Loader2, ArrowLeft, Trash2 } from "lucide-react"
import { FavoriteButton } from "@/components/FavoriteButton"
import { HighlightButton } from "@/components/HighlightButton"

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-playfair" })
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-inter" })

export default function DestaquesPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const fetchHighlights = async () => {
      // Check admin status
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.email === 'admin@segundapele.com') {
        setIsAdmin(true)
      }

      // Fetch manual highlights
      const { data: manualHighlights } = await supabase
        .from('products')
        .select('*')
        .eq('is_highlight', true)

      // Fetch cart items to find most added products
      const { data: cartItems } = await supabase
        .from('cart_items')
        .select('product_id')
      
      const cartCounts: Record<string, number> = {}
      if (cartItems) {
        cartItems.forEach(item => {
          cartCounts[item.product_id] = (cartCounts[item.product_id] || 0) + 1
        })
      }

      // Sort product IDs by cart additions (descending)
      const topProductIds = Object.entries(cartCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10) // Top 10 most popular
        .map(entry => entry[0])

      let popularProducts: any[] = []
      if (topProductIds.length > 0) {
        const { data: popData } = await supabase
          .from('products')
          .select('*')
          .in('id', topProductIds)
        if (popData) popularProducts = popData
      }

      // Merge and deduplicate
      const merged = [...(manualHighlights || []), ...popularProducts]
      const uniqueIds = new Set()
      const finalProducts = []

      for (const p of merged) {
        if (!uniqueIds.has(p.id)) {
          uniqueIds.add(p.id)
          finalProducts.push(p)
        }
      }

      setProducts(finalProducts)
      setLoading(false)
    }

    fetchHighlights()
  }, [supabase])

  return (
    <div className={`min-h-screen bg-slate-50 ${inter.variable} ${playfair.variable} font-sans`}>
      <Navbar />

      <div className="pt-32 pb-24 max-w-7xl mx-auto px-6">
        <Link href="/" className="inline-flex items-center text-slate-500 hover:text-brand-plum transition-colors mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para Home
        </Link>

        <div className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4" style={{ fontFamily: "var(--font-playfair)" }}>
              Destaques
            </h1>
            <p className="text-slate-500 text-lg">As peças mais desejadas e mais adicionadas ao carrinho!</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-brand-plum" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-slate-100">
            <p className="text-xl text-slate-500">Ainda não há destaques para exibir.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product) => (
              <Link href={`/produto/${product.id}`} key={product.id} className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100">
                <div className="relative h-[380px] overflow-hidden bg-slate-100">
                  {isAdmin ? (
                    <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
                      <HighlightButton productId={product.id} initialHighlight={product.is_highlight} className="w-10 h-10 bg-white/90 backdrop-blur rounded-full shadow-md translate-x-4 group-hover:translate-x-0 opacity-0 group-hover:opacity-100 duration-300 hover:scale-110" />
                      <button onClick={(e) => { e.preventDefault(); alert("Produto excluído (mock)"); }} className="w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-red-500 hover:text-white hover:bg-red-500 shadow-md transition-colors translate-x-4 group-hover:translate-x-0 opacity-0 group-hover:opacity-100 duration-300">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <FavoriteButton productId={product.id} className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/80 backdrop-blur rounded-full hover:bg-white shadow-sm opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 duration-300" />
                  )}
                  <Image src={product.image} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-5 flex flex-col flex-grow">
                  <div className="flex items-center mb-2">
                    {[...Array(product.rating || 5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                  </div>
                  <div className="text-lg font-medium text-slate-900 group-hover:text-brand-plum transition-colors mb-2 line-clamp-2">
                    {product.name}
                  </div>
                  <div className="mt-auto flex items-center space-x-3">
                    <span className="text-lg font-bold text-slate-900">R$ {product.price.toFixed(2).replace('.', ',')}</span>
                    {product.old_price && (
                       <span className="text-sm text-slate-400 line-through">R$ {product.old_price.toFixed(2).replace('.', ',')}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
