import re

with open("app/admin/(protected)/estoque/revendedoras/page.tsx", "r") as f:
    content = f.read()

# 1. Update KitItem type
if "originalQuantity?: number" not in content:
    content = content.replace("price: number\n}", "price: number\n  originalQuantity?: number\n}")

# 2. Add isKitLocked state
if "const [isKitLocked, setIsKitLocked] = useState(false)" not in content:
    content = content.replace("const [editKitItems, setEditKitItems] = useState<KitItem[]>([])", "const [editKitItems, setEditKitItems] = useState<KitItem[]>([])\n  const [isKitLocked, setIsKitLocked] = useState(false)")

# 3. Update handleEditKit
handle_edit_kit_mod = """
  const handleEditKit = (kit: any) => {
    const ONE_HOUR = 60 * 60 * 1000
    const kitAge = Date.now() - new Date(kit.created_at).getTime()
    const locked = userRole !== 'ADMIN' && kitAge > ONE_HOUR
    setIsKitLocked(locked)

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
"""
content = re.sub(r'const handleEditKit = \(kit: any\) => \{[\s\S]*?setIsEditKitModalOpen\(true\)\n  \}', handle_edit_kit_mod.strip(), content)

# 4. Update handleRemoveItemFromEdit
handle_remove_mod = """
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
"""
content = re.sub(r'const handleRemoveItemFromEdit = \(id: string\) => \{[\s\S]*?setEditKitItems\(editKitItems\.filter\(item => item\.id !== id\)\)\n  \}', handle_remove_mod.strip(), content)

# 5. Update handleDecrementItemFromEdit
handle_decrement_mod = """
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
"""
content = re.sub(r'const handleDecrementItemFromEdit = \(id: string\) => \{[\s\S]*?return item\n    \}\)\.filter\(item => item\.quantity > 0\)\)\n  \}', handle_decrement_mod.strip(), content)

# 6. Update UI inputs
# Name
content = re.sub(
    r'<input\s+type="text"\s+value=\{editKitName\}',
    '<input type="text" disabled={isKitLocked} value={editKitName}',
    content
)
# Period
content = re.sub(
    r'<select\s+value=\{editKitPeriod\}',
    '<select disabled={isKitLocked} value={editKitPeriod}',
    content
)

# 7. Update UI buttons for decrement and remove
buttons_mod = """
                          <div className="flex flex-col gap-1 border-l border-slate-200 pl-3">
                            {(!isKitLocked || !item.originalQuantity || item.quantity > item.originalQuantity) && (
                              <button onClick={() => handleDecrementItemFromEdit(item.id)} className="text-slate-400 hover:text-orange-500 p-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4"></path></svg></button>
                            )}
                            {(!isKitLocked || !item.originalQuantity || item.originalQuantity === 0) && (
                              <button onClick={() => handleRemoveItemFromEdit(item.id)} className="text-slate-400 hover:text-red-500 p-1"><Trash2 className="w-3 h-3" /></button>
                            )}
                          </div>
"""
content = re.sub(r'<div className="flex flex-col gap-1 border-l border-slate-200 pl-3">[\s\S]*?</button>\n                          </div>', buttons_mod.strip(), content)

with open("app/admin/(protected)/estoque/revendedoras/page.tsx", "w") as f:
    f.write(content)

print("Patch applied.")
