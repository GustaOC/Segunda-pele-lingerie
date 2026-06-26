"use client"

import { Button } from "@/components/ui/button"
import { Playfair_Display, Inter } from "next/font/google"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Plus, ArrowRight, User } from "lucide-react"

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-playfair" })
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-inter" })

type PromoterInventoryRow = {
  id: string
  promoter_id: string
  promoter_name: string
  product_id: string
  product_name: string
  size: string
  color: string
  quantity: number
}

export default function EstoquePromotoresPage() {
  const [loading, setLoading] = useState(true)
  const [inventory, setInventory] = useState<PromoterInventoryRow[]>([])
  const [promoters, setPromoters] = useState<any[]>([])
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  
  // Transfer state
  const [selectedPromoterId, setSelectedPromoterId] = useState("")
  const [selectedProductId, setSelectedProductId] = useState("")
  const [selectedSize, setSelectedSize] = useState("")
  const [selectedColor, setSelectedColor] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  
  const [maxQuantity, setMaxQuantity] = useState(0)

  const supabase = createClient()

  const fetchData = async () => {
    setLoading(true)
    
    const [prodRes, promRes, invRes] = await Promise.all([
      supabase.from('products').select('id, name, colors, sizes'),
      supabase.from('profiles').select('id, nome').in('role', ['CONSULTANT', 'USER', 'ADMIN']),
      supabase.from('promoter_inventory').select('*').order('updated_at', { ascending: false })
    ])

    if (prodRes.data) setProducts(prodRes.data)
    if (promRes.data) setPromoters(promRes.data)
    
    if (invRes.data && prodRes.data && promRes.data) {
      const mapped = invRes.data.map(inv => {
        const p = prodRes.data.find(p => p.id === inv.product_id)
        const pr = promRes.data.find(pr => pr.id === inv.promoter_id)
        return {
          ...inv,
          product_name: p ? p.name : 'Produto Desconhecido',
          promoter_name: pr ? pr.nome : 'Promotor Desconhecido'
        }
      })
      setInventory(mapped)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Atualizar a quantidade máxima disponível no estoque geral sempre que selecionar produto, cor e tamanho
  useEffect(() => {
    async function checkMax() {
      if (selectedProductId && selectedColor && selectedSize) {
        const { data } = await supabase
          .from('inventory')
          .select('quantity')
          .eq('product_id', selectedProductId)
          .eq('color', selectedColor)
          .eq('size', selectedSize)
          .single()
        
        setMaxQuantity(data?.quantity || 0)
        if (quantity > (data?.quantity || 0)) {
          setQuantity(data?.quantity || 0)
        }
      } else {
        setMaxQuantity(0)
      }
    }
    checkMax()
  }, [selectedProductId, selectedColor, selectedSize])

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    
    if (!selectedPromoterId || !selectedProductId || !selectedSize || !selectedColor || quantity <= 0) {
      alert("Preencha todos os campos e certifique-se que a quantidade é maior que zero.")
      setSubmitting(false)
      return
    }

    if (quantity > maxQuantity) {
      alert("Quantidade excede o estoque geral disponível.")
      setSubmitting(false)
      return
    }

    try {
      // 1. Reduzir do estoque geral
      const { data: generalInv } = await supabase
        .from('inventory')
        .select('*')
        .eq('product_id', selectedProductId)
        .eq('size', selectedSize)
        .eq('color', selectedColor)
        .single()

      if (!generalInv) throw new Error("Estoque geral não encontrado.")

      await supabase
        .from('inventory')
        .update({ quantity: generalInv.quantity - quantity, updated_at: new Date().toISOString() })
        .eq('id', generalInv.id)

      // 2. Adicionar no estoque do promotor
      const { data: existingPromInv } = await supabase
        .from('promoter_inventory')
        .select('*')
        .eq('promoter_id', selectedPromoterId)
        .eq('product_id', selectedProductId)
        .eq('size', selectedSize)
        .eq('color', selectedColor)
        .single()

      if (existingPromInv) {
        await supabase
          .from('promoter_inventory')
          .update({ quantity: existingPromInv.quantity + quantity, updated_at: new Date().toISOString() })
          .eq('id', existingPromInv.id)
      } else {
        await supabase
          .from('promoter_inventory')
          .insert({
            promoter_id: selectedPromoterId,
            product_id: selectedProductId,
            size: selectedSize,
            color: selectedColor,
            quantity: quantity
          })
      }

      // 3. Log transaction
      await supabase.from('inventory_transactions').insert({
        type: 'TRANSFER_PROMOTER',
        product_id: selectedProductId,
        size: selectedSize,
        color: selectedColor,
        quantity: quantity,
        promoter_id: selectedPromoterId,
        notes: `Transferência para promotor`
      })

      setIsModalOpen(false)
      fetchData()
      
      // Reset form
      setQuantity(1)
      
    } catch (err) {
      console.error(err)
      alert("Erro ao realizar transferência.")
    } finally {
      setSubmitting(false)
    }
  }

  const selectedProductObj = products.find(p => p.id === selectedProductId)

  return (
    <div className={`min-h-screen bg-slate-50 relative overflow-hidden ${inter.variable} ${playfair.variable} font-sans pb-20`}>
      <div className="container mx-auto px-4 py-8">
        
        <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-3xl font-bold text-slate-800" style={{ fontFamily: "var(--font-playfair)" }}>
              Estoque de Promotores
            </h1>
            <p className="text-slate-500 mt-1">Veja quais peças estão com cada promotor / revendedora.</p>
          </div>
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="bg-brand-plum hover:bg-brand-rose text-white rounded-full px-6 shadow-md"
          >
            <ArrowRight className="w-4 h-4 mr-2" /> Transferir Peças
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-brand-plum" />
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="px-6 py-4">Promotor</th>
                  <th className="px-6 py-4">Produto</th>
                  <th className="px-6 py-4">Tamanho</th>
                  <th className="px-6 py-4">Cor</th>
                  <th className="px-6 py-4">Qtd com o Promotor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventory.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      Nenhuma peça com promotores atualmente.
                    </td>
                  </tr>
                ) : (
                  inventory.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center text-slate-800 font-medium">
                          <User className="w-4 h-4 mr-2 text-brand-plum" />
                          {item.promoter_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-800">{item.product_name}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center justify-center px-2 py-1 rounded bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                          {item.size}
                        </span>
                      </td>
                      <td className="px-6 py-4 capitalize text-slate-600">
                        {item.color}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-800">{item.quantity} un</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Modal Nova Transferência */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800" style={{ fontFamily: "var(--font-playfair)" }}>Transferir do Estoque Geral</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>
            
            <form onSubmit={handleTransfer} className="p-6 space-y-4">
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Para qual Promotor? *</label>
                <select
                  required
                  value={selectedPromoterId}
                  onChange={(e) => setSelectedPromoterId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum text-sm"
                >
                  <option value="" disabled>Selecione...</option>
                  {promoters.map(p => (
                    <option key={p.id} value={p.id}>{p.nome || p.email || "Sem nome"}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Produto *</label>
                <select
                  required
                  value={selectedProductId}
                  onChange={(e) => {
                    setSelectedProductId(e.target.value)
                    setSelectedColor("")
                    setSelectedSize("")
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum text-sm"
                >
                  <option value="" disabled>Selecione o produto...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cor *</label>
                  <select
                    required
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    disabled={!selectedProductId}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum text-sm disabled:opacity-50"
                  >
                    <option value="" disabled>Selecione...</option>
                    {selectedProductObj?.colors?.map((c: any, i: number) => (
                      <option key={i} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tamanho *</label>
                  <select
                    required
                    value={selectedSize}
                    onChange={(e) => setSelectedSize(e.target.value)}
                    disabled={!selectedProductId}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum text-sm disabled:opacity-50"
                  >
                    <option value="" disabled>Selecione...</option>
                    {selectedProductObj?.sizes?.map((s: string, i: number) => (
                      <option key={i} value={s}>{s}</option>
                    )) || ["P","M","G","GG"].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800">
                Disponível no Estoque Geral: <strong>{maxQuantity} unidades</strong>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Quantidade a enviar *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={maxQuantity}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                  disabled={maxQuantity === 0}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum text-sm disabled:opacity-50"
                />
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={submitting || maxQuantity === 0} className="bg-brand-plum hover:bg-brand-rose text-white rounded-xl px-6">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Transferir Peças'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
