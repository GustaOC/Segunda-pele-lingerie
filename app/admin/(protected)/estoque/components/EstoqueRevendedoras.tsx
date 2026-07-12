"use client"

import { Button } from "@/components/ui/button"
import { Playfair_Display, Inter } from "next/font/google"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Loader2, Package, ShoppingCart, Trash2, X, RefreshCw, Plus, ArrowLeft, Printer } from "lucide-react"
import PrintPdfModal from "./PrintPdfModal"

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-playfair" })
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-inter" })


type KitItem = {
  id: string
  product_id: string
  product_name: string
  sku: string
  size: string
  color: string
  quantity: number
  price: number
  originalQuantity?: number
}

type Reseller = {
  id: string
  name: string
  promoter_id: string
}

export default function EstoqueRevendedoras() {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const supabase = createClient()

  // Selectors state
  const [promoters, setPromoters] = useState<any[]>([])
  const [selectedPromoterId, setSelectedPromoterId] = useState("")

  const [currentUser, setCurrentUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string>("")

  
  const [resellers, setResellers] = useState<Reseller[]>([])
  const [selectedResellerId, setSelectedResellerId] = useState("")

  // Inventory state
  const [resellerInventory, setResellerInventory] = useState<any[]>([])
  const [resellerKits, setResellerKits] = useState<any[]>([])

  // Modal State for Transfers
  const [isTransferKitModalOpen, setIsTransferKitModalOpen] = useState(false)
  const [isTransferPieceModalOpen, setIsTransferPieceModalOpen] = useState(false)
  
  // Data for Modals
  const [promoterKits, setPromoterKits] = useState<any[]>([])
  const [promoterInventory, setPromoterInventory] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  
  const [transferKitId, setTransferKitId] = useState("")
  const [transferPieceId, setTransferPieceId] = useState("")
  const [transferQuantity, setTransferQuantity] = useState(1)

  // Print PDF Modal State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false)
  const [printKit, setPrintKit] = useState<any>(null)

  // Edit Kit State
  const [isEditKitModalOpen, setIsEditKitModalOpen] = useState(false)
  const [editingKitId, setEditingKitId] = useState("")
  const [editKitName, setEditKitName] = useState("")
  const [editKitPeriod, setEditKitPeriod] = useState("")
  const [editKitItems, setEditKitItems] = useState<KitItem[]>([])
  const [isKitLocked, setIsKitLocked] = useState(false)
  const [addQuantity, setAddQuantity] = useState(1)
  const [selectedInvId, setSelectedInvId] = useState("")

  const selectedInvObj = promoterInventory.find(i => i.id === selectedInvId)
  const inCartQty = editKitItems.filter(item => item.product_id === selectedInvObj?.product_id && item.size === selectedInvObj?.size && item.color === selectedInvObj?.color).reduce((sum, item) => sum + item.quantity, 0)
  const maxAvailable = selectedInvObj ? selectedInvObj.quantity - inCartQty : 0


  const fetchPromoters = async () => {
    setLoading(true)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      let currentRole = ""
      if (session) {
        setCurrentUser(session.user)
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
        currentRole = profile?.role || session.user.user_metadata?.role || ""
        setUserRole(currentRole)
      }

      const res = await fetch('/api/admin/user')
      const usersRes = await res.json()
      
      if (usersRes.data) {
        let promotersList = usersRes.data.filter((u: any) => ['CONSULTANT', 'PROMOTOR', 'ADMIN'].includes(u.role))
        
        if (currentRole === 'PROMOTOR' || currentRole === 'CONSULTANT') {
           promotersList = promotersList.filter((u: any) => u.id === session?.user.id)
           if (promotersList.length > 0) {
             setSelectedPromoterId(promotersList[0].id)
           }
        }
        
        setPromoters(promotersList)
      }
    } catch (e) {
      console.error(e)
    }

    const { data: prodData } = await supabase.from('products').select('*')
    if (prodData) setProducts(prodData)
    setLoading(false)
  }

  const fetchResellers = async (promoterId: string) => {
    setLoading(true)
    const { data } = await supabase.from('resellers').select('*').eq('promoter_id', promoterId).order('name')
    setResellers(data || [])
    setSelectedResellerId("")
    setResellerInventory([])
    setResellerKits([])
    setLoading(false)
  }

  const fetchResellerData = async (resellerId: string) => {
    setLoading(true)
    // Fetch loose pieces
    const { data: invData } = await supabase.from('reseller_inventory').select('*').eq('reseller_id', resellerId)
    if (invData) {
      const mappedInv = invData.map((inv: any) => {
        const p = products.find((prod: any) => prod.id === inv.product_id)
        return {
          ...inv,
          product_name: p ? p.name : 'Desconhecido',
          sku: p ? p.sku : '-'
        }
      })
      setResellerInventory(mappedInv)
    }

    // Fetch kits
    const { data: kitsData } = await supabase.from('promoter_kits').select('*, items:promoter_kit_items(*)').eq('reseller_id', resellerId).order('created_at', { ascending: false })
    if (kitsData) {
      const mappedKits = kitsData.map((kit: any) => ({
        ...kit,
        items: (kit.items || []).map((item: any) => {
          const p = products.find((prod: any) => prod.id === item.product_id)
          return {
            ...item,
            product_name: p ? p.name : 'Desconhecido',
            sku: p ? p.sku : '-',
            price: p ? (p.resale_price || p.price || 0) : 0
          }
        })
      }))
      setResellerKits(mappedKits)
    }
    setLoading(false)
  }

  const fetchPromoterAvailableData = async (promoterId: string) => {
    // kits without a reseller_id
    const { data: pKits } = await supabase.from('promoter_kits').select('*, items:promoter_kit_items(*)').eq('promoter_id', promoterId).is('reseller_id', null)
    if (pKits) setPromoterKits(pKits)
      
    // loose pieces with quantity > 0
    const { data: pInv } = await supabase.from('promoter_inventory').select('*').eq('promoter_id', promoterId).gt('quantity', 0)
    if (pInv) {
        const mapped = pInv.map((inv: any) => {
            const p = products.find((prod: any) => prod.id === inv.product_id)
            return {
                ...inv,
                product_name: p ? p.name : 'Desconhecido'
            }
        })
        setPromoterInventory(mapped)
    }
  }

  useEffect(() => {
    fetchPromoters()
  }, [])

  useEffect(() => {
    if (selectedPromoterId) {
      fetchResellers(selectedPromoterId)
      fetchPromoterAvailableData(selectedPromoterId)
    }
  }, [selectedPromoterId])

  useEffect(() => {
    if (selectedResellerId) {
      fetchResellerData(selectedResellerId)
    }
  }, [selectedResellerId])
  
  

  const handleEditKit = (kit: any) => {
    const ONE_HOUR = 60 * 60 * 1000
    const kitDate = kit.updated_at || kit.created_at
    const kitAge = Date.now() - new Date(kitDate).getTime()
    
    // Admin has no restrictions.
    // Promoter can only add pieces, so we lock original items ALWAYS.
    const isPromoter = userRole !== 'ADMIN'
    setIsKitLocked(isPromoter) // We use isKitLocked to mean "restricted to adding only"

    if (isPromoter && kitAge > ONE_HOUR) {
      alert("O prazo de 1 hora para editar este kit expirou.")
      return
    }

    setEditKitName(kit.name)
    setEditingKitId(kit.id)
    setEditKitPeriod(kit.period || "")
    const mappedItems = (kit.items || []).map((item: any) => {
      const p = products.find((prod: any) => prod.id === item.product_id)
      return {
        id: Math.random().toString(36).substr(2, 9),
        product_id: item.product_id,
        product_name: p ? p.name : 'Desconhecido',
        sku: p ? p.sku : '-',
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        price: p ? p.price : 0,
        originalQuantity: item.quantity
      }
    })
    setEditKitItems(mappedItems)
    setIsEditKitModalOpen(true)
  }

  const handleAddItemToEdit = () => {
    if (!selectedInvObj) return
    if (addQuantity <= 0 || addQuantity > maxAvailable) {
      alert("Quantidade inválida ou maior que o disponível no estoque do promotor.")
      return
    }

    const newItem: KitItem = {
      id: Math.random().toString(36).substr(2, 9),
      product_id: selectedInvObj.product_id,
      product_name: selectedInvObj.product_name,
      sku: selectedInvObj.sku || '-',
      size: selectedInvObj.size,
      color: selectedInvObj.color,
      quantity: addQuantity,
      price: products.find(p => p.id === selectedInvObj.product_id)?.price || 0
    }

    setEditKitItems([...editKitItems, newItem])
    setSelectedInvId("")
    setAddQuantity(1)
  }

  const handleRemoveItemFromEdit = (id: string) => {
    if (isKitLocked) {
      const item = editKitItems.find(i => i.id === id)
      if (item && item.originalQuantity && item.originalQuantity > 0) {
        alert("Você não pode remover itens originais deste kit após 1 hora da criação.")
        return
      }
    }
    setEditKitItems(editKitItems.filter(item => item.id !== id))
  }

  const handleDecrementItemFromEdit = (id: string) => {
    setEditKitItems(editKitItems.map(item => {
      if (item.id === id) {
        if (isKitLocked && item.originalQuantity && item.quantity <= item.originalQuantity) {
            alert("Você não pode diminuir a quantidade de itens originais deste kit após 1 hora da criação.")
            return item
        }
        return { ...item, quantity: item.quantity - 1 }
      }
      return item
    }).filter(item => item.quantity > 0))
  }

  const handleIncrementItemFromEdit = (id: string) => {
    let hasError = false;
    const newItems = editKitItems.map(item => {
      if (item.id === id) {
        const neededFromLoose = item.quantity + 1 - (item.originalQuantity || 0);
        if (neededFromLoose > 0) {
          const invItem = promoterInventory.find((i: any) => 
            i.product_id === item.product_id && 
            i.size === item.size && 
            i.color === item.color && 
            (i.period || 'null') === (editKitPeriod || 'null')
          )
          const maxAvailable = invItem ? invItem.quantity : 0;
          
          if (neededFromLoose > maxAvailable) {
            hasError = true;
            alert(`Estoque insuficiente no promotor para o produto ${item.product_name}.`);
            return item;
          }
        }
        return { ...item, quantity: item.quantity + 1 }
      }
      return item
    });

    if (!hasError) {
      setEditKitItems(newItems)
    }
  }

  const handleSaveEditKit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editKitName.trim()) {
      return alert("Dê um nome ao Kit.")
    }
    if (editKitItems.length === 0) {
      return alert("O Kit precisa ter pelo menos 1 peça.")
    }
    if (!editKitPeriod) {
      return alert("Selecione um período para o kit.")
    }

    setSubmitting(true)
    try {
      const totalPrice = editKitItems.reduce((acc, item) => acc + (item.price * item.quantity), 0)

      const groupedItems = editKitItems.reduce((acc, item) => {
        const key = `${item.product_id}_${item.size}_${item.color}`
        if (!acc[key]) acc[key] = { ...item }
        else acc[key].quantity += item.quantity
        return acc
      }, {} as Record<string, KitItem>)

      const { data: kitData } = await supabase.from('promoter_kits').select('period').eq('id', editingKitId).single()
      const oldPeriod = kitData?.period

      const { data: oldItems } = await supabase.from('promoter_kit_items').select('*').eq('kit_id', editingKitId)
      
      // 1. Restaurar os itens antigos para o estoque do promotor
      if (oldItems) {
        for (const old of oldItems) {
          let query = supabase.from('promoter_inventory').select('*')
            .eq('promoter_id', selectedPromoterId).eq('product_id', old.product_id)
            .eq('size', old.size).eq('color', old.color)

          if (oldPeriod && oldPeriod !== 'null') query = query.eq('period', oldPeriod)
          else query = query.is('period', null)

          const { data: invRows } = await query.limit(1)
          const invRow = invRows && invRows.length > 0 ? invRows[0] : null
          
          if (invRow) {
            await supabase.from('promoter_inventory').update({ quantity: invRow.quantity + old.quantity }).eq('id', invRow.id)
          } else {
            await supabase.from('promoter_inventory').insert({
              promoter_id: selectedPromoterId, product_id: old.product_id, size: old.size, color: old.color, quantity: old.quantity, period: oldPeriod && oldPeriod !== 'null' ? oldPeriod : null
            })
          }
        }
      }

      // 2. Apagar itens antigos
      await supabase.from('promoter_kit_items').delete().eq('kit_id', editingKitId)

      // 3. Checar estoque após restauração
      const { data: freshInv } = await supabase.from('promoter_inventory').select('*').eq('promoter_id', selectedPromoterId)
      
      for (const key of Object.keys(groupedItems)) {
        const item = groupedItems[key]
        const invItem = freshInv?.find(i => i.product_id === item.product_id && i.size === item.size && i.color === item.color && (i.period || 'null') === (editKitPeriod || 'null'))
        if (!invItem || invItem.quantity < item.quantity) {
           alert(`Estoque insuficiente no promotor para ${item.product_name}. A alteração foi desfeita, o kit não pode ser salvo assim.`)
           setSubmitting(false)
           return
        }
      }

      await supabase.from('promoter_kits').update({ name: editKitName, total_price: totalPrice, period: editKitPeriod && editKitPeriod !== 'null' ? editKitPeriod : null }).eq('id', editingKitId)

      for (const key of Object.keys(groupedItems)) {
        const item = groupedItems[key]
        await supabase.from('promoter_kit_items').insert({
          kit_id: editingKitId, product_id: item.product_id, size: item.size, color: item.color, quantity: item.quantity
        })
        
        const invItem = freshInv?.find(i => i.product_id === item.product_id && i.size === item.size && i.color === item.color && (i.period || 'null') === (editKitPeriod || 'null'))
        if (invItem) {
          await supabase.from('promoter_inventory').update({ quantity: invItem.quantity - item.quantity }).eq('id', invItem.id)
          
          await supabase.from('inventory_transactions').insert({
created_by: (await supabase.auth.getSession()).data.session?.user?.id,
            type: 'TRANSFER_RESELLER',
            product_id: item.product_id,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
            promoter_id: selectedPromoterId,
            notes: `Transferência para Revendedora: Kit ${editKitName}`
          })
        }
      }

      alert("Kit atualizado com sucesso!")
      setIsEditKitModalOpen(false)
      fetchResellerData(selectedResellerId)
      fetchPromoterAvailableData(selectedPromoterId)
    } catch (err: any) {
      console.error(err)
      alert("Erro ao editar kit: " + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleTransferKit = async () => {
      if (!transferKitId || !selectedResellerId) return alert("Selecione um Kit.")
      setSubmitting(true)
      try {
          const { error } = await supabase.from('promoter_kits').update({ reseller_id: selectedResellerId }).eq('id', transferKitId)
          if (error) throw error
          alert("Kit transferido com sucesso!")
          setIsTransferKitModalOpen(false)
          setTransferKitId("")
          fetchResellerData(selectedResellerId)
          fetchPromoterAvailableData(selectedPromoterId)
      } catch (err: any) {
          alert(err.message)
      } finally {
          setSubmitting(false)
      }
  }
  
  // Funcao de transferencia de pecas removida a pedido do usuario
  return (
    <div className="w-full">
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: "var(--font-playfair)" }}>
              Estoque Revendedoras
            </h1>
          </div>
          <p className="text-slate-500 mt-1">Gerencie e transfira o estoque dos promotores para as suas revendedoras.</p>
        </div>
        <div className="flex flex-wrap gap-3">
              <Button 
                disabled={!selectedResellerId}
                onClick={() => setIsTransferKitModalOpen(true)}
                className="bg-brand-plum hover:bg-brand-rose text-white rounded-full px-6 shadow-md transition-colors"
              >
                <ShoppingCart className="w-4 h-4 mr-2" /> Transferir Kit
              </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <label className="block text-sm font-bold text-slate-700 mb-2">1. Selecione o Promotor Responsável</label>
<select
              disabled={userRole === 'PROMOTOR' || userRole === 'CONSULTANT'}
              value={selectedPromoterId}
              onChange={(e) => setSelectedPromoterId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum text-sm disabled:opacity-50"
            >
              <option value="" disabled>Selecione um promotor...</option>
              {promoters.map(p => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
          </div>
          
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <label className="block text-sm font-bold text-slate-700 mb-2">2. Selecione a Revendedora</label>
            <select
              disabled={!selectedPromoterId || loading}
              value={selectedResellerId}
              onChange={(e) => setSelectedResellerId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum text-sm disabled:opacity-50"
            >
              <option value="" disabled>Selecione a revendedora...</option>
              {resellers.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
        </div>

        {loading && <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-brand-plum" /></div>}

        {!loading && selectedResellerId && (
          <div className="space-y-8">
            {/* Secao de Kits */}
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-4 font-playfair flex items-center">
                <ShoppingCart className="w-5 h-5 mr-2 text-brand-plum" /> Kits com a Revendedora
              </h2>
              {resellerKits.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center text-slate-500 shadow-sm border border-slate-200">
                  Nenhum kit transferido para esta revendedora.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {resellerKits.map(kit => (
                    <div key={kit.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-bold text-slate-800 text-lg">{kit.name}</h3>
                        <div className="flex gap-2 items-center">
                          {userRole === 'ADMIN' && (
                            <button onClick={() => { setPrintKit(kit); setIsPrintModalOpen(true); }} className="text-slate-400 hover:text-brand-plum transition-colors p-1.5 bg-slate-50 rounded-full hover:bg-brand-plum/10" title="Imprimir Cobrança / Fechamento">
                              <Printer className="w-4 h-4" />
                            </button>
                          )}
                          {(userRole === 'ADMIN' || (Date.now() - new Date(kit.updated_at || kit.created_at).getTime() <= 3600000)) && (
                            <button onClick={() => handleEditKit(kit)} className="text-slate-400 hover:text-brand-plum transition-colors p-1.5 bg-slate-50 rounded-full hover:bg-brand-plum/10" title="Editar Kit">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                            </button>
                          )}
                          <div className="text-brand-plum font-bold bg-brand-plum/10 px-3 py-1 rounded-full text-sm">
                            R$ {Number(kit.total_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                      </div>
                      <div className="mb-4">
                        <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-1 rounded">
                          Período: {kit.period && kit.period !== 'null' ? kit.period : 'Padrão'}
                        </span>
                      </div>
                      <div className="space-y-2 mb-4">
                        {kit.items.map((item: any) => (
                          <div key={item.id} className="text-sm text-slate-600 flex justify-between bg-slate-50 p-2 rounded-lg">
                            <span>{item.quantity}x {item.product_name}</span>
                            <span className="font-medium">{item.size} | {item.color}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Secao de Pecas Soltas removida a pedido do usuario */}
          </div>
        )}
      </div>
        
        {/* Modals para Transferencia */}
        {isTransferKitModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                <div className="bg-white rounded-3xl w-full max-w-md shadow-xl overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center">
                            <ShoppingCart className="w-5 h-5 mr-2 text-brand-plum" />
                            Transferir Kit
                        </h2>
                        <button onClick={() => setIsTransferKitModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="p-6 space-y-4">
                        <p className="text-sm text-slate-500">Selecione o kit do promotor para transferir à revendedora.</p>
                        <div>
                            <select
                                value={transferKitId}
                                onChange={(e) => setTransferKitId(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum text-sm"
                            >
                                <option value="" disabled>Selecione um Kit...</option>
                                {promoterKits.map(kit => (
                                    <option key={kit.id} value={kit.id}>{kit.name} (Período: {kit.period && kit.period !== 'null' ? kit.period : 'Padrão'}) - R$ {kit.total_price}</option>
                                ))}
                            </select>
                        </div>
                        <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                            <Button variant="ghost" onClick={() => setIsTransferKitModalOpen(false)}>Cancelar</Button>
                            <Button disabled={submitting || !transferKitId} onClick={handleTransferKit} className="bg-brand-plum text-white rounded-xl">
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Transferir"}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        )}
        
        
        {/* Modal Editar Kit */}
        {isEditKitModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-xl overflow-hidden my-8">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
                  <h2 className="text-xl font-bold text-slate-800 flex items-center">
                      <ShoppingCart className="w-5 h-5 mr-2 text-brand-plum" />
                      Editar Kit da Revendedora
                  </h2>
                  <button onClick={() => setIsEditKitModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                      <X className="w-5 h-5" />
                  </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Nome do Kit</label>
                    <input type="text" disabled={isKitLocked} value={editKitName}
                      onChange={(e) => setEditKitName(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:border-brand-plum"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Período</label>
                    <select disabled={isKitLocked} value={editKitPeriod}
                      onChange={(e) => {
                        setEditKitPeriod(e.target.value)
                        setEditKitItems([])
                        setSelectedInvId("")
                      }}
                      className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:border-brand-plum"
                    >
                      <option value="" disabled>Selecione um período...</option>
                      {Array.from(new Set([...promoterInventory.map(i => i.period || 'null'), editKitPeriod])).filter(Boolean).map(p => (
                        <option key={p} value={p}>{p === 'null' ? 'Período Padrão' : p}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={`border border-slate-200 rounded-xl p-5 space-y-4 ${editKitPeriod ? 'bg-slate-50' : 'bg-slate-100 opacity-50 pointer-events-none'}`}>
                  <h3 className="font-bold text-slate-700 text-sm">Adicionar Peças do Promotor</h3>
                  <div>
                    <select
                      value={selectedInvId}
                      onChange={(e) => setSelectedInvId(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-brand-plum text-sm"
                    >
                      <option value="" disabled>Selecione uma peça...</option>
                      {promoterInventory.filter(inv => (inv.period || 'null') === (editKitPeriod || 'null')).map(inv => (
                        <option key={inv.id} value={inv.id}>
                          {inv.product_name} - {inv.color} ({inv.size}) - {inv.quantity} disp.
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-slate-500 mb-1">Qtd.</label>
                      <input
                        type="number"
                        min="1"
                        max={maxAvailable}
                        value={addQuantity}
                        onChange={(e) => setAddQuantity(Number(e.target.value))}
                        disabled={!selectedInvId || maxAvailable === 0}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-brand-plum text-sm"
                      />
                    </div>
                    <Button type="button" onClick={handleAddItemToEdit} disabled={!selectedInvId || maxAvailable === 0} className="bg-brand-plum hover:bg-brand-rose text-white h-[38px]">
                      <Plus className="w-4 h-4 mr-1" /> Add
                    </Button>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-slate-200 bg-slate-50 font-bold text-slate-800">Itens no Kit</div>
                  <div className="p-4 max-h-60 overflow-y-auto space-y-2 bg-white">
                    {editKitItems.length === 0 ? <p className="text-sm text-slate-500 text-center">Kit vazio.</p> : editKitItems.map(item => (
                      <div key={item.id} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <div>
                          <p className="text-sm font-bold text-slate-800">{item.product_name}</p>
                          <div className="flex gap-2 mt-1">
                            <span className="text-xs bg-white px-2 rounded border border-slate-200">{item.color}</span>
                            <span className="text-xs bg-slate-800 text-white font-bold px-2 rounded">{item.size}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-slate-700">{item.quantity}x</span>
                          <div className="flex flex-col gap-1 border-l border-slate-200 pl-3">
                            <button onClick={() => handleIncrementItemFromEdit(item.id)} className="text-slate-400 hover:text-green-500 p-1"><Plus className="w-3 h-3" /></button>
                            {(!isKitLocked || !item.originalQuantity || item.quantity > item.originalQuantity) && (
                              <button onClick={() => handleDecrementItemFromEdit(item.id)} className="text-slate-400 hover:text-orange-500 p-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4"></path></svg></button>
                            )}
                            {(!isKitLocked || !item.originalQuantity || item.originalQuantity === 0) && (
                              <button onClick={() => handleRemoveItemFromEdit(item.id)} className="text-slate-400 hover:text-red-500 p-1"><Trash2 className="w-3 h-3" /></button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <Button variant="ghost" onClick={() => setIsEditKitModalOpen(false)}>Cancelar</Button>
                  <Button onClick={handleSaveEditKit} disabled={submitting} className="bg-brand-plum text-white rounded-xl">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar Edição"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Modal de transferencia de pecas removido */}

        {/* Print PDF Modal */}
        {isPrintModalOpen && printKit && (
          <PrintPdfModal 
            isOpen={isPrintModalOpen} 
            onClose={() => { setIsPrintModalOpen(false); setPrintKit(null); }} 
            kit={printKit}
            reseller={resellers.find(r => r.id === selectedResellerId)}
            promoter={promoters.find(p => p.id === selectedPromoterId)}
          />
        )}
      </div>
  )
}
