import re

with open("app/area-promotora/kits/page.tsx", "r") as f:
    content = f.read()

# 1. Update isEditingLocked
content = re.sub(
    r'const isEditingLocked = editingKitObj \? \(!isAdmin && \(Date\.now\(\) - new Date\(editingKitObj\.created_at\)\.getTime\(\)\) > 3600000\) : false',
    'const isEditingLocked = !isAdmin',
    content
)

# 2. Update handleEditKit to prevent edit if > 1 hour
handle_edit_kit_mod = """
  const handleEditKit = (kit: Kit) => {
    if (!isAdmin && kit.created_at) {
      const kitAge = Date.now() - new Date(kit.created_at).getTime()
      if (kitAge > 3600000) {
        alert("O prazo de 1 hora para adicionar peças a este kit expirou.")
        return
      }
    }

    setKitName(kit.name)
    setEditingKitId(kit.id)
    setKitMultiplier(1)
"""
content = re.sub(
    r'const handleEditKit = \(kit: Kit\) => \{\n\s*setKitName\(kit\.name\)\n\s*setEditingKitId\(kit\.id\)\n\s*setKitMultiplier\(1\)',
    handle_edit_kit_mod.strip(),
    content
)

# 3. Update the UI for the "Editar" button to hide it if > 1 hour
edit_btn_mod = """
                        <div className="flex gap-2">
                          {(isAdmin || (Date.now() - new Date(kit.created_at).getTime() <= 3600000)) && (
                            <button onClick={() => handleEditKit(kit)} className="text-slate-400 hover:text-brand-plum p-2 transition-colors">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                            </button>
                          )}
"""
content = re.sub(
    r'<div className="flex gap-2">\n\s*<button onClick=\{\(\) => handleEditKit\(kit\)\} className="text-slate-400 hover:text-brand-plum p-2 transition-colors">[\s\S]*?</button>',
    edit_btn_mod.strip(),
    content
)

# 4. Hide the "Excluir" button if > 1 hour (this might already be handled, let's just make sure)
delete_btn_mod = """
                          {(isAdmin || (Date.now() - new Date(kit.created_at).getTime() <= 3600000)) && (
                            <button onClick={() => handleDeleteKit(kit)} className="text-slate-400 hover:text-red-500 p-2 transition-colors">
"""
content = re.sub(
    r'\{\(isAdmin \|\| \(Date\.now\(\) - new Date\(kit\.created_at\)\.getTime\(\)\) <= 3600000\)\} && \(\n\s*<button onClick=\{\(\) => handleDeleteKit\(kit\)\} className="text-slate-400 hover:text-red-500 p-2 transition-colors">',
    delete_btn_mod.strip(),
    content
)


with open("app/area-promotora/kits/page.tsx", "w") as f:
    f.write(content)

print("Patch applied to promoter kits.")
