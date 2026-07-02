"use client"

import { Button } from "@/components/ui/button"
import { FavoriteButton } from "@/components/FavoriteButton"
import { ArrowLeft, Star, Heart, Truck, ShieldCheck, ShoppingCart, Loader2, Edit } from "lucide-react"
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
  const [currentImage, setCurrentImage] = useState("")
  const [selectedColor, setSelectedColor] = useState<any>(null)
  const [loadingProduct, setLoadingProduct] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [cartNonPromoQty, setCartNonPromoQty] = useState<number>(0)
  
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.email === 'admin@segundapele.com') {
        setIsAdmin(true)
      }
    }
    checkAdmin()

    const fetchProduct = async () => {
      // Evita o erro caso o ID seja genérico ou vazio no primeiro render
      if (!id) return

      const { data, error } = await supabase.from('products').select('*').eq('id', id).single()
      
      if (error || !data) {
        // Fallback para o mock se não encontrar ou se as tabelas ainda não existirem
        setProduct(FALLBACK_PRODUCT)
        setCurrentImage(FALLBACK_PRODUCT.image)
      } else {
        const prod = {
          ...data,
          sizes: data.sizes || ["P", "M", "G", "GG"], // Fallback pros tamanhos se for nulo
          oldPrice: data.old_price, // Mapeamento pro formato que o layout espera
        }
        setProduct(prod)
        if (prod.colors && prod.colors.length > 0) {
          setSelectedColor(prod.colors[0])
          setCurrentImage(prod.colors[0].images?.[0] || prod.image)
        } else {
          setCurrentImage(prod.image)
        }
      }
      setLoadingProduct(false)
    }
    fetchProduct()
  }, [id, supabase])

  useEffect(() => {
    const fetchCartData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data } = await supabase
          .from('cart_items')
          .select('quantity, products(old_price, price)')
          .eq('user_id', session.user.id)
        
        if (data) {
          const nonPromo = data.filter((item: any) => !(item.products?.old_price && item.products.old_price > item.products.price))
          const qty = nonPromo.reduce((acc: number, item: any) => acc + item.quantity, 0)
          setCartNonPromoQty(qty)
        }
      }
    }
    fetchCartData()
  }, [supabase])

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

      if (!error) {
        setAdded(true)
        const isPromo = product?.oldPrice && product.oldPrice > product.price;
        if (!isPromo) {
          setCartNonPromoQty(prev => prev + 1)
        }
        setTimeout(() => setAdded(false), 2000)
        router.push("/carrinho")
      } else {
        alert("Erro ao adicionar produto.")
      }
    })
  }

  const renderDiscountMessage = () => {
    const isPromo = product?.oldPrice && product.oldPrice > product.price;
    if (!product || isPromo) return null;
    
    if (cartNonPromoQty < 5) {
      const needed = 6 - cartNonPromoQty;
      return (
        <div className="bg-brand-peach/30 border border-brand-peach text-brand-plum p-4 rounded-xl mb-6 text-sm flex items-start shadow-sm">
          <ShoppingCart className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
          <p>
            {cartNonPromoQty > 0 ? (
              <>Você tem <strong>{cartNonPromoQty} {cartNonPromoQty === 1 ? 'peça' : 'peças'}</strong> no carrinho. Adicione mais <strong>{needed} {needed === 1 ? 'peça' : 'peças'}</strong> (sem promoção) para ganhar <strong>10% de desconto</strong>!</>
            ) : (
              <>Adicione <strong>6 peças</strong> (sem promoção) no carrinho para ganhar <strong>10% de desconto</strong>!</>
            )}
          </p>
        </div>
      )
    } else if (cartNonPromoQty >= 5 && cartNonPromoQty < 10) {
      const needed = 11 - cartNonPromoQty;
      return (
        <div className="bg-brand-peach/30 border border-brand-peach text-brand-plum p-4 rounded-xl mb-6 text-sm flex items-start shadow-sm">
          <ShoppingCart className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
          <p>
            Você tem <strong>{cartNonPromoQty} peças</strong> no carrinho. Adicione mais <strong>{needed} {needed === 1 ? 'peça' : 'peças'}</strong> (sem promoção) para seu desconto subir para <strong>15% OFF</strong>!
          </p>
        </div>
      )
    } else {
      return (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl mb-6 text-sm flex items-start shadow-sm">
          <ShoppingCart className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
          <p>
            Parabéns! Você já tem <strong>15% de desconto máximo</strong> garantido no carrinho!
          </p>
        </div>
      )
    }
  }

  if (loadingProduct) {
    return (
      <div className="min-h-screen bg-white flex flex-col justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-plum" />
        <p className="mt-4 text-slate-500">Carregando produto...</p>
      </div>
    )
  }

  if (!product) return null

  return (
    <div className={`min-h-screen bg-white ${inter.variable} ${playfair.variable} font-sans pt-6 pb-12`}>
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <Link href="/" className="inline-flex items-center text-slate-500 hover:text-brand-plum transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para a loja
            </Link>
            
            {isAdmin && (
              <Link href={`/admin/editar-produto/${product.id}`}>
                <Button variant="outline" size="sm" className="text-brand-plum border-brand-plum hover:bg-brand-plum hover:text-white transition-colors">
                  <Edit className="w-4 h-4 mr-2" /> Editar Produto
                </Button>
              </Link>
            )}
          </div>
          <Link href="/carrinho" className="inline-flex items-center text-slate-900 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200 hover:border-pink-300 transition-colors">
            <ShoppingCart className="w-4 h-4 mr-2 text-brand-rose" /> Carrinho
          </Link>
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 flex flex-col md:flex-row">
          {/* Image Section */}
          <div className="w-full md:w-1/2 flex flex-col md:border-r border-slate-100">
            <div className="w-full aspect-square md:aspect-[4/5] max-h-[600px] relative bg-slate-50 group">
              <Image 
                src={currentImage} 
                alt={product.name} 
                fill 
                className="object-contain transition-transform duration-700 group-hover:scale-105" 
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 pointer-events-none"></div>
              <FavoriteButton productId={product.id} className="absolute top-6 right-6 w-12 h-12 bg-white/90 backdrop-blur rounded-full hover:bg-white shadow-md z-10" />
            </div>
            
            {(() => {
              const displayImages = selectedColor && selectedColor.images && selectedColor.images.length > 0 
                ? selectedColor.images 
                : (product.images && product.images.length > 1 ? product.images : [])
              
              if (displayImages.length > 1) {
                return (
                  <div className="flex gap-4 p-6 overflow-x-auto pb-6 custom-scrollbar bg-white">
                    {displayImages.map((img: string, idx: number) => (
                      <button 
                        key={idx}
                        onClick={() => setCurrentImage(img)}
                        className={`relative w-24 h-32 shrink-0 rounded-xl overflow-hidden border-2 transition-all bg-slate-50 ${currentImage === img ? 'border-brand-plum ring-2 ring-brand-plum/20 ring-offset-2' : 'border-transparent opacity-70 hover:opacity-100 hover:border-slate-300'}`}
                      >
                        <Image src={img} alt={`Thumb ${idx}`} fill className="object-contain" />
                      </button>
                    ))}
                  </div>
                )
              }
              return null
            })()}
          </div>

          {/* Details Section */}
          <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col justify-center">
            <div className="flex items-center mb-3">
              {[...Array(product.rating)].map((_, i) => <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
              <span className="text-sm text-slate-500 ml-3">(124 avaliações)</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3" style={{ fontFamily: "var(--font-playfair)" }}>
              {product.name}
            </h1>
            
            <div className="flex items-end space-x-4 mb-6">
              <span className="text-2xl md:text-3xl font-bold text-slate-900">R$ {product.price?.toFixed(2).replace('.', ',')}</span>
              {product.oldPrice && (
                <span className="text-lg text-slate-400 line-through mb-1">R$ {product.oldPrice.toFixed(2).replace('.', ',')}</span>
              )}
            </div>

            <p className="text-slate-600 text-base leading-relaxed mb-6">
              {product.description}
            </p>

            {product.colors && product.colors.length > 0 && (
              <div className="mb-6">
                <span className="block text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Selecione a Cor {selectedColor && <span className="text-brand-plum font-medium capitalize ml-1">- {selectedColor.name}</span>}</span>
                <div className="flex space-x-3">
                  {product.colors.map((color: any, index: number) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedColor(color)
                        if (color.images && color.images.length > 0) {
                          setCurrentImage(color.images[0])
                        }
                      }}
                      className={`relative w-10 h-10 rounded-full border-2 transition-all group flex items-center justify-center ${selectedColor?.hex === color.hex ? "border-brand-plum scale-110 shadow-md" : "border-slate-200 hover:border-slate-300"}`}
                      title={color.name}
                    >
                      <span className="w-7 h-7 rounded-full border border-slate-100" style={{ backgroundColor: color.hex }}></span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-6">
              <span className="block text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Selecione o Tamanho</span>
              <div className="flex space-x-3">
                {product.sizes.map((size: string) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-base font-medium transition-all ${selectedSize === size ? "bg-brand-plum text-white shadow-lg scale-110" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {renderDiscountMessage()}

            <Button 
              size="lg" 
              onClick={handleAddToCart}
              className={`w-full rounded-2xl h-14 text-base shadow-lg transition-all ${added ? "bg-green-500 hover:bg-green-600" : "bg-brand-plum hover:bg-brand-rose"}`}
            >
              {added ? "Adicionado ao Carrinho! ✓" : "Adicionar ao Carrinho"}
            </Button>

            <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 gap-4">
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
