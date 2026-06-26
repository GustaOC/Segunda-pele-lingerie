"use client"

import { Button } from "@/components/ui/button"
import { Playfair_Display, Inter } from "next/font/google"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Plus, ArrowDown, ArrowUp, Package, History } from "lucide-react"

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-playfair" })
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-inter" })

type InventoryRow = {
  id: string
  product_id: string
  product_name: string
  size: string
  color: string
  quantity: number
}

export default function EstoqueGeralPage() {
  const [loading, setLoading] = useState(true)
  const [inventory, setInventory] = useState<InventoryRow[]>([])
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  
  // Transaction state
  const [selectedProductId, setSelectedProductId] = useState("")
  const [selectedSize, setSelectedSize] = useState("M")
  const [selectedColor, setSelectedColor] = useState("")
  const [transactionType, setTransactionType] = useState("IN") // IN or MANUAL_ADJUST
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const supabase = createClient()

  const fetchInventory = async () => {
    setLoading(true)
    
    // Fetch products to map names
    const { data: prodData } = await supabase.from('products').select('id, name, sku, colors, sizes')
    if (prodData) setProducts(prodData)
    
    // Fetch inventory
    const { data: invData, error } = await supabase.from('inventory').select('*').order('created_at', { ascending: false })
    
    if (invData && prodData) {
      const mapped = invData.map(inv => {
        const p = prodData.find(p => p.id === inv.product_id)
        return {
          ...inv,
          product_name: p ? p.name : 'Produto Desconhecido',
          sku: p ? p.sku : '-'
        }
      })
      setInventory(mapped)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchInventory()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    
    if (!selectedProductId || !selectedSize || !selectedColor) {
      alert("Preencha produto, tamanho e cor.")
      setSubmitting(false)
      return
    }

    try {
      // 1. Check if row exists in inventory
      const { data: existingInv } = await supabase
        .from('inventory')
        .select('*')
        .eq('product_id', selectedProductId)
        .eq('size', selectedSize)
        .eq('color', selectedColor)
        .single()

      let newQuantity = quantity
      
      if (existingInv) {
        if (transactionType === 'IN') {
          newQuantity = existingInv.quantity + quantity
        } else {
          // MANUAL_ADJUST (set exact quantity)
          newQuantity = quantity
        }
        
        await supabase
          .from('inventory')
          .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
          .eq('id', existingInv.id)
      } else {
        if (transactionType === 'MANUAL_ADJUST') {
           newQuantity = quantity
        }
        await supabase
          .from('inventory')
          .insert({
            product_id: selectedProductId,
            size: selectedSize,
            color: selectedColor,
            quantity: newQuantity
          })
      }

      // 2. Log transaction
      const logQty = transactionType === 'MANUAL_ADJUST' ? newQuantity - (existingInv?.quantity || 0) : quantity
      
      await supabase.from('inventory_transactions').insert({
        type: transactionType,
        product_id: selectedProductId,
        size: selectedSize,
        color: selectedColor,
        quantity: logQty,
        notes: notes || (transactionType === 'IN' ? 'Entrada de mercadoria' : 'Ajuste manual')
      })

      setIsModalOpen(false)
      fetchInventory()
      
      // Reset form
      setSelectedProductId("")
      setQuantity(1)
      setNotes("")
      
    } catch (err) {
      console.error(err)
      alert("Erro ao salvar movimentação.")
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
              Estoque Geral
            </h1>
            <p className="text-slate-500 mt-1">Gerencie a entrada e saída de peças do centro de distribuição.</p>
          </div>
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="bg-brand-plum hover:bg-brand-rose text-white rounded-full px-6 shadow-md"
          >
            <Plus className="w-4 h-4 mr-2" /> Nova Movimentação
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
                  <th className="px-6 py-4">SKU</th>
                  <th className="px-6 py-4">Produto</th>
                  <th className="px-6 py-4">Tamanho</th>
                  <th className="px-6 py-4">Cor</th>
                  <th className="px-6 py-4">Quantidade Disponível</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventory.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      Nenhum item em estoque ainda. Registre uma nova movimentação.
                    </td>
                  </tr>
                ) : (
                  inventory.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-slate-500 font-mono text-sm">{item.sku || '-'}</td>
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
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                          item.quantity > 5 ? 'bg-emerald-100 text-emerald-700' :
                          item.quantity > 0 ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          <Package className="w-4 h-4 mr-2" />
                          {item.quantity} un
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Modal Nova Movimentação */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800" style={{ fontFamily: "var(--font-playfair)" }}>Registrar Movimentação</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setTransactionType('IN')}
                  className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${transactionType === 'IN' ? 'border-brand-plum bg-purple-50 text-brand-plum' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}
                >
                  <ArrowDown className="w-6 h-6 mb-2" />
                  <span className="font-semibold text-sm">Entrada (Soma)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTransactionType('MANUAL_ADJUST')}
                  className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${transactionType === 'MANUAL_ADJUST' ? 'border-brand-plum bg-purple-50 text-brand-plum' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}
                >
                  <History className="w-6 h-6 mb-2" />
                  <span className="font-semibold text-sm">Ajuste Exato</span>
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Produto *</label>
                <select
                  required
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum text-sm"
                >
                  <option value="" disabled>Selecione o produto...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.sku ? `[${p.sku}] ` : ''}{p.name}</option>
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

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Quantidade *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Observações (Opcional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Lote novo, ajuste de inventário..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum text-sm"
                />
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={submitting} className="bg-brand-plum hover:bg-brand-rose text-white rounded-xl px-6">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
