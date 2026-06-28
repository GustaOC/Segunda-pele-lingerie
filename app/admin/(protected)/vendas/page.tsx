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
  const [transactionDate, setTransactionDate] = useState(() => new Date().toISOString().split('T')[0])
  
  // For Promoter mode
  const [selectedPromoterId, setSelectedPromoterId] = useState("")

  // For Exchange mode (Troca)
  const [exchangeSourceType, setExchangeSourceType] = useState<'OUT_RETAIL' | 'OUT_WHOLESALE' | 'OUT_PROMOTER' | ''>('')
  const [selectedTransactionId, setSelectedTransactionId] = useState("")
  const [recentTransactions, setRecentTransactions] = useState<any[]>([])
  const [exchangePromoterId, setExchangePromoterId] = useState("")
  const [exchangeResellerId, setExchangeResellerId] = useState("")
  const [resellers, setResellers] = useState<any[]>([])
  const [resellerInventory, setResellerInventory] = useState<any[]>([])

  const [returnProductId, setReturnProductId] = useState("")
  const [returnSize, setReturnSize] = useState("")
  const [returnColor, setReturnColor] = useState("")
  
  const [submitting, setSubmitting] = useState(false)
  const [maxQuantity, setMaxQuantity] = useState(0)

  const supabase = createClient()

  useEffect(() => {
    async function init() {
      setLoading(true)
      const [prodRes, transRes, reselRes] = await Promise.all([
        supabase.from('products').select('id, name, sku, colors, sizes'),
        supabase.from('inventory_transactions').select('*, products(id, name, sku)').in('type', ['OUT_RETAIL', 'OUT_WHOLESALE']).order('created_at', { ascending: false }).limit(200),
        supabase.from('resellers').select('*').order('name')
      ])
      
      try {
        const res = await fetch('/api/admin/user')
        const usersRes = await res.json()
        if (usersRes.data) {
          const promotersList = usersRes.data.filter((u: any) => ['CONSULTANT', 'PROMOTOR', 'ADMIN'].includes(u.role))
          setPromoters(promotersList)
        }
      } catch (e) {
        console.error(e)
      }

      if (prodRes.data) setProducts(prodRes.data)
      if (transRes.data) setRecentTransactions(transRes.data)
      if (reselRes.data) setResellers(reselRes.data)
      setLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
    if (selectedTransactionId && (exchangeSourceType === 'OUT_RETAIL' || exchangeSourceType === 'OUT_WHOLESALE')) {
      const tx = recentTransactions.find(t => t.id === selectedTransactionId)
      if (tx) {
        setReturnProductId(tx.product_id)
        setReturnColor(tx.color)
        setReturnSize(tx.size)
      }
    }
  }, [selectedTransactionId, recentTransactions, exchangeSourceType])

  useEffect(() => {
    async function fetchResellerInv() {
      if (!exchangeResellerId) {
        setResellerInventory([])
        return
      }
      const { data } = await supabase.from('reseller_inventory').select('*, products(name, sku)').eq('reseller_id', exchangeResellerId)
      if (data) setResellerInventory(data)
    }
    fetchResellerInv()
  }, [exchangeResellerId, supabase])

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

    if (mode === 'EXCHANGE' && selectedTransactionId && isExpired) {
      alert("Esta venda expirou o prazo de troca.")
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
            type: 'OUT_PROMOTER', product_id: selectedProductId, size: selectedSize, color: selectedColor, quantity: -quantity, promoter_id: selectedPromoterId, notes: notes || 'Venda Promotor', created_at: new Date(transactionDate + 'T12:00:00Z').toISOString()
          })
        }
      } else if (mode === 'RETAIL' || mode === 'WHOLESALE') {
        // Remove from inventory
        const { data: inv } = await supabase.from('inventory').select('id, quantity').eq('product_id', selectedProductId).eq('size', selectedSize).eq('color', selectedColor).single()
        if (inv) {
          await supabase.from('inventory').update({ quantity: inv.quantity - quantity, updated_at: new Date().toISOString() }).eq('id', inv.id)
          await supabase.from('inventory_transactions').insert({
            type: mode === 'RETAIL' ? 'OUT_RETAIL' : 'OUT_WHOLESALE', product_id: selectedProductId, size: selectedSize, color: selectedColor, quantity: -quantity, notes: notes || `Venda ${mode}`, created_at: new Date(transactionDate + 'T12:00:00Z').toISOString()
          })
        }
      } else if (mode === 'EXCHANGE') {
        if (exchangeSourceType === 'OUT_PROMOTER') {
          // 1. New Piece: Remove from general inventory, Add to Reseller Inventory
          const { data: invOut } = await supabase.from('inventory').select('id, quantity').eq('product_id', selectedProductId).eq('size', selectedSize).eq('color', selectedColor).single()
          if (invOut) {
            await supabase.from('inventory').update({ quantity: invOut.quantity - quantity, updated_at: new Date().toISOString() }).eq('id', invOut.id)
            await supabase.from('inventory_transactions').insert({
              type: 'EXCHANGE_OUT', product_id: selectedProductId, size: selectedSize, color: selectedColor, quantity: -quantity, notes: `Saída para Troca de Revendedora`, created_at: new Date(transactionDate + 'T12:00:00Z').toISOString()
            })
          }
          
          const { data: resInv } = await supabase.from('reseller_inventory').select('*').eq('reseller_id', exchangeResellerId).eq('product_id', selectedProductId).eq('color', selectedColor).eq('size', selectedSize).single()
          if (resInv) {
            await supabase.from('reseller_inventory').update({ quantity: resInv.quantity + quantity, updated_at: new Date().toISOString() }).eq('id', resInv.id)
          } else {
            await supabase.from('reseller_inventory').insert({
              reseller_id: exchangeResellerId, product_id: selectedProductId, color: selectedColor, size: selectedSize, quantity: quantity
            })
          }

          // 2. Returned Piece: Remove from Reseller Inventory, Add to general inventory
          const { data: resInvIn } = await supabase.from('reseller_inventory').select('*').eq('reseller_id', exchangeResellerId).eq('product_id', returnProductId).eq('color', returnColor).eq('size', returnSize).single()
          if (resInvIn) {
            await supabase.from('reseller_inventory').update({ quantity: resInvIn.quantity - quantity, updated_at: new Date().toISOString() }).eq('id', resInvIn.id)
          }

          const { data: invIn } = await supabase.from('inventory').select('id, quantity').eq('product_id', returnProductId).eq('size', returnSize).eq('color', returnColor).single()
          if (invIn) {
            await supabase.from('inventory').update({ quantity: invIn.quantity + quantity, updated_at: new Date().toISOString() }).eq('id', invIn.id)
          } else {
            await supabase.from('inventory').insert({
              product_id: returnProductId, size: returnSize, color: returnColor, quantity: quantity
            })
          }
          await supabase.from('inventory_transactions').insert({
            type: 'EXCHANGE_IN', product_id: returnProductId, size: returnSize, color: returnColor, quantity: quantity, notes: `Entrada de Troca de Revendedora`, created_at: new Date(transactionDate + 'T12:00:00Z').toISOString()
          })

        } else {
          // 1. Remove new piece from inventory
          const { data: invOut } = await supabase.from('inventory').select('id, quantity').eq('product_id', selectedProductId).eq('size', selectedSize).eq('color', selectedColor).single()
          if (invOut) {
            await supabase.from('inventory').update({ quantity: invOut.quantity - quantity, updated_at: new Date().toISOString() }).eq('id', invOut.id)
            await supabase.from('inventory_transactions').insert({
              type: 'EXCHANGE_OUT', product_id: selectedProductId, size: selectedSize, color: selectedColor, quantity: -quantity, notes: 'Saída por troca', created_at: new Date(transactionDate + 'T12:00:00Z').toISOString()
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
            type: 'EXCHANGE_IN', product_id: returnProductId, size: returnSize, color: returnColor, quantity: quantity, notes: notes || 'Entrada por devolução/troca', created_at: new Date(transactionDate + 'T12:00:00Z').toISOString()
          })
        }
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

  const selectedTx = recentTransactions.find(t => t.id === selectedTransactionId);
  let isExpired = false;
  let expiredMessage = "";

  if (selectedTx) {
    const exchangeDate = new Date(transactionDate + 'T12:00:00Z');
    const originalDate = new Date(selectedTx.created_at);
    const diffTime = exchangeDate.getTime() - originalDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
    
    if (selectedTx.type === 'OUT_RETAIL' && diffDays > 38) {
      isExpired = true;
      expiredMessage = `Esta venda de Varejo ocorreu há mais de 38 dias (${diffDays} dias atrás). O prazo para troca expirou.`;
    } else if (selectedTx.type === 'OUT_WHOLESALE' && diffDays > 30) {
      isExpired = true;
      expiredMessage = `Esta venda de Atacado ocorreu há mais de 30 dias (${diffDays} dias atrás). O prazo para troca expirou.`;
    }
  }

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
                    <option key={p.id} value={p.id}>{p.nome || p.firstName || p.email}</option>
                  ))}
                </select>
                <p className="text-xs text-purple-700 mt-2">Isso vai abater as peças do estoque pessoal deste promotor, não do estoque geral.</p>
              </div>
            )}

            {mode === 'EXCHANGE' && (
              <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 mb-6 space-y-4">
                <h3 className="font-bold text-amber-900 flex items-center"><RefreshCw className="w-4 h-4 mr-2" /> Venda Original (O que está voltando)</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
                  <label className="flex items-center space-x-2 bg-white p-3 rounded-xl border border-amber-200 cursor-pointer hover:bg-amber-50">
                    <input type="radio" name="exchangeSource" value="OUT_RETAIL" checked={exchangeSourceType === 'OUT_RETAIL'} onChange={() => {setExchangeSourceType('OUT_RETAIL'); setSelectedTransactionId('')}} className="text-amber-500 focus:ring-amber-500" />
                    <span className="text-sm font-medium">Troca do Varejo</span>
                  </label>
                  <label className="flex items-center space-x-2 bg-white p-3 rounded-xl border border-amber-200 cursor-pointer hover:bg-amber-50">
                    <input type="radio" name="exchangeSource" value="OUT_WHOLESALE" checked={exchangeSourceType === 'OUT_WHOLESALE'} onChange={() => {setExchangeSourceType('OUT_WHOLESALE'); setSelectedTransactionId('')}} className="text-amber-500 focus:ring-amber-500" />
                    <span className="text-sm font-medium">Troca do Atacado</span>
                  </label>
                  <label className="flex items-center space-x-2 bg-white p-3 rounded-xl border border-amber-200 cursor-pointer hover:bg-amber-50">
                    <input type="radio" name="exchangeSource" value="OUT_PROMOTER" checked={exchangeSourceType === 'OUT_PROMOTER'} onChange={() => {setExchangeSourceType('OUT_PROMOTER'); setSelectedTransactionId('')}} className="text-amber-500 focus:ring-amber-500" />
                    <span className="text-sm font-medium">Troca do Consignado</span>
                  </label>
                </div>

                {exchangeSourceType && exchangeSourceType !== 'OUT_PROMOTER' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Selecione a Venda *</label>
                    <select required value={selectedTransactionId} onChange={(e) => setSelectedTransactionId(e.target.value)} className="w-full bg-white border border-amber-200 rounded-xl px-4 py-3 outline-none focus:border-amber-400 text-sm">
                      <option value="" disabled>Selecione a venda anterior...</option>
                      {recentTransactions.filter(t => t.type === exchangeSourceType).map(t => {
                        const dateStr = new Date(t.created_at).toLocaleDateString('pt-BR')
                        const promoterName = t.promoter_id ? promoters.find(p => p.id === t.promoter_id)?.nome : ''
                        return (
                          <option key={t.id} value={t.id}>
                            {dateStr} - {t.products?.name} ({t.color} {t.size}) - {Math.abs(t.quantity)} un {promoterName ? `- ${promoterName}` : ''}
                          </option>
                        )
                      })}
                    </select>
                    {isExpired && (
                      <div className="mt-3 p-4 bg-red-100 text-red-800 rounded-xl text-sm font-medium border border-red-200">
                        {expiredMessage}
                      </div>
                    )}
                  </div>
                )}

                {exchangeSourceType === 'OUT_PROMOTER' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Selecione o Promotor *</label>
                      <select required value={exchangePromoterId} onChange={(e) => {setExchangePromoterId(e.target.value); setExchangeResellerId(''); setReturnProductId('');}} className="w-full bg-white border border-amber-200 rounded-xl px-4 py-3 outline-none focus:border-amber-400 text-sm">
                        <option value="" disabled>Selecione o promotor...</option>
                        {promoters.map(p => (
                          <option key={p.id} value={p.id}>{p.nome || p.firstName || p.email}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Selecione a Revendedora *</label>
                      <select required disabled={!exchangePromoterId} value={exchangeResellerId} onChange={(e) => {setExchangeResellerId(e.target.value); setReturnProductId('');}} className="w-full bg-white border border-amber-200 rounded-xl px-4 py-3 outline-none focus:border-amber-400 text-sm disabled:opacity-50">
                        <option value="" disabled>Selecione a revendedora...</option>
                        {resellers.filter(r => r.promoter_id === exchangePromoterId).map(r => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-amber-200/50">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Produto que está voltando *</label>
                  {exchangeSourceType === 'OUT_PROMOTER' ? (
                    <select required disabled={!exchangeResellerId} value={returnProductId ? `${returnProductId}|${returnColor}|${returnSize}` : ""} onChange={(e) => { 
                      const [pId, c, s] = e.target.value.split('|');
                      setReturnProductId(pId);
                      setReturnColor(c);
                      setReturnSize(s);
                    }} className="w-full bg-white border border-amber-200 rounded-xl px-4 py-3 outline-none focus:border-amber-400 text-sm disabled:opacity-50 disabled:bg-slate-100">
                      <option value="" disabled>Selecione a peça da revendedora...</option>
                      {resellerInventory.map(inv => (
                        <option key={inv.id} value={`${inv.product_id}|${inv.color}|${inv.size}`}>
                          {inv.products?.sku ? `[${inv.products?.sku}] ` : ''}{inv.products?.name} ({inv.color} {inv.size}) - Saldo: {inv.quantity} un
                        </option>
                      ))}
                    </select>
                  ) : (
                    <select required disabled={!!selectedTransactionId} value={returnProductId} onChange={(e) => { setReturnProductId(e.target.value); setReturnColor(""); setReturnSize("") }} className="w-full bg-white border border-amber-200 rounded-xl px-4 py-3 outline-none focus:border-amber-400 text-sm disabled:opacity-70 disabled:bg-slate-100">
                      <option value="" disabled>Selecione...</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.sku ? `[${p.sku}] ` : ''}{p.name}</option>)}
                    </select>
                  )}
                </div>
                
                {exchangeSourceType !== 'OUT_PROMOTER' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Cor *</label>
                      <select required disabled={!!selectedTransactionId || !returnProductId} value={returnColor} onChange={(e) => setReturnColor(e.target.value)} className="w-full bg-white border border-amber-200 rounded-xl px-4 py-3 outline-none focus:border-amber-400 text-sm disabled:opacity-70 disabled:bg-slate-100">
                        <option value="" disabled>Selecione...</option>
                        {returnProductObj?.colors?.map((c:any, i:number) => <option key={i} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Tamanho *</label>
                      <select required disabled={!!selectedTransactionId || !returnProductId} value={returnSize} onChange={(e) => setReturnSize(e.target.value)} className="w-full bg-white border border-amber-200 rounded-xl px-4 py-3 outline-none focus:border-amber-400 text-sm disabled:opacity-70 disabled:bg-slate-100">
                        <option value="" disabled>Selecione...</option>
                        {returnProductObj?.sizes?.map((s:any, i:number) => <option key={i} value={s}>{s}</option>) || ["P","M","G","GG"].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                )}
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Data da Transação *</label>
                    <input
                      type="date"
                      required
                      value={transactionDate}
                      onChange={(e) => setTransactionDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Quantidade *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max={mode === 'EXCHANGE' ? Math.min(maxQuantity, (exchangeSourceType === 'OUT_PROMOTER' && returnProductId && returnColor && returnSize ? (resellerInventory.find(i => i.product_id === returnProductId && i.color === returnColor && i.size === returnSize)?.quantity || 999) : (selectedTransactionId ? Math.abs(recentTransactions.find(t => t.id === selectedTransactionId)?.quantity || 999) : 999))) : maxQuantity}
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                      disabled={maxQuantity === 0}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum text-sm disabled:opacity-50"
                    />
                    {mode === 'EXCHANGE' && exchangeSourceType !== 'OUT_PROMOTER' && selectedTransactionId && (
                      <p className="text-xs text-amber-600 mt-1">
                        Limite da devolução: {Math.abs(recentTransactions.find(t => t.id === selectedTransactionId)?.quantity || 999)} un.
                      </p>
                    )}
                    {mode === 'EXCHANGE' && exchangeSourceType === 'OUT_PROMOTER' && returnProductId && returnColor && returnSize && (
                      <p className="text-xs text-amber-600 mt-1">
                        Limite da devolução: {resellerInventory.find(i => i.product_id === returnProductId && i.color === returnColor && i.size === returnSize)?.quantity || 999} un.
                      </p>
                    )}
                  </div>
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
              <Button type="submit" disabled={submitting || maxQuantity === 0 || isExpired} className="bg-brand-plum hover:bg-brand-rose text-white rounded-xl px-8 h-12 text-base font-bold shadow-md hover:shadow-lg transition-all w-full md:w-auto">
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Finalizar Registro'}
              </Button>
            </div>
            
          </form>
        </div>

      </div>
    </div>
  )
}
