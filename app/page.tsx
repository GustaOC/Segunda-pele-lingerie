"use client"

import { Button } from "@/components/ui/button"
import { ShoppingCart, Search, Heart, User, ArrowRight, Menu, Star, StarHalf, Truck, ShieldCheck, CreditCard, Plus, Trash2, ChevronLeft, ChevronRight, Facebook, Instagram, ArrowUp, ArrowDown } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect, useRef } from "react"
import { Playfair_Display, Inter } from "next/font/google"
import { createClient } from "@/lib/supabase/client"
import { Navbar } from "@/components/Navbar"
import { FavoriteButton } from "@/components/FavoriteButton"
import { HighlightButton } from "@/components/HighlightButton"

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-playfair",
})

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
})

const FALLBACK_PRODUCTS = [
  { id: "1", name: "Conjunto Rendado Aurora", price: 189.90, oldPrice: 229.90, image: "https://images.unsplash.com/photo-1565597920392-1262d1ec8656?q=80&w=800&auto=format&fit=crop", rating: 5 },
  { id: "2", name: "Sutiã Bralette Essencial", price: 129.90, image: "https://images.unsplash.com/photo-1620601335269-1d489b5311cc?q=80&w=800&auto=format&fit=crop", rating: 4 },
  { id: "3", name: "Roupão Seda Supreme", price: 349.90, oldPrice: 399.90, image: "https://images.unsplash.com/photo-1515347619152-16e6d1ebbf13?q=80&w=800&auto=format&fit=crop", rating: 5 },
  { id: "4", name: "Calcinha Caleçon Renda", price: 59.90, image: "https://images.unsplash.com/photo-1622312644243-7f2a1b9131db?q=80&w=800&auto=format&fit=crop", rating: 4 },
]

// --- Mock Data ---
const CATEGORIES = [
  { id: 1, name: "Conjuntos", slug: "conjuntos", image: "/modeloconjunto.png" },
  { id: 2, name: "Linha Noite", slug: "linha-noite", image: "/modelolinhanoite.png" },
  { id: 3, name: "Infantil", slug: "infantil", image: "/modeloinfantil.jpg" },
  { id: 4, name: "Calcinha", slug: "calcinha", image: "/modelocalcinha.png" },
  { id: 5, name: "Cueca", slug: "cueca", image: "/modelocueca.jpg" },
]

export default function EcommerceHome() {
  const [scrolled, setScrolled] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [bestSellers, setBestSellers] = useState<any[]>([])
  const [leastSellers, setLeastSellers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [cartCount, setCartCount] = useState(0)
  const supabase = createClient()
  const carouselRef = useRef<HTMLDivElement>(null)

  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -350, behavior: 'smooth' })
    }
  }

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 350, behavior: 'smooth' })
    }
  }

  // Controle do Navbar on scroll e Checagem de Admin
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)

    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).maybeSingle()
        if (profile?.role === 'ADMIN' || session.user.email === 'admin@segundapele.com') {
          setIsAdmin(true)
          fetchAdminStats()
        }
      }
    }
    
    const fetchAdminStats = async () => {
      const { data: allProds } = await supabase.from('products').select('id, name, image, price')
      const { data: txs } = await supabase.from('inventory_transactions').select('product_id, quantity').in('type', ['OUT_RETAIL', 'OUT_WHOLESALE', 'PROMOTER_SALE'])
      
      if (allProds) {
         const salesByProduct: Record<string, any> = {}
         allProds.forEach((p:any) => {
           salesByProduct[p.id] = { id: p.id, name: p.name, image: p.image || '', price: p.price || 0, qty: 0 }
         })
         
         if (txs) {
           txs.forEach((tx:any) => {
             if (tx.product_id && salesByProduct[tx.product_id]) {
               salesByProduct[tx.product_id].qty += tx.quantity
             }
           })
         }
         
         const sorted = Object.values(salesByProduct).sort((a:any,b:any) => b.qty - a.qty)
         setBestSellers(sorted.slice(0, 5))
         setLeastSellers([...sorted].reverse().slice(0, 5))
      }
    }
    checkAdmin()

    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, inventory(quantity)')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(4)

      if (error || !data || data.length === 0) {
        setProducts(FALLBACK_PRODUCTS)
      } else {
        setProducts(data)
      }
    }
    fetchProducts()

    const fetchCartCount = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { count } = await supabase.from('cart_items').select('*', { count: 'exact', head: true }).eq('user_id', session.user.id)
        if (count) setCartCount(count)
      }
    }
    fetchCartCount()

    return () => window.removeEventListener("scroll", handleScroll)
  }, [supabase, supabase.auth])

  const handleDeleteProduct = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault()
    if (!confirm("Tem certeza que deseja excluir este produto do e-commerce? Ele será desativado, mas continuará no estoque.")) return
    
    try {
      const res = await fetch(`/api/products/${productId}/deactivate`, { method: 'POST' })
      if (!res.ok) throw new Error("Erro ao desativar produto")
      
      setProducts(products.filter(p => p.id !== productId))
    } catch (err) {
      console.error(err)
      alert("Não foi possível excluir o produto.")
    }
  }

  return (
    <div className={`min-h-screen bg-background ${inter.variable} ${playfair.variable} font-sans`}>
      <Navbar />
      {/* Hero Section */}
      <section className="relative w-full h-[100vh] min-h-[700px] flex items-center pt-24 md:pt-48 overflow-hidden bg-background">
        {/* Decorative Blobs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-200/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-pink-200/30 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"></div>

        <div className="max-w-7xl mx-auto px-6 w-full grid md:grid-cols-2 gap-12 items-center relative z-10">
          <div className="space-y-8 max-w-xl">
            <div className="inline-flex items-center space-x-2 bg-white/50 backdrop-blur-sm border border-purple-100 px-4 py-2 rounded-full">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-plum">Nova Coleção Outono</span>
            </div>
            
            <h1 className="text-4xl md:text-7xl font-bold text-slate-900 leading-[1.1] pb-2" style={{ fontFamily: "var(--font-playfair)" }}>
              O Poder <br/> da sua <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-plum to-purple-500 italic font-medium pr-2">Segunda Pele</span>
            </h1>
            
            <p className="text-lg text-slate-600 leading-relaxed max-w-md">
              Descubra peças exclusivas desenhadas para abraçar suas curvas com conforto absoluto e sofisticação inigualável.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/destaques" className="w-full sm:w-auto">
                <Button size="lg" className="rounded-full bg-brand-plum hover:bg-brand-rose text-white px-8 h-14 text-base shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 w-full">
                  Ver Lançamentos
                </Button>
              </Link>
              <Link href="/seja-revendedora" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="rounded-full border-slate-300 hover:border-brand-plum text-slate-700 hover:text-brand-plum px-8 h-14 text-base bg-white/50 backdrop-blur-sm w-full sm:w-auto">
                  Revenda e Lucre
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="relative hidden md:block h-[70vh] max-h-[700px] w-full rounded-t-full overflow-hidden shadow-2xl border-4 border-brand-plum">
            <Image 
              src="/modelovitrine1.png" 
              alt="Modelo usando lingerie Segunda Pele"
              fill
              quality={100}
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover object-top hover:scale-105 transition-transform duration-[20s]"
              priority
            />
          </div>
        </div>
      </section>

      {/* Features Banner */}
      <div className="bg-brand-plum py-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-center justify-center md:justify-start space-x-4">
            <Truck className="w-10 h-10 text-brand-peach" />
            <div>
              <h4 className="font-bold text-brand-peach">Frete Grátis MS</h4>
              <p className="text-sm text-brand-peach/80">Em compras acima de R$ 299</p>
            </div>
          </div>
          <div className="flex items-center justify-center md:justify-center space-x-4 border-y md:border-y-0 md:border-x border-white/10 py-4 md:py-0">
            <ShieldCheck className="w-10 h-10 text-brand-peach" />
            <div>
              <h4 className="font-bold text-brand-peach">Compra Segura</h4>
              <p className="text-sm text-brand-peach/80">Seus dados estão protegidos</p>
            </div>
          </div>
          <div className="flex items-center justify-center md:justify-end space-x-4">
            <CreditCard className="w-10 h-10 text-brand-peach" />
            <div>
              <h4 className="font-bold text-brand-peach">Até 6x sem juros</h4>
              <p className="text-sm text-brand-peach/80">Em todos os cartões</p>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Panel Stats */}
      {isAdmin && bestSellers.length > 0 && (
        <section className="py-16 bg-brand-plum/5 border-b border-brand-plum/10">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-brand-plum/10 rounded-xl">
                <ShieldCheck className="w-6 h-6 text-brand-plum" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800" style={{ fontFamily: "var(--font-playfair)" }}>Visão do Administrador</h2>
                <p className="text-slate-500">Relatório rápido de vendas do E-commerce e PDV (Somente para você)</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               {/* Mais vendidos */}
               <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><ArrowUp className="w-5 h-5 text-green-500"/> Mais Vendidos (Top 5)</h3>
                  <div className="space-y-4">
                    {bestSellers.map((p, idx) => (
                      <div key={p.id} className="flex items-center gap-4 p-3 bg-slate-50 hover:bg-slate-100 transition-colors rounded-xl border border-slate-100">
                        <div className="font-bold text-slate-400 w-4">{idx + 1}º</div>
                        {p.image ? (
                          <img src={p.image} className="w-16 h-16 rounded-lg object-cover bg-white" alt={p.name} />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-slate-200 flex items-center justify-center text-slate-400 font-bold text-xs">Sem foto</div>
                        )}
                        <div className="flex-1">
                          <p className="font-semibold text-slate-800 line-clamp-1">{p.name}</p>
                          <p className="text-brand-plum font-bold">R$ {p.price?.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500">Qtd.</p>
                          <p className="font-bold text-lg text-slate-800">{p.qty}</p>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
               
               {/* Menos vendidos */}
               <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><ArrowDown className="w-5 h-5 text-red-500"/> Menos Vendidos (Encalhados)</h3>
                  <div className="space-y-4">
                    {leastSellers.map((p, idx) => (
                      <div key={p.id} className="flex items-center gap-4 p-3 bg-slate-50 hover:bg-slate-100 transition-colors rounded-xl border border-slate-100">
                        <div className="font-bold text-slate-400 w-4">{idx + 1}º</div>
                        {p.image ? (
                          <img src={p.image} className="w-16 h-16 rounded-lg object-cover bg-white" alt={p.name} />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-slate-200 flex items-center justify-center text-slate-400 font-bold text-xs">Sem foto</div>
                        )}
                        <div className="flex-1">
                          <p className="font-semibold text-slate-800 line-clamp-1">{p.name}</p>
                          <p className="text-brand-plum font-bold">R$ {p.price?.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500">Qtd.</p>
                          <p className="font-bold text-lg text-slate-800">{p.qty}</p>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          </div>
        </section>
      )}

      {/* Shop by Category */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl font-bold text-slate-900 pb-2" style={{ fontFamily: "var(--font-playfair)" }}>Compre por Categoria</h2>
          <p className="text-slate-500 max-w-2xl mx-auto text-lg">Encontre a peça perfeita para o seu estilo e conforto.</p>
        </div>

        <div className="relative group">
          {/* Arrow Left */}
          <button 
            onClick={scrollLeft}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-6 z-20 w-12 h-12 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-slate-800 shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:scale-110 border border-slate-100"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Carousel Container */}
          <div 
            ref={carouselRef}
            className="flex space-x-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-8 pt-4 px-4 -mx-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {CATEGORIES.map((cat) => (
              <Link 
                key={cat.id} 
                href={`/categoria/${cat.slug}`} 
                className="group block relative w-[280px] sm:w-[300px] h-[400px] rounded-3xl overflow-hidden shadow-lg cursor-pointer flex-none snap-start"
              >
                <Image 
                  src={cat.image} 
                  alt={cat.name} 
                  fill 
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  quality={100}
                  className="object-cover group-hover:scale-110 transition-transform duration-700" 
                />
                <div className="absolute inset-0 opacity-90 group-hover:opacity-100 transition-opacity duration-300" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 50%, rgba(0,0,0,0) 100%)" }}></div>
                <div className="absolute bottom-6 left-0 w-full text-center">
                  <h3 className="text-white text-2xl font-semibold tracking-wide leading-normal pb-1" style={{ fontFamily: "var(--font-playfair)" }}>{cat.name}</h3>
                  <span className="inline-block mt-3 text-white/80 text-sm uppercase tracking-widest border-b border-transparent group-hover:border-white transition-colors pb-1">Ver coleção</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Arrow Right */}
          <button 
            onClick={scrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-6 z-20 w-12 h-12 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-slate-800 shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:scale-110 border border-slate-100"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 bg-background border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-4xl font-bold text-brand-plum pb-2" style={{ fontFamily: "var(--font-playfair)" }}>Novidades</h2>
              <p className="text-brand-plum/80 text-lg">Nossas peças mais desejadas no momento.</p>
            </div>
            <div className="flex items-center space-x-4">
              {isAdmin && (
                <Link href="/admin/novo-produto">
                  <Button className="bg-green-500 hover:bg-green-600 text-white rounded-full font-semibold shadow-md flex items-center transition-all mb-2">
                    <Plus className="w-5 h-5 mr-2" />
                    Adicionar Produto
                  </Button>
                </Link>
              )}
              <Link href="/destaques" className="hidden sm:flex items-center text-brand-plum font-semibold hover:text-purple-700 transition">
                Ver tudo <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product) => (
              <Link href={`/produto/${product.id}`} key={product.id} className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100">
                {/* Image Box */}
                <div className="relative h-[380px] overflow-hidden bg-slate-100">
                  {product.isNew && (
                    <div className="absolute top-4 left-4 z-10 bg-white text-brand-plum text-xs font-bold px-3 py-1.5 rounded-full shadow-sm uppercase tracking-wider">
                      Novo
                    </div>
                  )}
                  {(product.old_price || product.oldPrice) && (
                    <div className="absolute top-4 left-4 z-10 bg-brand-rose text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm uppercase tracking-wider">
                      Oferta
                    </div>
                  )}
                  {isAdmin ? (
                    <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
                      <HighlightButton productId={product.id} initialHighlight={product.is_highlight} className="w-10 h-10 bg-white/90 backdrop-blur rounded-full shadow-md translate-x-4 group-hover:translate-x-0 opacity-0 group-hover:opacity-100 duration-300 hover:scale-110" />
                      <button onClick={(e) => handleDeleteProduct(e, product.id)} className="w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-red-500 hover:text-white hover:bg-red-500 shadow-md transition-colors translate-x-4 group-hover:translate-x-0 opacity-0 group-hover:opacity-100 duration-300">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <button className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-slate-400 hover:text-brand-rose hover:bg-white shadow-sm transition-colors opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 duration-300">
                      <Heart className="w-5 h-5" />
                    </button>
                  )}
                  
                  {(() => {
                    const totalQty = (product.inventory || []).reduce((acc, curr) => acc + (curr.quantity || 0), 0);
                    if (totalQty <= 0) {
                      return (
                        <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-20 flex items-center justify-center">
                          <span className="bg-slate-900 text-white text-sm font-bold px-6 py-2 rounded-full shadow-lg uppercase tracking-wider">
                            Indisponível
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  <Image src={product.image || "https://images.unsplash.com/photo-1565597920392-1262d1ec8656?q=80&w=800"} 
                    alt={product.name} 
                    fill 
                    className="object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  
                  {/* Quick Add Button */}
                  <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                    <Button className="w-full bg-white/90 backdrop-blur-sm hover:bg-brand-plum hover:text-white font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-brand-plum disabled:text-slate-500 disabled:hover:bg-slate-100" disabled={(product.inventory || []).reduce((a, c) => a + (c.quantity || 0), 0) <= 0}>
                      Adicionar ao Carrinho
                    </Button>
                  </div>
                </div>

                {/* Info Box */}
                <div className="p-5 flex flex-col flex-grow">
                  <div className="flex items-center mb-2">
                    {[...Array(Math.floor(product.rating))].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                    {product.rating % 1 !== 0 && <StarHalf className="w-4 h-4 fill-yellow-400 text-yellow-400" />}
                    <span className="text-xs text-brand-plum/60 ml-2">({Math.floor(Math.random() * 50) + 10})</span>
                  </div>
                  <span className="text-xs text-brand-plum/60 uppercase tracking-wider mb-1">{product.category}</span>
                  <div className="text-lg font-medium text-brand-plum group-hover:text-brand-rose transition-colors mb-2 line-clamp-2">
                    {product.name}
                  </div>
                  <div className="mt-auto flex items-center space-x-3">
                    {(product.old_price || product.oldPrice) && (
                      <span className="text-brand-plum/60 line-through text-sm">R$ {(product.old_price || product.oldPrice).toFixed(2).replace('.', ',')}</span>
                    )}
                    <span className="text-lg font-bold text-brand-plum">R$ {product.price?.toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Revendedora CTA Banner */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="relative w-full rounded-[3rem] overflow-hidden bg-brand-plum shadow-2xl">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550928431-ee0ecb00c1d5?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-brand-plum via-brand-plum/90 to-transparent"></div>
          
          <div className="relative z-10 grid md:grid-cols-2 p-12 md:p-20 items-center gap-12">
            <div className="space-y-8">
              <h2 className="text-4xl md:text-5xl font-bold text-white leading-normal pb-2" style={{ fontFamily: "var(--font-playfair)" }}>
                Transforme sua <span className="italic text-pink-300">Independência</span> em Realidade
              </h2>
              <p className="text-xl text-white/80 font-light">
                Seja uma revendedora Segunda Pele Lingerie. Revenda peças exclusivas, ganhe até 40% de comissão e pague apenas o que vender em consignação.
              </p>
              <div className="pt-4">
                <Link href="/seja-revendedora">
                  <Button size="lg" className="bg-white text-brand-plum hover:bg-brand-peach hover:scale-105 transition-all shadow-xl rounded-full h-14 px-8 text-lg font-semibold">
                    Quero ser Revendedora <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* Image side */}
            <div className="hidden md:block relative h-full min-h-[400px] w-full rounded-2xl overflow-hidden shadow-xl transform translate-x-4 lg:translate-x-8">
              <Image 
                src="/modelovitrine2.jpg" 
                alt="Seja uma Revendedora" 
                fill 
                className="object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Premium */}
      <footer className="bg-brand-plum text-white pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="space-y-6">
              <div className="relative w-72 h-24 mb-4">
                <Image 
                  src="/logo.png" 
                  alt="Segunda Pele Logo" 
                  fill 
                  className="object-contain object-left" 
                />
              </div>
              <p className="text-white/80 leading-relaxed text-sm">
                A maior empresa de lingerie do estado de Mato Grosso do Sul. Para você usar, ousar e lucrar!
              </p>
              <div className="flex space-x-4">
                <a href="https://www.instagram.com/segundapelemslingerie/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full flex items-center justify-center transition-colors" style={{ backgroundColor: '#f9e4d4', color: '#4b2c4e' }}>
                  <span className="sr-only">Instagram</span>
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="https://www.facebook.com/segundapelems/?locale=pt_BR" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full flex items-center justify-center transition-colors" style={{ backgroundColor: '#f9e4d4', color: '#4b2c4e' }}>
                  <span className="sr-only">Facebook</span>
                  <Facebook className="w-5 h-5" />
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-6 uppercase tracking-wider text-sm">Categorias</h4>
              <ul className="space-y-4">
                {CATEGORIES.map(cat => (
                  <li key={cat.id}>
                    <Link href={`/categoria/${cat.slug}`} className="text-white/80 hover:text-white transition-colors">
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-6 uppercase tracking-wider text-sm">Empresa</h4>
              <ul className="space-y-4">
                <li><Link href="#" className="text-white/80 hover:text-white transition-colors">Sobre Nós</Link></li>
                <li><Link href="/seja-revendedora" className="text-white/80 hover:text-white transition-colors">Seja Revendedora</Link></li>
                <li><Link href="#" className="text-white/80 hover:text-white transition-colors">Dúvidas Frequentes</Link></li>
                <li><Link href="#" className="text-white/80 hover:text-white transition-colors">Política de Privacidade</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-6 uppercase tracking-wider text-sm">Atendimento</h4>
              <ul className="space-y-4 text-white/80">
                <li>WhatsApp: (67) 99214-9878</li>
                <li>Email: contato@segundapele.com</li>
                <li>Seg a Sex das 08h às 18h</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-white/60">
            <p>© {new Date().getFullYear()} Segunda Pele Lingerie. Todos os direitos reservados.</p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <Link href="/admin/login" className="hover:text-white transition-colors">Área Administrativa</Link>
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}