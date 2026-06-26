"use client"

import { Button } from "@/components/ui/button"
import { Playfair_Display, Inter } from "next/font/google"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Loader2, ShoppingCart, RefreshCw, Box, Tag } from "lucide-react"

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-playfair" })
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-inter" })

export default function VendasPage() {
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<any[]>([])
  const [promoters, setPromoters] = useState<any[]>([])
  
  // PDV State
  const [mode, setMode] = useState<'RETAIL' | 'WHOLESALE' | 'PROMOTER_SALE' | 'EXCHANGE'>('RETAIL')
  
  const [selectedProductId, setSelectedProductId] = useState("")
  const [selectedSize, setSelectedSize] = useState("")
  const [selectedColor, setSelectedColor] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState("")
  
  // For Promoter mode
  const [selectedPromoterId, setSelectedPromoterId] = useState("")

  // For Exchange mode (Troca)
  const [returnProductId, setReturnProductId] = useState("")
  const [returnSize, setReturnSize] = useState("")
  const [returnColor, setReturnColor] = useState("")
  
  const [submitting, setSubmitting] = useState(false)
  const [maxQuantity, setMaxQuantity] = useState(0)

  const supabase = createClient()

  useEffect(() => {
    async function init() {
      setLoading(true)
      const [prodRes, promRes] = await Promise.all([
        supabase.from('products').select('id, name, sku, colors, sizes'),
        supabase.from('profiles').select('id, nome').in('role', ['CONSULTANT', 'USER', 'ADMIN'])
      ])
      if (prodRes.data) setProducts(prodRes.data)
      if (promRes.data) setPromoters(promRes.data)
      setLoading(false)
    }
    init()
  }, [])

  // Check max quantity based on mode (Geral vs Promotor)
  useEffect(() => {
    async function checkMax() {
      if (!selectedProductId || !selectedColor || !selectedSize) {
        setMaxQuantity(0)
        return
      }

      if (mode === 'PROMOTER_SALE') {
        if (!selectedPromoterId) {
          setMaxQuantity(0)
          return
        }
        const { data } = await supabase
          .from('promoter_inventory')
          .select('quantity')
          .eq('product_id', selectedProductId)
          .eq('color', selectedColor)
          .eq('size', selectedSize)
          .eq('promoter_id', selectedPromoterId)
          .single()
        setMaxQuantity(data?.quantity || 0)
      } else {
        // Geral (Retail, Wholesale, Exchange)
        const { data } = await supabase
          .from('inventory')
          .select('quantity')
          .eq('product_id', selectedProductId)
          .eq('color', selectedColor)
          .eq('size', selectedSize)
          .single()
        setMaxQuantity(data?.quantity || 0)
      }
    }
    checkMax()
  }, [selectedProductId, selectedColor, selectedSize, mode, selectedPromoterId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    
    if (quantity <= 0 || quantity > maxQuantity) {
      alert("Quantidade inválida ou maior que o estoque.")
      setSubmitting(false)
      return
    }

    try {
      if (mode === 'PROMOTER_SALE') {
        // Remove from promoter_inventory
        const { data: inv } = await supabase
          .from('promoter_inventory')
          .select('id, quantity')
          .eq('promoter_id', selectedPromoterId)
          .eq('product_id', selectedProductId)
          .eq('size', selectedSize)
          .eq('color', selectedColor)
          .single()
          
        if (inv) {
          await supabase.from('promoter_inventory').update({ quantity: inv.quantity - quantity, updated_at: new Date().toISOString() }).eq('id', inv.id)
          await supabase.from('inventory_transactions').insert({
            type: 'OUT_PROMOTER', product_id: selectedProductId, size: selectedSize, color: selectedColor, quantity: -quantity, promoter_id: selectedPromoterId, notes: notes || 'Venda Promotor'
          })
        }
      } else if (mode === 'RETAIL' || mode === 'WHOLESALE') {
        // Remove from inventory
        const { data: inv } = await supabase.from('inventory').select('id, quantity').eq('product_id', selectedProductId).eq('size', selectedSize).eq('color', selectedColor).single()
        if (inv) {
          await supabase.from('inventory').update({ quantity: inv.quantity - quantity, updated_at: new Date().toISOString() }).eq('id', inv.id)
          await supabase.from('inventory_transactions').insert({
            type: mode === 'RETAIL' ? 'OUT_RETAIL' : 'OUT_WHOLESALE', product_id: selectedProductId, size: selectedSize, color: selectedColor, quantity: -quantity, notes: notes || `Venda ${mode}`
          })
        }
      } else if (mode === 'EXCHANGE') {
        // 1. Remove new piece from inventory
        const { data: invOut } = await supabase.from('inventory').select('id, quantity').eq('product_id', selectedProductId).eq('size', selectedSize).eq('color', selectedColor).single()
        if (invOut) {
          await supabase.from('inventory').update({ quantity: invOut.quantity - quantity, updated_at: new Date().toISOString() }).eq('id', invOut.id)
          await supabase.from('inventory_transactions').insert({
            type: 'EXCHANGE_OUT', product_id: selectedProductId, size: selectedSize, color: selectedColor, quantity: -quantity, notes: 'Saída por troca'
          })
        }
        
        // 2. Add returned piece to inventory
        const { data: invIn } = await supabase.from('inventory').select('id, quantity').eq('product_id', returnProductId).eq('size', returnSize).eq('color', returnColor).single()
        if (invIn) {
          await supabase.from('inventory').update({ quantity: invIn.quantity + quantity, updated_at: new Date().toISOString() }).eq('id', invIn.id)
        } else {
          await supabase.from('inventory').insert({
            product_id: returnProductId, size: returnSize, color: returnColor, quantity: quantity
          })
        }
        await supabase.from('inventory_transactions').insert({
          type: 'EXCHANGE_IN', product_id: returnProductId, size: returnSize, color: returnColor, quantity: quantity, notes: notes || 'Entrada por devolução/troca'
        })
      }

      alert("Transação registrada com sucesso!")
      
      // Reset
      setSelectedProductId("")
      setSelectedColor("")
      setSelectedSize("")
      setReturnProductId("")
      setReturnColor("")
      setReturnSize("")
      setQuantity(1)
      setNotes("")
      
    } catch (err) {
      console.error(err)
      alert("Erro ao salvar venda.")
    } finally {
      setSubmitting(false)
    }
  }

  const selectedProductObj = products.find(p => p.id === selectedProductId)
  const returnProductObj = products.find(p => p.id === returnProductId)

  if (loading) return (
    <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-plum" /></div>
  )

  return (
    <div className={`min-h-screen bg-slate-50 relative overflow-hidden ${inter.variable} ${playfair.variable} font-sans pb-20`}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        
        <div className="mb-8 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <h1 className="text-3xl font-bold text-slate-800 mb-2" style={{ fontFamily: "var(--font-playfair)" }}>
            PDV / Vendas
          </h1>
          <p className="text-slate-500">Registre saídas e trocas para dar baixa no estoque automaticamente.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          
          <div className="flex border-b border-slate-100 p-4 gap-2 overflow-x-auto">
            <button onClick={() => setMode('RETAIL')} className={`px-4 py-2 rounded-xl flex items-center font-medium text-sm transition-all whitespace-nowrap ${mode === 'RETAIL' ? 'bg-brand-plum text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
              <Tag className="w-4 h-4 mr-2" /> Venda Varejo
            </button>
            <button onClick={() => setMode('WHOLESALE')} className={`px-4 py-2 rounded-xl flex items-center font-medium text-sm transition-all whitespace-nowrap ${mode === 'WHOLESALE' ? 'bg-brand-plum text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
              <Box className="w-4 h-4 mr-2" /> Venda Atacado
            </button>
            <button onClick={() => setMode('PROMOTER_SALE')} className={`px-4 py-2 rounded-xl flex items-center font-medium text-sm transition-all whitespace-nowrap ${mode === 'PROMOTER_SALE' ? 'bg-brand-plum text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
              <ShoppingCart className="w-4 h-4 mr-2" /> Venda do Promotor
            </button>
            <button onClick={() => setMode('EXCHANGE')} className={`px-4 py-2 rounded-xl flex items-center font-medium text-sm transition-all whitespace-nowrap ${mode === 'EXCHANGE' ? 'bg-brand-plum text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
              <RefreshCw className="w-4 h-4 mr-2" /> Troca / Devolução
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            
            {mode === 'PROMOTER_SALE' && (
              <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100 mb-6">
                <label className="block text-sm font-bold text-slate-800 mb-2">Quem realizou a venda? *</label>
                <select
                  required
                  value={selectedPromoterId}
                  onChange={(e) => setSelectedPromoterId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum text-sm"
                >
                  <option value="" disabled>Selecione o Promotor/Revendedora</option>
                  {promoters.map(p => (
                    <option key={p.id} value={p.id}>{p.nome || p.email}</option>
                  ))}
                </select>
                <p className="text-xs text-purple-700 mt-2">Isso vai abater as peças do estoque pessoal deste promotor, não do estoque geral.</p>
              </div>
            )}

            {mode === 'EXCHANGE' && (
              <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 mb-6 space-y-4">
                <h3 className="font-bold text-amber-900 flex items-center"><RefreshCw className="w-4 h-4 mr-2" /> Peça que ESTÁ VOLTANDO para o estoque</h3>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Produto *</label>
                  <select required value={returnProductId} onChange={(e) => { setReturnProductId(e.target.value); setReturnColor(""); setReturnSize("") }} className="w-full bg-white border border-amber-200 rounded-xl px-4 py-3 outline-none focus:border-amber-400 text-sm">
                    <option value="" disabled>Selecione...</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.sku ? `[${p.sku}] ` : ''}{p.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Cor *</label>
                    <select required value={returnColor} onChange={(e) => setReturnColor(e.target.value)} disabled={!returnProductId} className="w-full bg-white border border-amber-200 rounded-xl px-4 py-3 outline-none focus:border-amber-400 text-sm disabled:opacity-50">
                      <option value="" disabled>Selecione...</option>
                      {returnProductObj?.colors?.map((c:any, i:number) => <option key={i} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tamanho *</label>
                    <select required value={returnSize} onChange={(e) => setReturnSize(e.target.value)} disabled={!returnProductId} className="w-full bg-white border border-amber-200 rounded-xl px-4 py-3 outline-none focus:border-amber-400 text-sm disabled:opacity-50">
                      <option value="" disabled>Selecione...</option>
                      {returnProductObj?.sizes?.map((s:any, i:number) => <option key={i} value={s}>{s}</option>) || ["P","M","G","GG"].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div>
              <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                {mode === 'EXCHANGE' ? <><ShoppingCart className="w-4 h-4 mr-2" /> Peça que ESTÁ SAINDO (Sendo levada pelo cliente)</> : 'Detalhes do Produto Vendido'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Produto *</label>
                  <select
                    required
                    value={selectedProductId}
                    onChange={(e) => { setSelectedProductId(e.target.value); setSelectedColor(""); setSelectedSize("") }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum text-sm"
                  >
                    <option value="" disabled>Selecione o produto...</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.sku ? `[${p.sku}] ` : ''}{p.name}</option>)}
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
                      {selectedProductObj?.colors?.map((c: any, i: number) => <option key={i} value={c.name}>{c.name}</option>)}
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
                      {selectedProductObj?.sizes?.map((s: string, i: number) => <option key={i} value={s}>{s}</option>) || ["P","M","G","GG"].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                {(selectedProductId && selectedColor && selectedSize && (mode !== 'PROMOTER_SALE' || selectedPromoterId)) && (
                  <div className={`p-4 rounded-xl text-sm ${maxQuantity > 0 ? 'bg-blue-50 border border-blue-100 text-blue-800' : 'bg-red-50 border border-red-100 text-red-800'}`}>
                    Estoque atual {mode === 'PROMOTER_SALE' ? 'do promotor' : 'geral'}: <strong>{maxQuantity} unidades</strong>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Quantidade *</label>
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
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Observações / Nome do Cliente (Opcional)</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum text-sm"
                  />
                </div>

              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end">
              <Button type="submit" disabled={submitting || maxQuantity === 0} className="bg-brand-plum hover:bg-brand-rose text-white rounded-xl px-8 h-12 text-base font-bold shadow-md hover:shadow-lg transition-all w-full md:w-auto">
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Finalizar Registro'}
              </Button>
            </div>
            
          </form>
        </div>

      </div>
    </div>
  )
}
