"use client"

import { Button } from "@/components/ui/button"
import { Playfair_Display, Inter } from "next/font/google"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Plus, ArrowRight, Package, Trash2, ArrowLeft } from "lucide-react"
import Link from "next/link"

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-playfair" })
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-inter" })

type PromoterInventoryRow = {
  id: string
  product_id: string
  product_name: string
  size: string
  color: string
  quantity: number
  price?: number
  sku?: string
  period?: string
}

type KitItem = {
  id: string
  inventory_id: string
  product_id: string
  product_name: string
  sku: string
  size: string
  color: string
  quantity: number
  price: number
  originalQuantity?: number
}

type Kit = {
  id: string
  name: string
  total_price: number
  created_at: string
  period?: string
  items?: KitItem[]
}


const isPeriodExpired = (period: string | null | undefined) => {
  if (!period || period === 'null' || period === 'Sem Período Registrado') return false;
  
  const match = period.match(/a\s+(\d{2})\/(\d{2})\/(\d{4})/);
  if (match) {
    const [_, day, month, year] = match;
    const endDate = new Date(Number(year), Number(month) - 1, Number(day), 23, 59, 59);
    return new Date() > endDate;
  }
  return false;
};

export default function KitsPromotoraPage() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [inventory, setInventory] = useState<PromoterInventoryRow[]>([])
  const [kits, setKits] = useState<Kit[]>([])
  
  // Kit Creation State
  const [isCreatingKit, setIsCreatingKit] = useState(false)
  const [kitName, setKitName] = useState("")
  const [kitItems, setKitItems] = useState<KitItem[]>([])
  const [kitMultiplier, setKitMultiplier] = useState(1)
  const [editingKitId, setEditingKitId] = useState<string | null>(null)
  const [kitPeriod, setKitPeriod] = useState("")
  const [availablePeriods, setAvailablePeriods] = useState<string[]>([])
  
  // Item Selection
  const [selectedInvId, setSelectedInvId] = useState("")
  const [addQuantity, setAddQuantity] = useState(1)
  
  const [submitting, setSubmitting] = useState(false)

  const supabase = createClient()

  const fetchData = async () => {
    setLoading(true)
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    setUser(session.user)

    // 1. Fetch Promoter Inventory & Products & User Role
    const [prodRes, invRes, kitsRes, userRes] = await Promise.all([
      supabase.from('products').select('*, inventory(quantity)'),
      supabase.from('promoter_inventory').select('*').eq('promoter_id', session.user.id).gt('quantity', 0),
      supabase.from('promoter_kits').select('*, items:promoter_kit_items(*)').eq('promoter_id', session.user.id).is('reseller_id', null).order('created_at', { ascending: false }),
      supabase.from('users').select('role').eq('id', session.user.id).single()
    ])

    if (userRes.data) {
      setIsAdmin(userRes.data.role === 'ADMIN')
    }

    const products = prodRes.data || []
    
    if (invRes.data) {
      const mappedInv = invRes.data.filter(inv => !isPeriodExpired(inv.period)).map(inv => {
        const p = products.find(prod => prod.id === inv.product_id)
        return {
          ...inv,
          product_name: p ? p.name : 'Produto Desconhecido',
          sku: p ? p.sku : '-',
          price: p ? p.price : 0
        }
      })
      setInventory(mappedInv)
      const periods = Array.from(new Set(mappedInv.map(i => i.period || 'null')))
      setAvailablePeriods(periods)
    }

    if (kitsRes.data) {
      // Map products onto kit items for display
      const mappedKits = kitsRes.data.filter((kit: any) => !isPeriodExpired(kit.period)).map((kit: any) => ({
        ...kit,
        items: (kit.items || []).map((item: any) => {
          const p = products.find((prod: any) => prod.id === item.product_id)
          return {
            ...item,
            product_name: p ? p.name : 'Produto Desconhecido',
            sku: p ? p.sku : '-',
            price: p ? p.price : 0,
          }
        })
      }))
      setKits(mappedKits)
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const selectedInvObj = inventory.find(i => i.id === selectedInvId)
  
  // Calculate how many of the selected item are already in the cart
  const inCartQty = kitItems.filter(item => item.inventory_id === selectedInvId).reduce((sum, item) => sum + item.quantity, 0)
  const maxAvailable = selectedInvObj ? selectedInvObj.quantity - inCartQty : 0

  const handleAddItem = () => {
    if (!selectedInvObj) return
    if (addQuantity <= 0 || addQuantity > maxAvailable) {
      alert("Quantidade inválida ou maior que o disponível em seu estoque.")
      return
    }

    const newItem: KitItem = {
      id: Math.random().toString(36).substr(2, 9),
      inventory_id: selectedInvObj.id,
      product_id: selectedInvObj.product_id,
      product_name: selectedInvObj.product_name,
      sku: selectedInvObj.sku || '-',
      size: selectedInvObj.size,
      color: selectedInvObj.color,
      quantity: addQuantity,
      price: selectedInvObj.price || 0
    }

    setKitItems([...kitItems, newItem])
    setSelectedInvId("")
    setAddQuantity(1)
  }

  // Check if current editing kit is locked for non-admins (older than 1 hour)
  const editingKitObj = editingKitId ? kits.find(k => k.id === editingKitId) : null
  const isEditingLocked = false

  const handleRemoveItem = (id: string) => {
    const item = kitItems.find(i => i.id === id)
    if (isEditingLocked && item && item.originalQuantity !== undefined) {
      alert("Você não pode remover itens que já estavam neste kit. Após 1 hora, só é possível adicionar novas peças.")
      return
    }
    setKitItems(kitItems.filter(item => item.id !== id))
  }

  const handleDecrementItem = (id: string) => {
    const item = kitItems.find(i => i.id === id)
    if (!item) return
    if (isEditingLocked && item.originalQuantity !== undefined && item.quantity <= item.originalQuantity) {
      alert("Você não pode diminuir a quantidade de peças originais deste kit após 1 hora.")
      return
    }
    setKitItems(kitItems.map(item => {
      if (item.id === id) {
        return { ...item, quantity: item.quantity - 1 }
      }
      return item
    }).filter(item => item.quantity > 0))
  }

  const handleEditKit = (kit: Kit) => {
    setKitName(kit.name)
    setEditingKitId(kit.id)
    setKitMultiplier(1)
    
    const mappedItems = (kit.items || []).map(item => {
      // Find matching inventory to get the inventory_id
      const invMatch = inventory.find(i => i.product_id === item.product_id && i.size === item.size && i.color === item.color)
      return {
        id: Math.random().toString(36).substr(2, 9),
        inventory_id: invMatch ? invMatch.id : 'unknown',
        product_id: item.product_id,
        product_name: item.product_name,
        sku: item.sku,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        price: item.price || 0,
        originalQuantity: item.quantity
      }
    })
    setKitItems(mappedItems)
    setKitPeriod(kit.period || "")
    setIsCreatingKit(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDeleteKit = async (kit: Kit) => {
    if (!confirm(`Tem certeza que deseja excluir o kit "${kit.name}"? As peças voltarão para o seu estoque.`)) return
    setLoading(true)
    try {
      const { data: items } = await supabase.from('promoter_kit_items').select('*').eq('kit_id', kit.id)
      
      if (items && items.length > 0) {
        for (const item of items) {
          let query = supabase.from('promoter_inventory').select('*')
            .eq('promoter_id', user.id).eq('product_id', item.product_id).eq('size', item.size).eq('color', item.color)
            
          if (kit.period && kit.period !== 'null') query = query.eq('period', kit.period)
          else query = query.is('period', null)

          const { data: invRows } = await query.limit(1)
            
          const invRow = invRows && invRows.length > 0 ? invRows[0] : null
            
          if (invRow) {
            await supabase.from('promoter_inventory').update({ quantity: invRow.quantity + item.quantity }).eq('id', invRow.id)
          } else {
            await supabase.from('promoter_inventory').insert({
              promoter_id: user.id, product_id: item.product_id, size: item.size, color: item.color, quantity: item.quantity, period: kit.period && kit.period !== 'null' ? kit.period : null
            })
          }
        }
      }

      await supabase.from('promoter_kit_items').delete().eq('kit_id', kit.id)
      await supabase.from('promoter_kits').delete().eq('id', kit.id)
      
      alert("Kit excluído e peças devolvidas ao estoque!")
      fetchData()
    } catch (err: any) {
      console.error(err)
      alert("Erro ao excluir: " + err.message)
      setLoading(false)
    }
  }

  const handleSaveKit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!kitName.trim()) {
      alert("Por favor, dê um nome ao Kit.")
      return
    }

    if (kitItems.length === 0) {
      alert("O Kit precisa ter pelo menos 1 peça.")
      return
    }

    if (!kitPeriod) {
      alert("Por favor, selecione um período para o kit.")
      return
    }

    setSubmitting(true)

    try {
      // Calculate total price
      const totalPrice = kitItems.reduce((acc, item) => acc + (item.price * item.quantity), 0)

      // Group identical items just in case
      const groupedItems = kitItems.reduce((acc, item) => {
        const key = `${item.product_id}_${item.size}_${item.color}`
        if (!acc[key]) acc[key] = { ...item }
        else acc[key].quantity += item.quantity
        return acc
      }, {} as Record<string, KitItem>)

      if (editingKitId) {
        // --- MODO DE EDIÇÃO ---
        const { data: kitData } = await supabase.from('promoter_kits').select('period').eq('id', editingKitId).single()
        const editKitPeriod = kitData?.period

        const { data: oldItems } = await supabase.from('promoter_kit_items').select('*').eq('kit_id', editingKitId)
        
        // 1. Restaurar os itens antigos para o estoque
        if (oldItems) {
          for (const old of oldItems) {
            let query = supabase.from('promoter_inventory').select('*')
              .eq('promoter_id', user.id).eq('product_id', old.product_id)
              .eq('size', old.size).eq('color', old.color)

            if (editKitPeriod && editKitPeriod !== 'null') query = query.eq('period', editKitPeriod)
            else query = query.is('period', null)

            const { data: invRows } = await query.limit(1)
              
            const invRow = invRows && invRows.length > 0 ? invRows[0] : null
            if (invRow) {
              await supabase.from('promoter_inventory').update({ quantity: invRow.quantity + old.quantity }).eq('id', invRow.id)
            } else {
              await supabase.from('promoter_inventory').insert({
                promoter_id: user.id, product_id: old.product_id, size: old.size, color: old.color, quantity: old.quantity, period: editKitPeriod && editKitPeriod !== 'null' ? editKitPeriod : null
              })
            }
          }
        }

        // 2. Apagar itens antigos
        await supabase.from('promoter_kit_items').delete().eq('kit_id', editingKitId)

        // 3. Checar novo estoque após a restauração e inserir os novos itens
        const { data: freshInv } = await supabase.from('promoter_inventory').select('*').eq('promoter_id', user.id)
        
        for (const key of Object.keys(groupedItems)) {
          const item = groupedItems[key]
          const invItem = freshInv?.find(i => i.product_id === item.product_id && i.size === item.size && i.color === item.color && (i.period || 'null') === (kitPeriod || 'null'))
          if (!invItem || invItem.quantity < item.quantity) {
             alert(`Estoque insuficiente após edição para ${item.product_name}. Recarregue a página e tente novamente.`)
             setSubmitting(false)
             return
          }
        }

        await supabase.from('promoter_kits').update({ name: kitName, total_price: totalPrice, period: kitPeriod && kitPeriod !== 'null' ? kitPeriod : null }).eq('id', editingKitId)

        for (const key of Object.keys(groupedItems)) {
          const item = groupedItems[key]
          await supabase.from('promoter_kit_items').insert({
            kit_id: editingKitId, product_id: item.product_id, size: item.size, color: item.color, quantity: item.quantity
          })
          
          const invItem = freshInv?.find(i => i.product_id === item.product_id && i.size === item.size && i.color === item.color && (i.period || 'null') === (kitPeriod || 'null'))
          if (invItem) {
            await supabase.from('promoter_inventory').update({ quantity: invItem.quantity - item.quantity }).eq('id', invItem.id)
          }
        }

        alert("Kit atualizado com sucesso!")
        setEditingKitId(null)
      } else {
        // --- MODO DE CRIAÇÃO (COM MULTIPLICADOR) ---
        // Check if enough inventory exists for the multiplier
        for (const key of Object.keys(groupedItems)) {
          const item = groupedItems[key]
          const invItem = inventory.find(i => i.product_id === item.product_id && i.size === item.size && i.color === item.color && (i.period || 'null') === (kitPeriod || 'null'))
          if (!invItem || invItem.quantity < (item.quantity * kitMultiplier)) {
            alert(`Estoque insuficiente para criar ${kitMultiplier} kits. Peças indisponíveis de ${item.product_name} - ${item.color} ${item.size} no período selecionado.`)
            setSubmitting(false)
            return
          }
        }

        // Loop to create multiple kits
        for (let i = 0; i < kitMultiplier; i++) {
          const finalKitName = kitMultiplier > 1 ? `${kitName} #${i + 1}` : kitName;
          
          const { data: newKit, error: kitError } = await supabase
            .from('promoter_kits')
            .insert({
              promoter_id: user.id,
              name: finalKitName,
              total_price: totalPrice,
              period: kitPeriod && kitPeriod !== 'null' ? kitPeriod : null
            })
            .select()
            .single()

          if (kitError) throw kitError

          for (const key of Object.keys(groupedItems)) {
            const item = groupedItems[key]
            await supabase.from('promoter_kit_items').insert({
              kit_id: newKit.id,
              product_id: item.product_id,
              size: item.size,
              color: item.color,
              quantity: item.quantity
            })
          }
        }

        // Update inventory ONCE after creating all kits
        for (const key of Object.keys(groupedItems)) {
          const item = groupedItems[key]
          const invItem = inventory.find(i => i.product_id === item.product_id && i.size === item.size && i.color === item.color && (i.period || 'null') === (kitPeriod || 'null'))
          if (invItem) {
            await supabase
              .from('promoter_inventory')
              .update({ quantity: invItem.quantity - (item.quantity * kitMultiplier), updated_at: new Date().toISOString() })
              .eq('id', invItem.id)
          }
        }

        alert(kitMultiplier > 1 ? `${kitMultiplier} kits montados com sucesso!` : "Kit montado com sucesso!")
      }

      setIsCreatingKit(false)
      setKitName("")
      setKitItems([])
      setKitMultiplier(1)
      setKitPeriod("")
      fetchData()
      
    } catch (err: any) {
      console.error(err)
      alert("Erro ao montar o kit: " + (err.message || "Erro desconhecido"))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-plum" />
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-slate-50 relative overflow-hidden ${inter.variable} ${playfair.variable} font-sans pb-20`}>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        
        <Link href="/admin/estoque" className="inline-flex items-center text-slate-500 hover:text-brand-plum mb-6 transition-colors font-medium">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Estoque
        </Link>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-white p-6 rounded-3xl shadow-sm border border-slate-200 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800" style={{ fontFamily: "var(--font-playfair)" }}>
              Meus Kits & Estoque
            </h1>
            <p className="text-slate-500 mt-1">Monte kits com as peças disponíveis no seu estoque.</p>
          </div>
          {!isCreatingKit && (
            <Button 
              onClick={() => {
                setIsCreatingKit(true)
                setEditingKitId(null)
                setKitName("")
                setKitItems([])
                setKitMultiplier(1)
              }} 
              className="bg-brand-plum hover:bg-brand-rose text-white rounded-full px-6 h-12 shadow-md transition-colors w-full md:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" /> 
              Montar Novo Kit
            </Button>
          )}
        </div>

        {isCreatingKit ? <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mb-12">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800" style={{ fontFamily: "var(--font-playfair)" }}>
                  {editingKitId ? "Editando Kit" : "Criar Novo Kit"}
                </h2>
                <button onClick={() => {
                  setIsCreatingKit(false)
                  setEditingKitId(null)
                }} className="text-slate-400 hover:text-slate-600 text-sm font-medium">
                  Cancelar
                </button>
              </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Seleção */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Nome do Kit</label>
                    <input
                      type="text"
                      placeholder="Ex: Kit Especial Dia das Mães"
                      value={kitName}
                      disabled={isEditingLocked}
                      onChange={(e) => setKitName(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-plum/50 disabled:opacity-50"
                    />
                  </div>
                  {!editingKitId && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Multiplicador (Quantos kits iguais?)</label>
                      <input
                        type="number"
                        min="1"
                        value={kitMultiplier}
                        onChange={(e) => setKitMultiplier(parseInt(e.target.value) || 1)}
                        className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-plum/50"
                      />
                    </div>
                  )}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Período *</label>
                    <select
                      required
                      value={kitPeriod}
                      disabled={isEditingLocked}
                      onChange={(e) => {
                        setKitPeriod(e.target.value)
                        setKitItems([]) // clear items because period changed
                        setSelectedInvId("")
                      }}
                      className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-plum/50 disabled:opacity-50"
                    >
                      <option value="" disabled>Selecione um período...</option>
                      {availablePeriods.map(p => (
                        <option key={p} value={p}>{p === 'null' ? 'Período Padrão' : p}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={`border border-slate-200 rounded-xl p-5 space-y-4 ${kitPeriod ? 'bg-slate-50/50' : 'bg-slate-100 opacity-50 pointer-events-none'}`}>
                  <h3 className="font-bold text-slate-700 text-sm">Adicionar Peças do seu Estoque</h3>
                  
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Escolha a Peça</label>
                    <select
                      value={selectedInvId}
                      onChange={(e) => setSelectedInvId(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-brand-plum text-sm"
                    >
                      <option value="" disabled>Selecione...</option>
                      {inventory.filter(inv => (inv.period || 'null') === (kitPeriod || 'null')).map(inv => (
                        <option key={inv.id} value={inv.id}>
                          {inv.product_name} - {inv.color} ({inv.size}) - {inv.quantity} disponíveis
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-slate-500 mb-1">Qtd.</label>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          max={maxAvailable}
                          value={addQuantity}
                          onChange={(e) => setAddQuantity(Number(e.target.value))}
                          disabled={!selectedInvId || maxAvailable === 0}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-brand-plum text-sm font-bold disabled:opacity-50"
                        />
                        {maxAvailable > 0 && (
                          <span className="absolute right-2 top-2 text-xs text-slate-400 font-medium">Máx: {maxAvailable}</span>
                        )}
                      </div>
                    </div>
                    <Button 
                      type="button" 
                      onClick={handleAddItem}
                      disabled={!selectedInvId || maxAvailable === 0}
                      className="bg-brand-plum hover:bg-brand-rose text-white h-[38px]"
                    >
                      <Plus className="w-4 h-4 mr-1" /> Add
                    </Button>
                  </div>
                  {maxAvailable === 0 && selectedInvId && (
                    <p className="text-xs text-red-500 font-medium">Você já adicionou todas as unidades desta peça ao kit.</p>
                  )}
                </div>
              </div>

              {/* Lista do Kit */}
              <div className="border border-slate-200 rounded-xl bg-slate-50 flex flex-col h-full min-h-[300px]">
                <div className="p-4 border-b border-slate-200 bg-white rounded-t-xl flex justify-between items-center">
                  <h3 className="font-bold text-slate-800">Itens no Kit</h3>
                  <span className="bg-brand-plum/10 text-brand-plum text-xs font-bold px-2 py-1 rounded-full">
                    {kitItems.reduce((acc, item) => acc + item.quantity, 0)} peças
                  </span>
                </div>
                
                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  {kitItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-70">
                      <Package className="w-10 h-10 mb-2" />
                      <p className="text-sm">Kit vazio.</p>
                    </div>
                  ) : (
                    kitItems.map((item) => (
                      <div key={item.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-slate-800">{item.product_name}</p>
                          <div className="flex gap-2 mt-1">
                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">{item.color}</span>
                            <span className="text-xs bg-slate-800 text-white font-bold px-2 py-0.5 rounded">{item.size}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="block font-bold text-slate-700">{item.quantity}x</span>
                            <span className="block text-xs text-slate-500">R$ {item.price?.toFixed(2).replace('.', ',')}</span>
                          </div>
                          <div className="flex flex-col gap-1 border-l border-slate-100 pl-3">
                            <button onClick={() => handleDecrementItem(item.id)} className="text-slate-400 hover:text-orange-500 transition-colors p-1 flex items-center justify-center bg-slate-50 rounded" title="Tirar 1 peça">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4"></path></svg>
                            </button>
                            <button onClick={() => handleRemoveItem(item.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1 flex items-center justify-center bg-slate-50 rounded" title="Remover item">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-4 bg-white border-t border-slate-200 rounded-b-xl">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-medium text-slate-500">Valor Total do Kit:</span>
                    <span className="text-xl font-bold text-brand-plum">
                      R$ {(kitItems.reduce((acc, item) => acc + (item.price * item.quantity), 0) * kitMultiplier).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  <Button 
                    onClick={handleSaveKit}
                    disabled={submitting || kitItems.length === 0} 
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-lg shadow-md"
                  >
                    {submitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : (editingKitId ? "Salvar Edição" : (kitMultiplier > 1 ? `Salvar ${kitMultiplier} Kits` : "Salvar Kit"))}
                  </Button>
                </div>
              </div>
            </div>
          </div>
         : null}

        {/* Exibição dos Kits */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-slate-800 mb-4" style={{ fontFamily: "var(--font-playfair)" }}>Meus Kits Prontos</h2>
          
          {kits.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center text-slate-500">
              Você ainda não montou nenhum kit.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {kits.map(kit => (
                <div key={kit.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start border-b border-slate-100 pb-4 mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-slate-800">{kit.name}</h3>
                      <p className="text-xs text-slate-400 mt-1">{new Date(kit.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="bg-brand-plum/10 text-brand-plum font-bold px-3 py-1 rounded-full text-sm whitespace-nowrap">
                        R$ {kit.total_price.toFixed(2).replace('.', ',')}
                      </span>
                      <div className="flex gap-1">
                        <button onClick={() => handleEditKit(kit)} className="text-slate-400 hover:text-brand-plum transition-colors p-1.5 bg-slate-50 rounded-full hover:bg-brand-plum/10" title="Editar">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        </button>
                        {(!(!isAdmin && (Date.now() - new Date(kit.created_at).getTime() > 3600000))) && (
                          <button onClick={() => handleDeleteKit(kit)} className="text-slate-400 hover:text-red-500 transition-colors p-1.5 bg-slate-50 rounded-full hover:bg-red-50" title="Excluir">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {kit.items?.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-700">{item.quantity}x</span>
                          <span className="text-slate-600 line-clamp-1 flex-1">{item.product_name}</span>
                        </div>
                        <div className="flex gap-1 ml-2 shrink-0">
                          <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 uppercase">{item.color}</span>
                          <span className="text-[10px] bg-slate-800 text-white px-1.5 py-0.5 rounded">{item.size}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Exibição das Peças Soltas */}
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-4" style={{ fontFamily: "var(--font-playfair)" }}>Peças Soltas no Estoque</h2>
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="px-6 py-4">Produto</th>
                  <th className="px-6 py-4">Tamanho</th>
                  <th className="px-6 py-4">Cor</th>
                  <th className="px-6 py-4 text-right">Qtd Disponível</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventory.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                      Você não tem peças soltas no seu estoque no momento.
                    </td>
                  </tr>
                ) : (
                  inventory.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-800">{item.product_name}</div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">SKU: {item.sku || '-'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center justify-center px-2 py-1 rounded bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                          {item.size}
                        </span>
                      </td>
                      <td className="px-6 py-4 capitalize text-slate-600">
                        {item.color}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold bg-slate-100 text-slate-700">
                          {item.quantity} un
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
