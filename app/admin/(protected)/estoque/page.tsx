"use client";
import { Button } from "@/components/ui/button"
import { Playfair_Display, Inter } from "next/font/google"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Plus, ArrowDown, ArrowUp, Package, History, X, Palette } from "lucide-react"

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-playfair" })
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-inter" })

type InventoryRow = {
  id: string
  product_id: string
  product_name: string
  size: string
  color: string
  quantity: number
  sku?: string
}

export default function EstoqueGeralPage() {
  const [loading, setLoading] = useState(true)
  const [inventory, setInventory] = useState<InventoryRow[]>([])
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCreateProductModalOpen, setIsCreateProductModalOpen] = useState(false)
  
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  
  // Transaction state
  const [selectedProductId, setSelectedProductId] = useState("")
  const [selectedSize, setSelectedSize] = useState("M")
  const [selectedColor, setSelectedColor] = useState("")
  const [transactionType, setTransactionType] = useState("IN") // IN or MANUAL_ADJUST
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  
  // Base Product state
  const [newSku, setNewSku] = useState("")
  const [newName, setNewName] = useState("")
  const [newPrice, setNewPrice] = useState("")
  const [newCategoryId, setNewCategoryId] = useState("")
  const [newColors, setNewColors] = useState<{name: string, hex: string}[]>([{name: "", hex: "#000000"}])
  const [newSizes, setNewSizes] = useState<string[]>(["P", "M", "G", "GG"])

  const supabase = createClient()

  const fetchData = async () => {
    setLoading(true)
    
    // Fetch products
    const { data: prodData } = await supabase.from('products').select('id, name, sku, colors, sizes')
    if (prodData) setProducts(prodData)
    
    // Fetch categories
    const { data: catData } = await supabase.from('categories').select('*').order('name')
    if (catData) {
      const parents = catData.filter(c => !c.parent_id)
      const grouped = parents.map(parent => ({
        ...parent,
        children: catData.filter(c => c.parent_id === parent.id)
      }))
      setCategories(grouped)
    }

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
    fetchData()
  }, [])

  const handleCreateBaseProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    if (!newSku || !newName || !newPrice) {
      alert("Preencha SKU, Nome e Preço.")
      setSubmitting(false)
      return
    }

    const priceNum = parseFloat(newPrice.replace(',', '.'))

    // Formatar cores corretamente (images vazias por enquanto)
    const formattedColors = newColors.filter(c => c.name.trim() !== "").map(c => ({
      name: c.name,
      hex: c.hex,
      images: []
    }))

    if (formattedColors.length === 0) {
      alert("Adicione pelo menos uma cor.")
      setSubmitting(false)
      return
    }

    if (newSizes.length === 0) {
      alert("Adicione pelo menos um tamanho.")
      setSubmitting(false)
      return
    }

    try {
      const { error } = await supabase.from('products').insert({
        sku: newSku,
        name: newName,
        price: priceNum,
        category_id: newCategoryId || null,
        colors: formattedColors,
        sizes: newSizes,
        is_active: false, // Só ativa quando for pro E-commerce preencher foto e desc
        is_highlight: false,
        image: "",
        images: [],
        description: ""
      })

      if (error) {
        if (error.code === '23505') {
          alert("Este SKU já está cadastrado no sistema!")
        } else {
          console.error(error)
          alert("Erro ao criar produto base.")
        }
      } else {
        alert("Produto Base criado com sucesso! Agora você já pode adicionar estoque dele.")
        setIsCreateProductModalOpen(false)
        setNewSku("")
        setNewName("")
        setNewPrice("")
        setNewColors([{name: "", hex: "#000000"}])
        setNewSizes(["P", "M", "G", "GG"])
        fetchData()
      }
    } catch (err) {
      console.error(err)
      alert("Erro ao criar produto.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    
    if (!selectedProductId || !selectedSize || !selectedColor) {
      alert("Preencha produto, tamanho e cor.")
      setSubmitting(false)
      return
    }

    try {
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
      fetchData()
      
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
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-white p-6 rounded-3xl shadow-sm border border-slate-200 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800" style={{ fontFamily: "var(--font-playfair)" }}>
              Estoque Geral
            </h1>
            <p className="text-slate-500 mt-1">Gerencie a entrada e saída de peças do centro de distribuição.</p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={() => setIsCreateProductModalOpen(true)}
              className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-full px-6 shadow-sm"
            >
              <Package className="w-4 h-4 mr-2" />
              Novo Produto Base
            </Button>
            <Button 
              onClick={() => setIsModalOpen(true)}
              className="bg-brand-plum hover:bg-brand-rose text-white rounded-full px-6 shadow-md"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Movimentação
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-brand-plum" />
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-600 uppercase tracking-wider">
                    <th className="px-6 py-4">SKU</th>
                    <th className="px-6 py-4">Produto</th>
                    <th className="px-6 py-4">Tamanho</th>
                    <th className="px-6 py-4">Cor</th>
                    <th className="px-6 py-4 text-right">Qtd. em Estoque</th>
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
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center text-sm text-slate-600">
                            {item.color}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold ${item.quantity <= 5 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
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

      {/* Modal Criar Produto Base */}
      {isCreateProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-xl overflow-hidden my-8">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center">
                <Package className="w-5 h-5 mr-2 text-brand-plum" />
                Cadastrar Novo Produto (Base)
              </h2>
              <button onClick={() => setIsCreateProductModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreateBaseProduct} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ID do Produto (SKU) *</label>
                  <input
                    type="text"
                    required
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value.toUpperCase())}
                    placeholder="Ex: CONJ-AUR-01"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum text-sm font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Preço Base (R$) *</label>
                  <input
                    type="text"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="Ex: 149,90"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Produto *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Conjunto Rendado Aurora"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Categoria (Opcional)</label>
                <select
                  value={newCategoryId}
                  onChange={(e) => setNewCategoryId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum text-sm"
                >
                  <option value="">Selecione a Categoria principal...</option>
                  {categories.map((parent) => (
                    <optgroup key={parent.id} label={parent.name}>
                      <option value={parent.id}>{parent.name} (Geral)</option>
                      {parent.children?.map((child: any) => (
                        <option key={child.id} value={child.id}>
                          -- {child.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center">
                    <Palette className="w-4 h-4 mr-2 text-brand-plum" />
                    Cores Disponíveis
                  </h3>
                  <Button 
                    type="button" 
                    onClick={() => setNewColors([...newColors, { name: "", hex: "#000000" }])}
                    variant="outline" 
                    size="sm"
                    className="bg-white h-8"
                  >
                    <Plus className="w-3 h-3 mr-1" /> Add Cor
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {newColors.map((color, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input 
                        type="color" 
                        value={color.hex}
                        onChange={(e) => {
                          const newC = [...newColors]; newC[idx].hex = e.target.value; setNewColors(newC);
                        }}
                        className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                      />
                      <input 
                        type="text" 
                        required
                        value={color.name}
                        onChange={(e) => {
                          const newC = [...newColors]; newC[idx].name = e.target.value; setNewColors(newC);
                        }}
                        placeholder="Nome da Cor (Ex: Vermelho)"
                        className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none text-sm"
                      />
                      {newColors.length > 1 && (
                        <button type="button" onClick={() => setNewColors(newColors.filter((_, i) => i !== idx))} className="p-2 text-slate-400 hover:text-red-500">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tamanhos Disponíveis</label>
                <div className="flex flex-wrap gap-2">
                  {["PP", "P", "M", "G", "GG", "EG", "U"].map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => {
                        if (newSizes.includes(t)) setNewSizes(newSizes.filter(s => s !== t));
                        else setNewSizes([...newSizes, t]);
                      }}
                      className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${
                        newSizes.includes(t) 
                          ? 'bg-brand-plum text-white border-brand-plum' 
                          : 'bg-white text-slate-600 border-slate-200 hover:border-brand-plum'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setIsCreateProductModalOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={submitting} className="bg-brand-plum hover:bg-brand-rose text-white">
                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Salvar Produto Base
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nova Movimentação (Estoque) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-xl overflow-hidden my-8">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">Registrar Movimentação</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setTransactionType('IN')}
                  className={`flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-lg transition-all ${
                    transactionType === 'IN' ? 'bg-white text-brand-plum shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <ArrowDown className="w-4 h-4 mr-2" /> Entrada
                </button>
                <button
                  type="button"
                  onClick={() => setTransactionType('MANUAL_ADJUST')}
                  className={`flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-lg transition-all ${
                    transactionType === 'MANUAL_ADJUST' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Package className="w-4 h-4 mr-2" /> Definir Quantidade Exata
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Produto *</label>
                <select
                  required
                  value={selectedProductId}
                  onChange={(e) => {
                    setSelectedProductId(e.target.value)
                    setSelectedColor("")
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cor *</label>
                  <select
                    required
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    disabled={!selectedProductId}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum text-sm disabled:opacity-50"
                  >
                    <option value="" disabled>Selecione a cor...</option>
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
                    {selectedProductObj?.sizes?.map((s: string, i: number) => <option key={i} value={s}>{s}</option>) || ["P", "M", "G", "GG"].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {transactionType === 'IN' ? 'Quantidade Adicionada *' : 'Nova Quantidade Total *'}
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Observações (Opcional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={transactionType === 'IN' ? "Ex: Lote 123 (opcional), Fornecedor X" : "Ex: Contagem de inventário mensal"}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum text-sm"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={submitting} className="bg-brand-plum hover:bg-brand-rose text-white">
                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Salvar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
