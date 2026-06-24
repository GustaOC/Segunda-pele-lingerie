"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Search, ShoppingCart, User, Heart, ChevronDown, Star, Menu, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const NAVBAR_CATEGORIES = [
  { name: 'Conjuntos', slug: 'conjuntos' },
  { 
    name: 'Linha Noite', 
    slug: 'linha-noite', 
    children: [
      { name: 'Shortdoll', slug: 'shortdoll' },
      { name: 'Camisola', slug: 'camisola' },
      { name: 'Pijama', slug: 'pijama' }
    ]
  },
  {
    name: 'Infantil',
    slug: 'infantil',
    children: [
      { name: 'Calcinha infantil', slug: 'calcinha-infantil' },
      { name: 'Cueca infantil', slug: 'cueca-infantil' },
      { name: 'Short doll infantil', slug: 'short-doll-infantil' },
      { name: 'Camisola infantil', slug: 'camisola-infantil' }
    ]
  },
  {
    name: 'Calcinha',
    slug: 'calcinha',
    children: [
      { name: 'Tangas', slug: 'tangas' },
      { name: 'Fio dental', slug: 'fio-dental' },
      { name: 'Calças', slug: 'calcas' }
    ]
  },
  {
    name: 'Cueca',
    slug: 'cueca',
    children: [
      { name: 'Cueca Asa delta', slug: 'cueca-asa-delta' },
      { name: 'Cueca boxer', slug: 'cueca-boxer' },
      { name: 'Samba canção', slug: 'samba-cancao' }
    ]
  }
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const supabase = createClient()

  // Se não estiver na home, a navbar fica sempre na forma reduzida
  const isReduced = scrolled || pathname !== "/"

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
  }, [isMobileMenuOpen])

  useEffect(() => {
    const fetchCartCount = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { count } = await supabase
          .from('cart_items')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', session.user.id)
        if (count !== null) setCartCount(count)
      }
    }
    fetchCartCount()

    // Realtime update listener (optional, but good for UX)
    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cart_items' }, () => {
        fetchCartCount()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  return (
    <>
      <nav className={`fixed top-0 left-0 w-full z-40 transition-all duration-300 ${isReduced ? "bg-background/95 backdrop-blur-md shadow-sm py-2" : "bg-background/95 md:bg-background/90 backdrop-blur-md py-4 md:py-6"}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between">
            
            {/* Left Actions (Menu on Mobile, Search on Desktop) */}
            <div className="flex-1 flex items-center justify-start">
              <button 
                className="md:hidden p-2 -ml-2 text-brand-plum hover:text-brand-plum/80 transition"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu className="w-6 h-6" />
              </button>
              
              <div className="hidden md:flex items-center space-x-2 text-brand-plum hover:text-brand-plum/80 transition cursor-pointer">
                <Search className="w-5 h-5" />
                <span className="text-sm font-medium">Buscar</span>
              </div>
            </div>

            {/* Logo Central (Responsive size based on isReduced) */}
            <div className="flex-1 flex justify-center items-center">
              <Link href="/" className={`relative transition-all duration-300 ${isReduced ? 'h-8 w-28 md:h-10 md:w-[140px]' : 'h-8 w-28 md:h-32 md:w-[400px]'}`}>
                {/* Logo Grande (Desktop) */}
                <Image 
                  src="/logo3.png" 
                  alt="Segunda Pele" 
                  fill
                  className={`hidden md:block object-contain transition-all duration-300 origin-center ${isReduced ? 'opacity-0 scale-75 pointer-events-none' : 'opacity-100 scale-125'}`}
                  priority
                />
                
                {/* Logo Pequeno (Mobile e Desktop scrollado) */}
                <Image 
                  src="/logo4.png" 
                  alt="Segunda Pele" 
                  fill
                  className={`object-contain transition-all duration-300 origin-center ${!isReduced ? 'md:opacity-0 md:scale-75 md:pointer-events-none' : 'opacity-100 scale-100'}`}
                  priority
                />
              </Link>
            </div>

            {/* Right Actions (User, Heart, Cart) */}
            <div className="flex flex-1 items-center justify-end space-x-4 md:space-x-6">
              <Link href="/conta" className="text-brand-plum hover:text-brand-plum/80 transition hidden sm:block">
                <User className="w-5 h-5" />
              </Link>
              <Link href="/favoritos" className="text-brand-plum hover:text-brand-plum/80 transition hidden sm:block">
                <Heart className="w-5 h-5" />
              </Link>
              <Link href="/carrinho" className="text-brand-plum hover:text-brand-plum/80 transition relative p-2 -mr-2 md:p-0 md:mr-0">
                <ShoppingCart className="w-5 h-5 md:w-5 md:h-5" />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 md:-top-2 md:-right-2 bg-brand-rose text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>

          {/* Desktop Links with Hover Dropdowns */}
          <div className={`hidden md:flex justify-center space-x-8 text-sm font-medium text-brand-plum transition-all duration-300 ${isReduced ? 'mt-2' : 'mt-6'}`}>
            {NAVBAR_CATEGORIES.map((category) => (
              <div key={category.slug} className="relative group">
                <Link href={`/categoria/${category.slug}`} className="hover:text-brand-plum transition-colors uppercase tracking-widest py-2 flex items-center">
                  {category.name}
                  {category.children && <ChevronDown className="w-4 h-4 ml-1 opacity-50 group-hover:opacity-100 transition-opacity" />}
                </Link>
                
                {category.children && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-full pt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                    <div className="bg-white rounded-xl shadow-xl border border-slate-100 py-3 w-48 flex flex-col relative before:content-[''] before:absolute before:-top-2 before:left-1/2 before:-translate-x-1/2 before:border-8 before:border-transparent before:border-b-white drop-shadow-lg">
                      {category.children.map((child) => (
                        <Link 
                          key={child.slug} 
                          href={`/categoria/${child.slug}`} 
                          className="px-5 py-2.5 hover:bg-brand-peach hover:text-brand-plum transition-colors text-sm font-medium whitespace-nowrap"
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <Link href="/promocoes" className="hover:text-red-500 text-red-500 transition-colors uppercase tracking-widest py-2">Promoção</Link>
            
            <Link href="/seja-consultora" className="hover:text-brand-plum/80 transition-colors uppercase tracking-widest font-bold flex items-center py-2">
              Seja Consultora
              <span className="ml-1 w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar Content */}
      <div 
        className={`fixed inset-y-0 left-0 w-4/5 max-w-sm bg-white z-50 md:hidden transform transition-transform duration-300 ease-in-out flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <Image 
            src="/logo4.png" 
            alt="Segunda Pele" 
            width={120} 
            height={32} 
            className="object-contain h-8 w-auto"
          />
          <button 
            className="p-2 text-slate-500 hover:text-brand-plum"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-6 space-y-6">
          <div className="flex flex-col space-y-4">
            {NAVBAR_CATEGORIES.map((category) => (
              <div key={category.slug} className="border-b border-slate-50 pb-4">
                <Link 
                  href={`/categoria/${category.slug}`} 
                  className="font-semibold text-slate-800 uppercase tracking-wider text-sm flex items-center justify-between"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {category.name}
                </Link>
                {category.children && (
                  <div className="mt-3 pl-4 flex flex-col space-y-3">
                    {category.children.map((child) => (
                      <Link 
                        key={child.slug} 
                        href={`/categoria/${child.slug}`} 
                        className="text-slate-500 text-sm hover:text-brand-plum"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            <Link 
              href="/promocoes" 
              className="font-semibold text-red-500 uppercase tracking-wider text-sm py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Promoção
            </Link>
            
            <Link 
              href="/seja-consultora" 
              className="font-bold text-brand-plum uppercase tracking-wider text-sm py-2 flex items-center"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Seja Consultora
              <span className="ml-2 w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
            </Link>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 space-y-4">
          <Link 
            href="/conta" 
            className="flex items-center space-x-3 text-slate-700 font-medium"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <User className="w-5 h-5" />
            <span>Minha Conta</span>
          </Link>
          <Link 
            href="/favoritos" 
            className="flex items-center space-x-3 text-slate-700 font-medium"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Heart className="w-5 h-5" />
            <span>Meus Favoritos</span>
          </Link>
        </div>
      </div>
    </>
  )
}
