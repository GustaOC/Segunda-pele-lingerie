"use client"

import { useState, useEffect } from "react"
import { Heart } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export function FavoriteButton({ productId, className }: { productId: string, className?: string }) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const checkFavorite = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data } = await supabase
          .from('favorites')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('product_id', productId)
          .maybeSingle()
        
        if (data) {
          setIsFavorite(true)
        }
      }
      setIsLoading(false)
    }
    checkFavorite()
  }, [productId, supabase])

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault() // Prevents navigation if it's inside a Link
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      alert("Faça login para salvar seus favoritos!")
      router.push("/login")
      return
    }

    if (isFavorite) {
      setIsFavorite(false)
      await supabase
        .from('favorites')
        .delete()
        .eq('user_id', session.user.id)
        .eq('product_id', productId)
    } else {
      setIsFavorite(true)
      await supabase
        .from('favorites')
        .insert([{ user_id: session.user.id, product_id: productId }])
    }
  }

  if (isLoading) {
    return (
      <button disabled className={`flex items-center justify-center opacity-50 ${className}`}>
        <Heart className="w-5 h-5 text-slate-300" />
      </button>
    )
  }

  return (
    <button onClick={toggleFavorite} className={`flex items-center justify-center transition-colors ${className}`}>
      <Heart className={`w-5 h-5 ${isFavorite ? 'fill-pink-500 text-brand-rose' : 'text-slate-400 hover:text-brand-rose'}`} />
    </button>
  )
}
