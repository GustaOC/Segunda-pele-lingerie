"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Search, ShoppingCart, User, Heart, ChevronDown, Star } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const NAVBAR_CATEGORIES = [
  { name: 'Conjuntos', slug: 'conjuntos' },
  { 
    name: 'Linha Noite', 
    slug: 'linha-noite', 
    children: [
      { name: 'Shortdoll', slug: 'shortdoll' },
      { name: 'Camisola', slug: 'camisola' }
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
  const supabase = createClient()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

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
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-md shadow-sm py-4" : "bg-white/80 backdrop-blur-md py-6"}`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between">
          {/* Search */}
          <div className="flex-1 hidden md:block">
            <div className="flex items-center space-x-2 text-slate-500 hover:text-slate-800 transition cursor-pointer">
              <Search className="w-5 h-5" />
              <span className="text-sm font-medium">Buscar</span>
            </div>
          </div>

          {/* Logo Central */}
          <div className="flex-1 flex justify-center">
            <Link href="/" className="relative group">
              <span className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 group-hover:text-[#5D3A5B] transition-colors duration-300" style={{ fontFamily: "var(--font-playfair)" }}>
                Segunda Pele
              </span>
              <div className="absolute -bottom-1 left-1/2 w-0 h-0.5 bg-[#5D3A5B] transition-all duration-300 group-hover:w-full group-hover:left-0"></div>
            </Link>
          </div>

          {/* User Actions */}
          <div className="flex flex-1 items-center justify-end space-x-4 md:space-x-6">
            <Link href="/conta" className="text-slate-800 hover:text-purple-600 transition hidden sm:block">
              <User className="w-5 h-5" />
            </Link>
            <Link href="/favoritos" className="text-slate-800 hover:text-purple-600 transition hidden sm:block">
              <Heart className="w-5 h-5" />
            </Link>
            <Link href="/carrinho" className="text-slate-800 hover:text-purple-600 transition relative">
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Desktop Links with Hover Dropdowns */}
        <div className="hidden md:flex justify-center space-x-8 mt-6 text-sm font-medium text-slate-700">
          <Link href="/destaques" className="text-yellow-600 hover:text-yellow-700 transition-colors uppercase tracking-widest py-2 flex items-center font-bold">
            <Star className="w-4 h-4 mr-1 fill-yellow-500" /> DESTAQUES
          </Link>
          
          {NAVBAR_CATEGORIES.map((category) => (
            <div key={category.slug} className="relative group">
              <Link href={`/categoria/${category.slug}`} className="hover:text-[#5D3A5B] transition-colors uppercase tracking-widest py-2 flex items-center">
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
                        className="px-5 py-2.5 hover:bg-pink-50 hover:text-[#5D3A5B] transition-colors text-sm font-medium whitespace-nowrap"
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          
          <Link href="/categoria/noivas" className="hover:text-[#5D3A5B] transition-colors uppercase tracking-widest py-2">Noivas</Link>
          <Link href="/sale" className="hover:text-red-500 text-red-500 transition-colors uppercase tracking-widest py-2">Sale</Link>
          
          <Link href="/seja-consultora" className="hover:text-purple-600 transition-colors uppercase tracking-widest font-bold flex items-center py-2">
            Seja Consultora
            <span className="ml-1 w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
          </Link>
        </div>
      </div>
    </nav>
  )
}
