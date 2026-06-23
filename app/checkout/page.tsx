"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, CreditCard, QrCode, MapPin, Truck, Lock, Loader2, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { Playfair_Display, Inter } from "next/font/google"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-playfair" })
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-inter" })

export default function CheckoutPage() {
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)
  const [items, setItems] = useState<any[]>([])
  
  // Checkout State
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'pix'>('credit_card')
  const [cep, setCep] = useState("")
  const [address, setAddress] = useState<{ logradouro: string, bairro: string, localidade: string, uf: string } | null>(null)
  const [frete, setFrete] = useState<number | null>(null)
  const [isCalculatingFreight, setIsCalculatingFreight] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const fetchCartItems = async (user: any) => {
      const { data, error } = await supabase
        .from('cart_items')
        .select('id, quantity, size, product_id, products(*)')
        .eq('user_id', user.id)

      if (!error && data && data.length > 0) {
        const mappedItems = data.filter(item => item.products).map(item => ({
          cart_id: item.id,
          id: item.product_id,
          name: item.products.name,
          price: item.products.price,
          image: item.products.image,
          quantity: item.quantity
        }))
        setItems(mappedItems)
      } else {
        router.push("/carrinho")
      }
      setIsLoadingAuth(false)
    }

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/login?redirect=/checkout")
      } else {
        fetchCartItems(session.user)
      }
    }
    checkAuth()
  }, [router, supabase])

  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0)
  const total = subtotal + (frete || 0)

  const handleCepSearch = async () => {
    if (cep.replace(/\D/g, '').length !== 8) return alert("CEP inválido")
    setIsCalculatingFreight(true)
    
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep.replace(/\D/g, '')}/json/`)
      const data = await res.json()
      
      if (data.erro) {
        alert("CEP não encontrado.")
        setAddress(null)
        setFrete(null)
      } else {
        setAddress(data)
        // Regra de frete simulada: Se for SP = 15.00, outros estados 25.00. Compras acima de 299 = grátis.
        let valorFrete = data.uf === 'SP' ? 15.00 : 25.00
        if (subtotal >= 299) valorFrete = 0
        setFrete(valorFrete)
      }
    } catch (err) {
      alert("Erro ao buscar CEP.")
    } finally {
      setIsCalculatingFreight(false)
    }
  }

  const handleCheckout = async () => {
    if (!address) return alert("Por favor, calcule o frete para o seu CEP primeiro.")
    
    setIsProcessing(true)
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Clear cart
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      await supabase.from('cart_items').delete().eq('user_id', session.user.id)
    }
    
    router.push("/sucesso")
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
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <Link href="/carrinho" className="inline-flex items-center text-slate-500 hover:text-brand-plum transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao Carrinho
          </Link>
          <div className="flex items-center text-green-600 font-medium text-sm bg-green-50 px-4 py-2 rounded-full">
            <Lock className="w-4 h-4 mr-2" /> Ambiente 100% Seguro
          </div>
        </div>
        
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-10" style={{ fontFamily: "var(--font-playfair)" }}>
          Finalizar Compra
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Lado Esquerdo: Forms */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Endereço e Frete */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-brand-peach rounded-full flex items-center justify-center mr-4">
                  <MapPin className="w-5 h-5 text-brand-plum" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Endereço de Entrega</h2>
              </div>
              
              <div className="flex gap-4 mb-6">
                <input
                  type="text"
                  placeholder="00000-000"
                  value={cep}
                  onChange={(e) => setCep(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum focus:ring-1 focus:ring-brand-plum transition-all max-w-[200px]"
                />
                <Button 
                  onClick={handleCepSearch} 
                  disabled={isCalculatingFreight || !cep}
                  className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-[50px] px-6"
                >
                  {isCalculatingFreight ? <Loader2 className="w-4 h-4 animate-spin" /> : "Calcular"}
                </Button>
              </div>

              {address && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-600 space-y-1">
                  <p className="font-medium text-slate-900">{address.logradouro}</p>
                  <p>{address.bairro}</p>
                  <p>{address.localidade} - {address.uf}</p>
                  <div className="mt-4 flex items-center text-green-600 font-medium">
                    <Truck className="w-4 h-4 mr-2" /> 
                    {frete === 0 ? "Frete Grátis (Promoção)" : `Frete Transportadora: R$ ${frete?.toFixed(2).replace('.', ',')}`}
                  </div>
                </div>
              )}
            </div>

            {/* Pagamento */}
            <div className={`bg-white p-8 rounded-3xl shadow-sm border border-slate-100 transition-opacity ${!address ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-brand-peach rounded-full flex items-center justify-center mr-4">
                  <CreditCard className="w-5 h-5 text-brand-plum" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Método de Pagamento</h2>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <button 
                  onClick={() => setPaymentMethod('credit_card')}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${paymentMethod === 'credit_card' ? 'border-brand-plum bg-brand-peach/30' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                >
                  <CreditCard className={`w-8 h-8 mb-2 ${paymentMethod === 'credit_card' ? 'text-brand-plum' : 'text-slate-400'}`} />
                  <span className={`font-medium ${paymentMethod === 'credit_card' ? 'text-brand-plum' : 'text-slate-600'}`}>Cartão de Crédito</span>
                </button>
                <button 
                  onClick={() => setPaymentMethod('pix')}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${paymentMethod === 'pix' ? 'border-teal-500 bg-teal-50/30' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                >
                  <QrCode className={`w-8 h-8 mb-2 ${paymentMethod === 'pix' ? 'text-teal-600' : 'text-slate-400'}`} />
                  <span className={`font-medium ${paymentMethod === 'pix' ? 'text-teal-600' : 'text-slate-600'}`}>PIX (Aprovação na hora)</span>
                </button>
              </div>

              {paymentMethod === 'credit_card' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Número do Cartão</label>
                    <input type="text" placeholder="0000 0000 0000 0000" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Nome Impresso no Cartão</label>
                    <input type="text" placeholder="Ex: MARIA DA SILVA" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum transition-all uppercase" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Validade</label>
                      <input type="text" placeholder="MM/AA" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">CVV</label>
                      <input type="text" placeholder="123" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum transition-all" />
                    </div>
                  </div>
                  <div className="pt-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Parcelamento</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum transition-all appearance-none cursor-pointer">
                      <option>1x de R$ {total.toFixed(2).replace('.', ',')} sem juros</option>
                      <option>2x de R$ {(total/2).toFixed(2).replace('.', ',')} sem juros</option>
                      <option>3x de R$ {(total/3).toFixed(2).replace('.', ',')} sem juros</option>
                      <option>4x de R$ {(total/4).toFixed(2).replace('.', ',')} sem juros</option>
                      <option>5x de R$ {(total/5).toFixed(2).replace('.', ',')} sem juros</option>
                      <option>6x de R$ {(total/6).toFixed(2).replace('.', ',')} sem juros</option>
                    </select>
                  </div>
                </div>
              )}

              {paymentMethod === 'pix' && (
                <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-2xl border border-slate-100 animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="w-48 h-48 bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-sm flex items-center justify-center">
                    <QrCode className="w-full h-full text-slate-800 opacity-20" />
                    <span className="absolute text-sm font-medium text-slate-500">QR Code Simulador</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Pague via PIX e libere seu pedido mais rápido</h3>
                  <p className="text-slate-500 text-sm text-center mb-6">Abra o app do seu banco e escaneie o código acima, ou copie o código Pix Copia e Cola clicando no botão abaixo.</p>
                  <Button variant="outline" className="rounded-full w-full border-teal-200 text-teal-700 hover:bg-teal-50 hover:text-teal-800 h-12">
                    Copiar Código PIX
                  </Button>
                </div>
              )}
            </div>

          </div>

          {/* Lado Direito: Resumo */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 sticky top-24">
              <h3 className="text-2xl font-bold text-slate-900 mb-6" style={{ fontFamily: "var(--font-playfair)" }}>Sua Compra</h3>
              
              <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {items.map((item) => (
                  <div key={item.cart_id} className="flex gap-4">
                    <div className="relative w-16 h-20 rounded-lg overflow-hidden shrink-0 bg-slate-100">
                      <Image src={item.image} alt={item.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 py-1">
                      <h4 className="font-medium text-slate-900 text-sm line-clamp-2">{item.name}</h4>
                      <p className="text-xs text-slate-500 mt-1">Qtd: {item.quantity}</p>
                      <p className="font-bold text-brand-plum mt-1">R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4 pt-6 border-t border-slate-100 mb-6">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Frete</span>
                  {frete === null ? (
                    <span className="text-slate-400 text-sm">Calcule com o CEP</span>
                  ) : frete === 0 ? (
                    <span className="text-green-500 font-medium">Grátis</span>
                  ) : (
                    <span>R$ {frete.toFixed(2).replace('.', ',')}</span>
                  )}
                </div>
              </div>
              
              <div className="pt-6 border-t border-slate-100 mb-8 bg-slate-50 -mx-8 px-8 pb-8 rounded-b-3xl -mb-8">
                <div className="flex justify-between items-end mb-6 pt-4">
                  <span className="text-lg font-medium text-slate-900">Total a Pagar</span>
                  <span className="text-3xl font-bold text-brand-plum">R$ {total.toFixed(2).replace('.', ',')}</span>
                </div>

                <Button 
                  size="lg" 
                  onClick={handleCheckout}
                  disabled={!address || isProcessing}
                  className="w-full bg-brand-plum hover:bg-brand-rose text-white rounded-2xl h-16 text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                >
                  {isProcessing ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processando Pagamento...</>
                  ) : (
                    <><CheckCircle2 className="w-5 h-5 mr-2" /> Confirmar Pagamento</>
                  )}
                </Button>
                <p className="text-xs text-center text-slate-400 mt-4">
                  Ao confirmar, você concorda com nossos termos de serviço e política de privacidade.
                </p>
              </div>

            </div>
          </div>

        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}} />
    </div>
  )
}
