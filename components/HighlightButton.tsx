"use client"

import { Star } from "lucide-react"
import { useState } from "react"

interface HighlightButtonProps {
  productId: string
  initialHighlight?: boolean
  className?: string
}

export function HighlightButton({ productId, initialHighlight = false, className = "" }: HighlightButtonProps) {
  const [isHighlight, setIsHighlight] = useState(initialHighlight)
  const [loading, setLoading] = useState(false)

  const toggleHighlight = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (loading) return
    
    setLoading(true)
    const newStatus = !isHighlight
    
    try {
      const res = await fetch(`/api/products/${productId}/highlight`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_highlight: newStatus })
      })

      if (res.ok) {
        setIsHighlight(newStatus)
      } else {
        alert('Erro ao atualizar destaque.')
      }
    } catch (err) {
      console.error(err)
      alert('Erro ao atualizar destaque.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button 
      onClick={toggleHighlight} 
      className={`flex items-center justify-center transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      title={isHighlight ? "Remover dos destaques" : "Adicionar aos destaques"}
    >
      <Star className={`w-5 h-5 ${isHighlight ? 'fill-yellow-400 text-yellow-400' : 'text-slate-400'}`} />
    </button>
  )
}
