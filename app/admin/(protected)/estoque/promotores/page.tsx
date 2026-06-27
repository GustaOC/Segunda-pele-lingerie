"use client"

import { Button } from "@/components/ui/button"
import { Playfair_Display, Inter } from "next/font/google"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Loader2, Plus, ArrowRight, User, ShoppingCart, Trash2, Package, X } from "lucide-react"

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
  sku?: string
}

type KitItem = {
  id: string
  product_id: string
  product_name: string
  sku: string
  size: string
  color: string
  quantity: number
}

export default function EstoquePromotoresPage() {
  const [loading, setLoading] = useState(true)
  const [inventory, setInventory] = useState<PromoterInventoryRow[]>([])
  const [promoters, setPromoters] = useState<any[]>([])
  const router = useRouter()
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const [isResellerModalOpen, setIsResellerModalOpen] = useState(false)
  const [resellerName, setResellerName] = useState("")
  const [resellerPromoterId, setResellerPromoterId] = useState("")
  
  // Transfer state
  const [selectedPromoterId, setSelectedPromoterId] = useState("")
  
  // Item adding state
  const [selectedProductId, setSelectedProductId] = useState("")
  const [selectedSize, setSelectedSize] = useState("")
  const [selectedColor, setSelectedColor] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [maxQuantity, setMaxQuantity] = useState(0)
  
  // Kit array
  const [kitItems, setKitItems] = useState<KitItem[]>([])

  const [submitting, setSubmitting] = useState(false)

  const supabase = createClient()

  const fetchData = async () => {
    setLoading(true)
    
    const [prodRes, invRes, usersRes] = await Promise.all([
      supabase.from('products').select('id, name, sku, colors, sizes'),
      supabase.from('promoter_inventory').select('*').order('updated_at', { ascending: false }),
      fetch('/api/admin/user').then(res => res.json())
    ])

    if (prodRes.data) setProducts(prodRes.data)
    
    let promData = []
    if (usersRes.data) {
      promData = usersRes.data.filter((u: any) => ['CONSULTANT', 'PROMOTOR', 'ADMIN', 'USER'].includes(u.role))
      setPromoters(promData)
    }
    
    if (invRes.data && prodRes.data && promData) {
      const mapped = invRes.data.map(inv => {
        const p = prodRes.data.find(p => p.id === inv.product_id)
        const pr = promData.find((pr: any) => pr.id === inv.promoter_id)
        return {
          ...inv,
          product_name: p ? p.name : 'Produto Desconhecido',
          sku: p ? p.sku : '-',
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
        
        let available = data?.quantity || 0
        
        // Subtrair o que já está no carrinho
        const inCart = kitItems.filter(item => 
          item.product_id === selectedProductId && 
          item.color === selectedColor && 
          item.size === selectedSize
        ).reduce((sum, item) => sum + item.quantity, 0)
        
        available = Math.max(0, available - inCart)
        
        setMaxQuantity(available)
        if (quantity > available) {
          setQuantity(available === 0 ? 0 : 1)
        }
      } else {
        setMaxQuantity(0)
      }
    }
    checkMax()
  }, [selectedProductId, selectedColor, selectedSize, kitItems, supabase])

  const handleAddItemToKit = () => {
    if (!selectedProductId || !selectedSize || !selectedColor || quantity <= 0) {
      alert("Preencha todos os campos do produto e certifique-se que a quantidade é maior que zero.")
      return
    }

    if (quantity > maxQuantity) {
      alert(`Você só tem mais ${maxQuantity} unidades disponíveis desse item no estoque geral.`)
      return
    }

    const prod = products.find(p => p.id === selectedProductId)

    const newItem: KitItem = {
      id: Math.random().toString(36).substr(2, 9),
      product_id: selectedProductId,
      product_name: prod?.name || 'Desconhecido',
      sku: prod?.sku || '-',
      size: selectedSize,
      color: selectedColor,
      quantity: quantity
    }

    setKitItems([...kitItems, newItem])
    
    // Reset selection inputs
    setSelectedProductId("")
    setSelectedSize("")
    setSelectedColor("")
    setQuantity(1)
  }

  const handleRemoveFromKit = (id: string) => {
    setKitItems(kitItems.filter(item => item.id !== id))
  }

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedPromoterId) {
      alert("Selecione a promotora que receberá as peças.")
      return
    }

    if (kitItems.length === 0) {
      alert("A lista está vazia. Adicione pelo menos um produto.")
      return
    }

    setSubmitting(true)

    try {
      // Processar cada item sequencialmente (ou em Promise.all, mas sequencial previne race conditions na mesma tabela se houver itens duplicados no carrinho, embora a UI limite pela qtd).
      
      // Pra garantir, vamos agrupar os itens do carrinho se o usuário adicionou a mesma coisa duas vezes em linhas diferentes
      const groupedItems = kitItems.reduce((acc, item) => {
        const key = `${item.product_id}_${item.color}_${item.size}`
        if (!acc[key]) acc[key] = { ...item }
        else acc[key].quantity += item.quantity
        return acc
      }, {} as Record<string, KitItem>)

      for (const key of Object.keys(groupedItems)) {
        const item = groupedItems[key]

        // 1. Reduzir do estoque geral
        const { data: generalInv } = await supabase
          .from('inventory')
          .select('*')
          .eq('product_id', item.product_id)
          .eq('size', item.size)
          .eq('color', item.color)
          .single()

        if (!generalInv || generalInv.quantity < item.quantity) {
          throw new Error(`Estoque insuficiente para ${item.product_name} (${item.color}, ${item.size}).`)
        }

        await supabase
          .from('inventory')
          .update({ quantity: generalInv.quantity - item.quantity, updated_at: new Date().toISOString() })
          .eq('id', generalInv.id)

        // 2. Adicionar no estoque do promotor
        const { data: existingPromInv } = await supabase
          .from('promoter_inventory')
          .select('*')
          .eq('promoter_id', selectedPromoterId)
          .eq('product_id', item.product_id)
          .eq('size', item.size)
          .eq('color', item.color)
          .single()

        if (existingPromInv) {
          await supabase
            .from('promoter_inventory')
            .update({ quantity: existingPromInv.quantity + item.quantity, updated_at: new Date().toISOString() })
            .eq('id', existingPromInv.id)
        } else {
          await supabase
            .from('promoter_inventory')
            .insert({
              promoter_id: selectedPromoterId,
              product_id: item.product_id,
              size: item.size,
              color: item.color,
              quantity: item.quantity
            })
        }

        // 3. Log transaction
        await supabase.from('inventory_transactions').insert({
          type: 'TRANSFER_PROMOTER',
          product_id: item.product_id,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          promoter_id: selectedPromoterId,
          notes: `Transferência em Lote (Admin)`
        })
      }

      setIsModalOpen(false)
      fetchData()
      
      // Reset form
      setKitItems([])
      setSelectedPromoterId("")
      
    } catch (err: any) {
      console.error(err)
      alert(err.message || "Erro ao realizar transferência.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateReseller = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resellerName || !resellerPromoterId) return alert("Preencha todos os campos")
    setSubmitting(true)
    try {
      const { error } = await supabase.from('resellers').insert({
        name: resellerName,
        promoter_id: resellerPromoterId
      })
      if (error) throw error
      alert("Revendedora cadastrada com sucesso!")
      setIsResellerModalOpen(false)
      setResellerName("")
      setResellerPromoterId("")
    } catch (err: any) {
      console.error(err)
      alert(err.message || "Erro ao cadastrar revendedora.")
    } finally {
      setSubmitting(false)
    }
  }

  const selectedProductObj = products.find(p => p.id === selectedProductId)

  return (
    <div className={`min-h-screen bg-slate-50 relative overflow-hidden ${inter.variable} ${playfair.variable} font-sans pb-20`}>
      <div className="container mx-auto px-4 py-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-white p-6 rounded-3xl shadow-sm border border-slate-200 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800" style={{ fontFamily: "var(--font-playfair)" }}>
              Estoque de Promotores
            </h1>
            <p className="text-slate-500 mt-1">Veja quais peças estão com cada promotor / revendedora.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={() => setIsResellerModalOpen(true)}
              variant="outline"
              className="border-slate-300 text-slate-700 hover:bg-slate-100 rounded-full px-6 shadow-sm transition-colors"
            >
              <User className="w-4 h-4 mr-2" /> Cadastrar Revendedora
            </Button>
            <Button 
              onClick={() => router.push('/area-promotora/kits')}
              variant="outline"
              className="border-brand-plum text-brand-plum hover:bg-brand-plum hover:text-white rounded-full px-6 shadow-md transition-colors"
            >
              <ShoppingCart className="w-4 h-4 mr-2" /> Minha Área de Kits
            </Button>
            <Button 
              onClick={() => setIsModalOpen(true)}
              className="bg-brand-plum hover:bg-brand-rose text-white rounded-full px-6 shadow-md transition-colors"
            >
              <Package className="w-4 h-4 mr-2" /> Transferir Peças
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-brand-plum" />
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-600 uppercase tracking-wider">
                    <th className="px-6 py-4">Promotor</th>
                    <th className="px-6 py-4">SKU</th>
                    <th className="px-6 py-4">Produto</th>
                    <th className="px-6 py-4">Tamanho</th>
                    <th className="px-6 py-4">Cor</th>
                    <th className="px-6 py-4 text-right">Qtd com o Promotor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inventory.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
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
        )}

      </div>

      {/* Modal Cadastro de Revendedora */}
      {isResellerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center">
                <User className="w-5 h-5 mr-2 text-brand-plum" />
                Cadastrar Revendedora
              </h2>
              <button onClick={() => setIsResellerModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateReseller} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Nome da Revendedora *</label>
                <input
                  required
                  type="text"
                  value={resellerName}
                  onChange={(e) => setResellerName(e.target.value)}
                  placeholder="Ex: Maria da Silva"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Vincular a qual Promotor? *</label>
                <select
                  required
                  value={resellerPromoterId}
                  onChange={(e) => setResellerPromoterId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum text-sm"
                >
                  <option value="" disabled>Selecione o promotor...</option>
                  {promoters.map(p => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setIsResellerModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting} className="bg-brand-plum hover:bg-brand-rose text-white rounded-xl">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  Cadastrar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Transferência em Lote */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-xl overflow-hidden my-8">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center">
                <ShoppingCart className="w-5 h-5 mr-2 text-brand-plum" />
                Transferir Peças para Promotora
              </h2>
              <button onClick={() => {
                setIsModalOpen(false)
                setKitItems([])
                setSelectedPromoterId("")
              }} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex flex-col md:flex-row h-full">
              {/* Lado Esquerdo: Adicionar Produtos */}
              <div className="w-full md:w-1/2 p-6 border-r border-slate-100 space-y-5 bg-white">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">1. Escolha a Promotora *</label>
                  <select
                    required
                    value={selectedPromoterId}
                    onChange={(e) => setSelectedPromoterId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum text-sm"
                  >
                    <option value="" disabled>Selecione a promotora...</option>
                    {promoters.map(p => (
                      <option key={p.id} value={p.id}>{p.nome}</option>
                    ))}
                  </select>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <label className="block text-sm font-bold text-slate-700 mb-4">2. Adicionar Peças à Lista</label>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Produto</label>
                      <select
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
                          <option key={p.id} value={p.id}>{p.sku ? `[${p.sku}] ` : ''}{p.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Cor</label>
                        <select
                          value={selectedColor}
                          onChange={(e) => setSelectedColor(e.target.value)}
                          disabled={!selectedProductId}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum text-sm disabled:opacity-50"
                        >
                          <option value="" disabled>Cor...</option>
                          {selectedProductObj?.colors?.map((c: any, i: number) => (
                            <option key={i} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Tamanho</label>
                        <select
                          value={selectedSize}
                          onChange={(e) => setSelectedSize(e.target.value)}
                          disabled={!selectedProductId}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum text-sm disabled:opacity-50"
                        >
                          <option value="" disabled>Tamanho...</option>
                          {selectedProductObj?.sizes?.map((s: string, i: number) => <option key={i} value={s}>{s}</option>) || ["P", "M", "G", "GG"].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-4 items-end">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-slate-500 mb-1">Quantidade</label>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            max={maxQuantity}
                            value={quantity}
                            onChange={(e) => setQuantity(Number(e.target.value))}
                            disabled={!selectedProductId || !selectedSize || !selectedColor || maxQuantity === 0}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum text-sm font-bold disabled:opacity-50"
                          />
                          {maxQuantity > 0 && (
                            <span className="absolute right-3 top-3 text-xs text-slate-400 font-medium">
                              Máx: {maxQuantity}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button 
                        type="button" 
                        onClick={handleAddItemToKit}
                        disabled={!selectedProductId || !selectedSize || !selectedColor || maxQuantity === 0}
                        className="bg-brand-plum hover:bg-brand-rose text-white h-[46px] rounded-xl px-6"
                      >
                        <Plus className="w-4 h-4 mr-2" /> Incluir
                      </Button>
                    </div>
                    {maxQuantity === 0 && selectedProductId && selectedColor && selectedSize && (
                      <p className="text-xs text-red-500 font-medium">Sem estoque disponível desta variação.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Lado Direito: Carrinho */}
              <div className="w-full md:w-1/2 flex flex-col bg-slate-50">
                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white">
                  <h3 className="font-bold text-slate-800 flex items-center">
                    <Package className="w-4 h-4 mr-2 text-brand-plum" />
                    Itens Selecionados
                  </h3>
                  <span className="bg-brand-plum text-white text-xs font-bold px-2 py-1 rounded-full">
                    {kitItems.reduce((acc, item) => acc + item.quantity, 0)} peças
                  </span>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 min-h-[300px] max-h-[400px]">
                  {kitItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                      <ShoppingCart className="w-12 h-12 mb-3 opacity-20" />
                      <p className="text-sm">A lista está vazia.</p>
                      <p className="text-xs mt-1">Adicione peças ao lado.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {kitItems.map((item) => (
                        <div key={item.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between group">
                          <div>
                            <p className="text-sm font-bold text-slate-800">{item.product_name}</p>
                            <div className="flex gap-2 mt-1">
                              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                                {item.sku}
                              </span>
                              <span className="text-xs bg-brand-plum/10 text-brand-plum font-medium px-2 py-0.5 rounded">
                                {item.color}
                              </span>
                              <span className="text-xs bg-slate-800 text-white font-bold px-2 py-0.5 rounded">
                                {item.size}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-slate-700">{item.quantity}x</span>
                            <button 
                              onClick={() => handleRemoveFromKit(item.id)}
                              className="text-slate-300 hover:text-red-500 p-1 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-4 bg-white border-t border-slate-200 flex justify-end gap-3">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => {
                      setIsModalOpen(false)
                      setKitItems([])
                      setSelectedPromoterId("")
                    }}
                  >
                    Cancelar
                  </Button>
                  <form onSubmit={handleTransfer}>
                    <Button 
                      type="submit" 
                      disabled={submitting || kitItems.length === 0} 
                      className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md rounded-xl px-8"
                    >
                      {submitting ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processando...</>
                      ) : (
                        <><ArrowRight className="w-4 h-4 mr-2" /> Confirmar Transferência</>
                      )}
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
