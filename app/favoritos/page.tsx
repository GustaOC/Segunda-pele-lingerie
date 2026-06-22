"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, Star, Heart, Loader2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { Playfair_Display, Inter } from "next/font/google"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { FavoriteButton } from "@/components/FavoriteButton"

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-playfair" })
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-inter" })

export default function FavoritosPage() {
  const [products, setProducts] = useState<any[]>([])
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const fetchFavorites = async (userId: string) => {
      const { data, error } = await supabase
        .from('favorites')
        .select('product_id, products(*)')
        .eq('user_id', userId)
      
      if (!error && data) {
        const mappedProducts = data.filter((f: any) => f.products).map((f: any) => f.products)
        setProducts(mappedProducts)
      }
      setIsLoadingAuth(false)
    }

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/login")
      } else {
        fetchFavorites(session.user.id)
      }
    }
    checkAuth()
  }, [router, supabase])

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#5D3A5B]" />
        <p className="mt-4 text-slate-500">Carregando seus favoritos...</p>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-slate-50 ${inter.variable} ${playfair.variable} font-sans pt-12 pb-24`}>
      <div className="max-w-7xl mx-auto px-6">
        <Link href="/" className="inline-flex items-center text-slate-500 hover:text-[#5D3A5B] transition-colors mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para Home
        </Link>
        
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4" style={{ fontFamily: "var(--font-playfair)" }}>
            Meus Favoritos
          </h1>
          <p className="text-slate-500 text-lg">As peças que você mais amou, salvas aqui.</p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-slate-100">
            <Heart className="w-16 h-16 text-slate-300 mx-auto mb-6" />
            <p className="text-xl text-slate-500 mb-6">Você ainda não tem nenhum produto salvo nos favoritos.</p>
            <Link href="/">
              <Button size="lg" className="bg-[#5D3A5B] hover:bg-[#4A2E49] rounded-full px-8">
                Explorar Catálogo
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product) => (
              <Link href={`/produto/${product.id}`} key={product.id} className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100">
                <div className="relative h-[380px] overflow-hidden bg-slate-100">
                  <div className="absolute top-4 right-4 z-10">
                    <FavoriteButton productId={product.id} className="w-10 h-10 bg-white/90 backdrop-blur rounded-full hover:bg-white shadow-sm" />
                  </div>
                  <Image src={product.image} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-5 flex flex-col flex-grow">
                  <div className="flex items-center mb-2">
                    {[...Array(product.rating)].map((_, i) => <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                  </div>
                  <div className="text-lg font-medium text-slate-900 group-hover:text-[#5D3A5B] transition-colors mb-2 line-clamp-2">
                    {product.name}
                  </div>
                  <div className="mt-auto flex items-center space-x-3">
                    <span className="text-lg font-bold text-slate-900">R$ {product.price.toFixed(2).replace('.', ',')}</span>
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
