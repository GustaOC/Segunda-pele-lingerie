import re

with open("app/admin/(protected)/estoque/revendedoras/page.tsx", "r") as f:
    content = f.read()

# 1. Update handleEditKit logic
handle_edit_kit_mod = """
  const handleEditKit = (kit: any) => {
    const ONE_HOUR = 60 * 60 * 1000
    const kitAge = Date.now() - new Date(kit.created_at).getTime()
    
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
"""
content = re.sub(r'const handleEditKit = \(kit: any\) => \{[\s\S]*?setIsEditKitModalOpen\(true\)\n  \}', handle_edit_kit_mod.strip(), content)


# 2. Hide "Editar" button if > 1 hour
# In the render loop for resellerKits:
edit_btn_mod = """
                            {/* Actions */}
                            <div className="flex justify-end gap-2 p-4 bg-slate-50 border-t border-slate-100">
                                {(userRole === 'ADMIN' || (Date.now() - new Date(kit.created_at).getTime() <= 3600000)) && (
                                  <button onClick={() => handleEditKit(kit)} className="text-slate-400 hover:text-brand-plum p-2 transition-colors">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                  </button>
                                )}
"""
content = re.sub(r'\{\/\* Actions \*\/\}[\s\S]*?<button onClick=\{\(\) => handleEditKit\(kit\)\} className="text-slate-400 hover:text-brand-plum p-2 transition-colors">[\s\S]*?</button>', edit_btn_mod.strip(), content)

with open("app/admin/(protected)/estoque/revendedoras/page.tsx", "w") as f:
    f.write(content)

# 3. Update app/area-promotora/kits/page.tsx
with open("app/area-promotora/kits/page.tsx", "r") as f:
    prom_content = f.read()

# Update `isEditingLocked` inside `app/area-promotora/kits/page.tsx`
# Wait, let's look at `app/area-promotora/kits/page.tsx` logic first.
