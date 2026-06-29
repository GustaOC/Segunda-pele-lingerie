import re

with open("app/admin/(protected)/estoque/revendedoras/page.tsx", "r") as f:
    content = f.read()

# 1. Update imports
content = content.replace(
    'import { Loader2, Package, ShoppingCart, Trash2, X, RefreshCw } from "lucide-react"',
    'import { Loader2, Package, ShoppingCart, Trash2, X, RefreshCw, Plus } from "lucide-react"'
)

# 2. Add KitItem type
kit_item_type = """
type KitItem = {
  id: string
  product_id: string
  product_name: string
  sku: string
  size: string
  color: string
  quantity: number
  price: number
}
"""
content = content.replace("type Reseller = {", kit_item_type + "\ntype Reseller = {")

# 3. Add states and helpers
states = """
  // Edit Kit State
  const [isEditKitModalOpen, setIsEditKitModalOpen] = useState(false)
  const [editingKitId, setEditingKitId] = useState("")
  const [editKitName, setEditKitName] = useState("")
  const [editKitPeriod, setEditKitPeriod] = useState("")
  const [editKitItems, setEditKitItems] = useState<KitItem[]>([])
  const [addQuantity, setAddQuantity] = useState(1)
  const [selectedInvId, setSelectedInvId] = useState("")

  const selectedInvObj = promoterInventory.find(i => i.id === selectedInvId)
  const inCartQty = editKitItems.filter(item => item.product_id === selectedInvObj?.product_id && item.size === selectedInvObj?.size && item.color === selectedInvObj?.color).reduce((sum, item) => sum + item.quantity, 0)
  const maxAvailable = selectedInvObj ? selectedInvObj.quantity - inCartQty : 0
"""
content = content.replace("  const [transferQuantity, setTransferQuantity] = useState(1)", "  const [transferQuantity, setTransferQuantity] = useState(1)\n" + states)

# 4. Add handlers
handlers = """
  const handleEditKit = (kit: any) => {
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
        price: p ? p.price : 0
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
    setEditKitItems(editKitItems.filter(item => item.id !== id))
  }

  const handleDecrementItemFromEdit = (id: string) => {
    setEditKitItems(editKitItems.map(item => {
      if (item.id === id) {
        return { ...item, quantity: item.quantity - 1 }
      }
      return item
    }).filter(item => item.quantity > 0))
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
"""
content = content.replace("  const handleTransferKit = async () => {", handlers + "\n  const handleTransferKit = async () => {")


# 5. Add edit button in UI
original_ui = """                        <h3 className="font-bold text-slate-800 text-lg">{kit.name}</h3>
                        <div className="text-brand-plum font-bold bg-brand-plum/10 px-3 py-1 rounded-full text-sm">
                          R$ {Number(kit.total_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>"""
new_ui = """                        <h3 className="font-bold text-slate-800 text-lg">{kit.name}</h3>
                        <div className="flex gap-2 items-center">
                          <button onClick={() => handleEditKit(kit)} className="text-slate-400 hover:text-brand-plum transition-colors p-1.5 bg-slate-50 rounded-full hover:bg-brand-plum/10" title="Editar Kit">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                          </button>
                          <div className="text-brand-plum font-bold bg-brand-plum/10 px-3 py-1 rounded-full text-sm">
                            R$ {Number(kit.total_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                        </div>"""
content = content.replace(original_ui, new_ui)

# 6. Add modal
modal = """
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
                    <input
                      type="text"
                      value={editKitName}
                      onChange={(e) => setEditKitName(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:border-brand-plum"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Período</label>
                    <select
                      value={editKitPeriod}
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
                            <button onClick={() => handleDecrementItemFromEdit(item.id)} className="text-slate-400 hover:text-orange-500 p-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4"></path></svg></button>
                            <button onClick={() => handleRemoveItemFromEdit(item.id)} className="text-slate-400 hover:text-red-500 p-1"><Trash2 className="w-3 h-3" /></button>
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
"""
content = content.replace("{/* Modal de transferencia de pecas removido */}", modal + "\n        {/* Modal de transferencia de pecas removido */}")

with open("app/admin/(protected)/estoque/revendedoras/page.tsx", "w") as f:
    f.write(content)

print("Patch applied successfully.")
