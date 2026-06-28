"use client"

import { Button } from "@/components/ui/button"
import { Playfair_Display, Inter } from "next/font/google"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Loader2, Package, ShoppingCart, Trash2, X, RefreshCw } from "lucide-react"

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-playfair" })
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-inter" })

type Reseller = {
  id: string
  name: string
  promoter_id: string
}

export default function EstoqueRevendedorasPage() {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  // Selectors state
  const [promoters, setPromoters] = useState<any[]>([])
  const [selectedPromoterId, setSelectedPromoterId] = useState("")
  
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

  const fetchPromoters = async () => {
    setLoading(true)
    
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
            product_name: p ? p.name : 'Desconhecido'
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
  
  const handleTransferPiece = async () => {
      if (!transferPieceId || !selectedResellerId || transferQuantity <= 0) return alert("Preencha todos os campos corretamente.")
      
      const invItem = promoterInventory.find(i => i.id === transferPieceId)
      if (!invItem) return
      
      if (transferQuantity > invItem.quantity) return alert("Quantidade maior que o estoque do promotor.")
      
      setSubmitting(true)
      try {
          // 1. Reduce promoter inventory
          await supabase.from('promoter_inventory').update({ quantity: invItem.quantity - transferQuantity }).eq('id', invItem.id)
          
          // 2. Check if reseller already has this product/size/color IN THIS PERIOD
          let rInvQuery = supabase.from('reseller_inventory').select('*')
            .eq('reseller_id', selectedResellerId).eq('product_id', invItem.product_id)
            .eq('size', invItem.size).eq('color', invItem.color)

          if (invItem.period && invItem.period !== 'null') rInvQuery = rInvQuery.eq('period', invItem.period)
          else rInvQuery = rInvQuery.is('period', null)

          const { data: rInvRow } = await rInvQuery.single()
            
          if (rInvRow) {
              await supabase.from('reseller_inventory').update({ quantity: rInvRow.quantity + transferQuantity }).eq('id', rInvRow.id)
          } else {
              await supabase.from('reseller_inventory').insert({
                  reseller_id: selectedResellerId,
                  product_id: invItem.product_id,
                  size: invItem.size,
                  color: invItem.color,
                  quantity: transferQuantity,
                  period: invItem.period && invItem.period !== 'null' ? invItem.period : null
              })
          }
          
          alert("Peças transferidas com sucesso!")
          setIsTransferPieceModalOpen(false)
          setTransferPieceId("")
          setTransferQuantity(1)
          fetchResellerData(selectedResellerId)
          fetchPromoterAvailableData(selectedPromoterId)
      } catch (err: any) {
          alert(err.message)
      } finally {
          setSubmitting(false)
      }
  }

  return (
    <div className={`min-h-screen bg-slate-50 relative overflow-hidden ${inter.variable} ${playfair.variable} font-sans pb-20`}>
      <div className="container mx-auto px-4 py-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-white p-6 rounded-3xl shadow-sm border border-slate-200 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800" style={{ fontFamily: "var(--font-playfair)" }}>
              Estoque das Revendedoras
            </h1>
            <p className="text-slate-500 mt-1">Gerencie e transfira o estoque dos promotores para as suas revendedoras.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button 
              disabled={!selectedResellerId}
              onClick={() => setIsTransferPieceModalOpen(true)}
              variant="outline"
              className="border-slate-300 text-slate-700 hover:bg-slate-100 rounded-full px-6 shadow-sm transition-colors"
            >
              <Package className="w-4 h-4 mr-2" /> Transferir Peças
            </Button>
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
              value={selectedPromoterId}
              onChange={(e) => setSelectedPromoterId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum text-sm"
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
                        <div className="text-brand-plum font-bold bg-brand-plum/10 px-3 py-1 rounded-full text-sm">
                          R$ {Number(kit.total_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                      <div className="mb-4">
                        <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-1 rounded">
                          Lote: {kit.period && kit.period !== 'null' ? kit.period : 'Padrão'}
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

            {/* Secao de Pecas Soltas */}
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-4 font-playfair flex items-center">
                <Package className="w-5 h-5 mr-2 text-brand-plum" /> Peças Soltas com a Revendedora
              </h2>
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-600 uppercase tracking-wider">
                        <th className="px-6 py-4">SKU</th>
                        <th className="px-6 py-4">Produto</th>
                        <th className="px-6 py-4">Tamanho</th>
                        <th className="px-6 py-4">Cor</th>
                        <th className="px-6 py-4">Lote</th>
                        <th className="px-6 py-4 text-right">Quantidade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {resellerInventory.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                            Nenhuma peça solta com a revendedora.
                          </td>
                        </tr>
                      ) : (
                        resellerInventory.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 text-slate-500 font-mono text-sm">{item.sku || '-'}</td>
                            <td className="px-6 py-4 font-medium text-slate-800">{item.product_name}</td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center justify-center px-2 py-1 rounded bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                                {item.size}
                              </span>
                            </td>
                            <td className="px-6 py-4 capitalize text-slate-600">{item.color}</td>
                            <td className="px-6 py-4">
                              <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-1 rounded">
                                {item.period && item.period !== 'null' ? item.period : 'Padrão'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold bg-brand-plum/10 text-brand-plum">
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
        )}
        
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
                                    <option key={kit.id} value={kit.id}>{kit.name} (Lote: {kit.period && kit.period !== 'null' ? kit.period : 'Padrão'}) - R$ {kit.total_price}</option>
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
        
        {isTransferPieceModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                <div className="bg-white rounded-3xl w-full max-w-md shadow-xl overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center">
                            <Package className="w-5 h-5 mr-2 text-brand-plum" />
                            Transferir Peças
                        </h2>
                        <button onClick={() => setIsTransferPieceModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="p-6 space-y-4">
                        <p className="text-sm text-slate-500">Mova as peças soltas do estoque do promotor para a revendedora.</p>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Peça</label>
                            <select
                                value={transferPieceId}
                                onChange={(e) => setTransferPieceId(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum text-sm"
                            >
                                <option value="" disabled>Selecione a peça...</option>
                                {promoterInventory.map(item => (
                                    <option key={item.id} value={item.id}>{item.product_name} - {item.size} - {item.color} (Lote: {item.period && item.period !== 'null' ? item.period : 'Padrão'}) ({item.quantity} disp.)</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Quantidade</label>
                            <input
                                type="number"
                                min={1}
                                max={transferPieceId ? promoterInventory.find(i => i.id === transferPieceId)?.quantity : 1}
                                value={transferQuantity}
                                onChange={(e) => setTransferQuantity(parseInt(e.target.value) || 0)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum"
                            />
                        </div>
                        <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                            <Button variant="ghost" onClick={() => setIsTransferPieceModalOpen(false)}>Cancelar</Button>
                            <Button disabled={submitting || !transferPieceId} onClick={handleTransferPiece} className="bg-brand-plum text-white rounded-xl">
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Transferir"}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  )
}
