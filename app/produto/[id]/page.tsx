"use client"

import { Button } from "@/components/ui/button"
import { FavoriteButton } from "@/components/FavoriteButton"
import { ArrowLeft, Star, Heart, Truck, ShieldCheck, ShoppingCart, Loader2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { Playfair_Display, Inter } from "next/font/google"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-playfair" })
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-inter" })

const FALLBACK_PRODUCT = {
  name: "Conjunto Rendado Aurora",
  price: 189.90,
  oldPrice: 229.90,
  description: "Sinta o toque macio da renda francesa em sua pele. O Conjunto Aurora foi desenhado para modelar e exaltar suas curvas com o máximo de conforto. Ideal para ocasiões especiais ou para quando você quiser se sentir incrivelmente poderosa.",
  image: "https://images.unsplash.com/photo-1565597920392-1262d1ec8656?q=80&w=1200&auto=format&fit=crop",
  rating: 5,
  sizes: ["P", "M", "G", "GG"],
}

export default function ProdutoPage() {
  const params = useParams()
  const { id } = params

  const [selectedSize, setSelectedSize] = useState("M")
  const [added, setAdded] = useState(false)
  const [product, setProduct] = useState<any>(null)
  const [loadingProduct, setLoadingProduct] = useState(true)
  
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const fetchProduct = async () => {
      // Evita o erro caso o ID seja genérico ou vazio no primeiro render
      if (!id) return

      const { data, error } = await supabase.from('products').select('*').eq('id', id).single()
      
      if (error || !data) {
        // Fallback para o mock se não encontrar ou se as tabelas ainda não existirem
        setProduct(FALLBACK_PRODUCT)
      } else {
        setProduct({
          ...data,
          sizes: data.sizes || ["P", "M", "G", "GG"], // Fallback pros tamanhos se for nulo
          oldPrice: data.old_price, // Mapeamento pro formato que o layout espera
        })
      }
      setLoadingProduct(false)
    }
    fetchProduct()
  }, [id, supabase])

  const handleActionAuth = async (action: (user: any) => void) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push("/login")
    } else {
      action(session.user)
    }
  }

  const handleAddToCart = () => {
    handleActionAuth(async (user) => {
      if (!product.id) {
        alert("Ops! Este é apenas um produto de demonstração.")
        return
      }

      const { error } = await supabase.from('cart_items').insert({
        user_id: user.id,
        product_id: product.id,
        quantity: 1,
        size: selectedSize
      })

      if (error) {
        console.error("Erro ao adicionar:", error)
        alert("Erro ao adicionar ao carrinho.")
      } else {
        router.push("/carrinho")
      }
    })
  }

  if (loadingProduct) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#5D3A5B]" />
        <p className="mt-4 text-slate-500">Carregando produto...</p>
      </div>
    )
  }

  if (!product) return null

  return (
    <div className={`min-h-screen bg-slate-50 ${inter.variable} ${playfair.variable} font-sans pt-12 pb-24`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="inline-flex items-center text-slate-500 hover:text-[#5D3A5B] transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para a loja
          </Link>
          <Link href="/carrinho" className="inline-flex items-center text-slate-900 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200 hover:border-pink-300 transition-colors">
            <ShoppingCart className="w-4 h-4 mr-2 text-pink-500" /> Carrinho
          </Link>
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 flex flex-col md:flex-row">
          {/* Image Section */}
          <div className="w-full md:w-1/2 h-[500px] md:h-auto relative bg-slate-100">
            <Image 
              src={product.image} 
              alt={product.name} 
              fill 
              className="object-cover object-top" 
            />
            <FavoriteButton productId={product.id} className="absolute top-6 right-6 w-12 h-12 bg-white/90 backdrop-blur rounded-full hover:bg-white shadow-md" />
          </div>

          {/* Details Section */}
          <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center">
            <div className="flex items-center mb-4">
              {[...Array(product.rating)].map((_, i) => <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />)}
              <span className="text-sm text-slate-500 ml-3">(124 avaliações)</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4" style={{ fontFamily: "var(--font-playfair)" }}>
              {product.name}
            </h1>
            
            <div className="flex items-end space-x-4 mb-8">
              <span className="text-3xl md:text-4xl font-bold text-slate-900">R$ {product.price?.toFixed(2).replace('.', ',')}</span>
              {product.oldPrice && (
                <span className="text-xl text-slate-400 line-through mb-1">R$ {product.oldPrice.toFixed(2).replace('.', ',')}</span>
              )}
            </div>

            <p className="text-slate-600 text-lg leading-relaxed mb-10">
              {product.description}
            </p>

            <div className="mb-10">
              <span className="block text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Selecione o Tamanho</span>
              <div className="flex space-x-4">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-medium transition-all ${selectedSize === size ? "bg-[#5D3A5B] text-white shadow-lg scale-110" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <Button 
              size="lg" 
              onClick={handleAddToCart}
              className={`w-full rounded-2xl h-16 text-lg shadow-xl transition-all ${added ? "bg-green-500 hover:bg-green-600" : "bg-[#5D3A5B] hover:bg-[#4A2E49]"}`}
            >
              {added ? "Adicionado ao Carrinho! ✓" : "Adicionar ao Carrinho"}
            </Button>

            <div className="mt-8 pt-8 border-t border-slate-100 grid grid-cols-2 gap-4">
              <div className="flex items-center text-slate-600">
                <Truck className="w-5 h-5 mr-3 text-purple-400" />
                <span className="text-sm font-medium">Frete Grátis MS</span>
              </div>
              <div className="flex items-center text-slate-600">
                <ShieldCheck className="w-5 h-5 mr-3 text-purple-400" />
                <span className="text-sm font-medium">Compra Garantida</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
