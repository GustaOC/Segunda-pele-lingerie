import re

with open("app/area-promotora/kits/page.tsx", "r") as f:
    content = f.read()

# Restore isEditingLocked
content = re.sub(
    r'const isEditingLocked = !isAdmin',
    'const isEditingLocked = false',
    content
)

# Restore handleEditKit
handle_edit_kit_mod = """
  const handleEditKit = (kit: Kit) => {
    setKitName(kit.name)
    setEditingKitId(kit.id)
    setKitMultiplier(1)
"""
content = re.sub(
    r'const handleEditKit = \(kit: Kit\) => \{\n\s*if \(!isAdmin && kit\.created_at\) \{[\s\S]*?setKitMultiplier\(1\)',
    handle_edit_kit_mod.strip(),
    content
)

# Restore Edit Button
edit_btn_mod = """
                        <div className="flex gap-2">
                            <button onClick={() => handleEditKit(kit)} className="text-slate-400 hover:text-brand-plum p-2 transition-colors">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                            </button>
"""
content = re.sub(
    r'<div className="flex gap-2">\n\s*\{\(isAdmin \|\| \(Date\.now\(\) - new Date\(kit\.created_at\)\.getTime\(\)\) <= 3600000\)\} && \(\n\s*<button onClick=\{\(\) => handleEditKit\(kit\)\} className="text-slate-400 hover:text-brand-plum p-2 transition-colors">[\s\S]*?</button>\n\s*\)',
    edit_btn_mod.strip(),
    content
)

# Restore Delete Button
delete_btn_mod = """
                            <button onClick={() => handleDeleteKit(kit)} className="text-slate-400 hover:text-red-500 p-2 transition-colors">
"""
content = re.sub(
    r'\{\(isAdmin \|\| \(Date\.now\(\) - new Date\(kit\.created_at\)\.getTime\(\)\) <= 3600000\)\} && \(\n\s*<button onClick=\{\(\) => handleDeleteKit\(kit\)\} className="text-slate-400 hover:text-red-500 p-2 transition-colors">',
    delete_btn_mod.strip(),
    content
)
content = content.replace("</Trash2>\n                            </button>\n                          )", "</Trash2>\n                            </button>")


with open("app/area-promotora/kits/page.tsx", "w") as f:
    f.write(content)

print("Restored promoter kits to be fully editable at any time.")
