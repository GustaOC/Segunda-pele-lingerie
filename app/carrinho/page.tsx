"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, Trash2, Plus, Minus, Lock, Loader2, ShoppingCart } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { Playfair_Display, Inter } from "next/font/google"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-playfair" })
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-inter" })

export default function CarrinhoPage() {
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)
  const [items, setItems] = useState<any[]>([])
  
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const fetchCartItems = async (user: any) => {
      const { data, error } = await supabase
        .from('cart_items')
        .select('id, quantity, size, product_id, products(*)')
        .eq('user_id', user.id)

      if (!error && data) {
        // Mapear para o formato do layout, filtrando itens que perderam o produto
        const mappedItems = data.filter(item => item.products).map(item => ({
          cart_id: item.id,
          id: item.product_id,
          name: item.products.name,
          price: item.products.price,
          old_price: item.products.old_price,
          image: item.products.image,
          size: item.size || 'U',
          quantity: item.quantity
        }))
        setItems(mappedItems)
      }
      setIsLoadingAuth(false)
    }

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/login")
      } else {
        fetchCartItems(session.user)
      }
    }
    checkAuth()
  }, [router, supabase])

  const nonPromoItems = items.filter(i => !(i.old_price && i.old_price > i.price))
  const nonPromoQty = nonPromoItems.reduce((acc, item) => acc + item.quantity, 0)
  
  let discountPercent = 0
  if (nonPromoQty > 10) discountPercent = 0.15
  else if (nonPromoQty >= 6) discountPercent = 0.10
  else if (nonPromoQty >= 1) discountPercent = 0.05

  const nonPromoSubtotal = nonPromoItems.reduce((acc, item) => acc + (item.price * item.quantity), 0)
  const promoSubtotal = items.filter(i => (i.old_price && i.old_price > i.price)).reduce((acc, item) => acc + (item.price * item.quantity), 0)
  
  const discountAmount = nonPromoSubtotal * discountPercent
  const subtotal = (nonPromoSubtotal - discountAmount) + promoSubtotal
  
  const frete = subtotal > 299 || items.length === 0 ? 0 : 25.00
  const total = subtotal + frete
  const originalSubtotal = nonPromoSubtotal + promoSubtotal

  const renderDiscountMessage = () => {
    if (nonPromoQty < 5) {
      const needed = 6 - nonPromoQty;
      return (
        <div className="bg-brand-peach/30 border border-brand-peach text-brand-plum p-4 rounded-xl mb-6 text-sm flex items-start shadow-sm">
          <ShoppingCart className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
          <p>
            {nonPromoQty > 0 ? (
              <>Você tem <strong>{nonPromoQty} {nonPromoQty === 1 ? 'peça' : 'peças'}</strong> no carrinho. Adicione mais <strong>{needed} {needed === 1 ? 'peça' : 'peças'}</strong> (sem promoção) para ganhar <strong>10% de desconto</strong>!</>
            ) : (
              <>Adicione <strong>6 peças</strong> (sem promoção) no carrinho para ganhar <strong>10% de desconto</strong>!</>
            )}
          </p>
        </div>
      )
    } else if (nonPromoQty >= 5 && nonPromoQty < 10) {
      const needed = 11 - nonPromoQty;
      return (
        <div className="bg-brand-peach/30 border border-brand-peach text-brand-plum p-4 rounded-xl mb-6 text-sm flex items-start shadow-sm">
          <ShoppingCart className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
          <p>
            Você tem <strong>{nonPromoQty} peças</strong> no carrinho. Adicione mais <strong>{needed} {needed === 1 ? 'peça' : 'peças'}</strong> (sem promoção) para seu desconto subir para <strong>15% OFF</strong>!
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

  const updateQuantity = async (cart_id: string, delta: number) => {
    const item = items.find(i => i.cart_id === cart_id)
    if (!item) return
    const newQty = Math.max(1, item.quantity + delta)
    
    // Atualiza a tela rápido
    setItems(items.map(i => i.cart_id === cart_id ? { ...i, quantity: newQty } : i))
    
    // Atualiza no banco
    await supabase.from('cart_items').update({ quantity: newQty }).eq('id', cart_id)
  }

  const removeItem = async (cart_id: string) => {
    setItems(items.filter(i => i.cart_id !== cart_id))
    await supabase.from('cart_items').delete().eq('id', cart_id)
  }

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-plum" />
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-slate-50 ${inter.variable} ${playfair.variable} font-sans pt-12 pb-24`}>
      <div className="max-w-7xl mx-auto px-6">
        <Link href="/" className="inline-flex items-center text-slate-500 hover:text-brand-plum transition-colors mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" /> Continuar comprando
        </Link>
        
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-12" style={{ fontFamily: "var(--font-playfair)" }}>
          Seu Carrinho
        </h1>

        {items.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-slate-100">
            <p className="text-xl text-slate-500 mb-6">Seu carrinho está vazio.</p>
            <Link href="/lingeries">
              <Button size="lg" className="bg-brand-plum hover:bg-brand-rose rounded-full px-8">
                Ver Lançamentos
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* Lista de Itens */}
            <div className="lg:col-span-2 space-y-6">
              {renderDiscountMessage()}
              {items.map((item) => (
                <div key={item.cart_id} className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="relative w-24 h-32 rounded-xl overflow-hidden shrink-0 bg-slate-100">
                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                  </div>
                  
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="text-xl font-bold text-slate-900 mb-1" style={{ fontFamily: "var(--font-playfair)" }}>{item.name}</h3>
                    <p className="text-slate-500 mb-2">Tamanho: <span className="font-medium text-slate-900">{item.size}</span></p>
                    <p className="text-brand-plum font-bold text-lg">R$ {item.price.toFixed(2).replace('.', ',')}</p>
                  </div>

                  <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="flex items-center bg-slate-50 rounded-full border border-slate-200">
                      <button onClick={() => updateQuantity(item.cart_id, -1)} className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-brand-plum transition">
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-medium text-slate-900">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.cart_id, 1)} className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-brand-plum transition">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <button onClick={() => removeItem(item.cart_id)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors bg-red-50 hover:bg-red-100 rounded-full">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Resumo do Pedido */}
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 h-fit sticky top-24">
              <h3 className="text-2xl font-bold text-slate-900 mb-6" style={{ fontFamily: "var(--font-playfair)" }}>Resumo</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>R$ {originalSubtotal.toFixed(2).replace('.', ',')}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Desconto ({discountPercent * 100}%)</span>
                    <span>- R$ {discountAmount.toFixed(2).replace('.', ',')}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Frete</span>
                  {frete === 0 ? (
                    <span className="text-green-500 font-medium">Grátis</span>
                  ) : (
                    <span>R$ {frete.toFixed(2).replace('.', ',')}</span>
                  )}
                </div>
              </div>
              
              <div className="pt-6 border-t border-slate-100 mb-8">
                <div className="flex justify-between items-end">
                  <span className="text-lg font-medium text-slate-900">Total</span>
                  <span className="text-3xl font-bold text-brand-plum">R$ {total.toFixed(2).replace('.', ',')}</span>
                </div>
                <p className="text-xs text-slate-500 mt-2 text-right">em até 6x sem juros</p>
              </div>

              <Link href="/checkout" className="block w-full">
                <Button size="lg" className="w-full bg-brand-plum hover:bg-brand-rose text-white rounded-2xl h-16 text-lg shadow-lg hover:shadow-xl transition-all">
                  Finalizar Compra
                </Button>
              </Link>

              <div className="mt-6 flex justify-center items-center text-slate-400 text-sm">
                <Lock className="w-4 h-4 mr-2" /> Compra 100% Segura
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
