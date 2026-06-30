"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, LogOut, Loader2, User, Package } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Playfair_Display, Inter } from "next/font/google"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-playfair" })
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-inter" })

export default function ContaPage() {
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<string>("USER")
  const [isLoading, setIsLoading] = useState(true)
  const [favorites, setFavorites] = useState<any[]>([])
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/login")
      } else {
        setUser(session.user)
        
        // Fetch role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()
          
        if (profile && profile.role) {
          setRole(profile.role)
        } else if (session.user?.user_metadata?.role) {
          setRole(session.user.user_metadata.role)
        }
        const fetchFavorites = async () => {
          const { data } = await supabase
            .from('favorites')
            .select('product_id, products(*)')
            .eq('user_id', session.user.id)
          if (data) setFavorites(data)
        }
        fetchFavorites()
      }
      setIsLoading(false)
    }

    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push("/login")
      } else {
        setUser(session.user)
      }
    })

    return () => subscription.unsubscribe()
  }, [router, supabase.auth])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-plum" />
      </div>
    )
  }

  if (!user) return null

  const isPromoter = role === 'PROMOTOR' || role === 'CONSULTANT' || role === 'ADMIN'

  return (
    <div className={`min-h-screen bg-slate-50 ${inter.variable} ${playfair.variable} font-sans pt-12 pb-24`}>
      <div className="max-w-4xl mx-auto px-6">
        <Link href="/" className="inline-flex items-center text-slate-500 hover:text-brand-plum transition-colors mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para a Loja
        </Link>
        
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-12" style={{ fontFamily: "var(--font-playfair)" }}>
          Minha Conta
        </h1>

        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center space-x-6">
            {user.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-20 h-20 rounded-full shadow-md" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shadow-md shrink-0">
                <User className="w-8 h-8" />
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{user.user_metadata?.full_name || "Cliente Segunda Pele"}</h2>
              <p className="text-slate-500">{user.email}</p>
              {isPromoter && (
                <span className="inline-block mt-2 bg-brand-plum/10 text-brand-plum text-xs font-bold px-2 py-1 rounded">
                  {role === 'ADMIN' ? 'Administrador' : 'Promotora / Consultora'}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex flex-col gap-3 w-full md:w-auto">

            {(role === 'ADMIN' || role === 'PROMOTOR' || role === 'CONSULTANT') && (
              <Button onClick={() => router.push(role === 'ADMIN' ? '/admin/dashboard' : '/area-promotora/kits')} variant="outline" className="border-brand-plum text-brand-plum hover:bg-brand-plum hover:text-white rounded-full w-full md:w-auto">
                {role === 'ADMIN' ? 'Acessar Painel Admin' : 'Acessar Área do Promotor'}
              </Button>
            )}
            <Button onClick={handleLogout} variant="outline" className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 rounded-full w-full md:w-auto">
              <LogOut className="w-4 h-4 mr-2" /> Sair
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-xl font-bold text-slate-900 mb-4" style={{ fontFamily: "var(--font-playfair)" }}>Meus Pedidos</h3>
            <p className="text-slate-500 text-sm">Você ainda não tem nenhum pedido.</p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col max-h-[400px]">
            <h3 className="text-xl font-bold text-slate-900 mb-4" style={{ fontFamily: "var(--font-playfair)" }}>Meus Favoritos</h3>
            {favorites.length === 0 ? (
              <p className="text-slate-500 text-sm">Nenhum produto salvo nos favoritos.</p>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {favorites.map((fav) => (
                  <Link key={fav.product_id} href={`/produto/${fav.product_id}`} className="flex items-center space-x-4 group p-2 hover:bg-brand-peach rounded-xl transition-colors">
                    {fav.products?.image && (
                      <img src={fav.products.image} alt={fav.products.name} className="w-16 h-16 object-cover rounded-lg" />
                    )}
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 group-hover:text-brand-brown transition-colors line-clamp-1">{fav.products?.name}</h4>
                      <p className="text-sm text-slate-500">R$ {fav.products?.price?.toFixed(2).replace('.', ',')}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
