import re

with open("app/admin/(protected)/estoque/revendedoras/page.tsx", "r") as f:
    content = f.read()

# 1. Update handleTransferKit to set updated_at
transfer_kit_mod = """
          const { error } = await supabase.from('promoter_kits').update({ reseller_id: selectedResellerId, updated_at: new Date().toISOString() }).eq('id', transferKitId)
"""
content = re.sub(
    r'const \{ error \} = await supabase\.from\(\'promoter_kits\'\)\.update\(\{ reseller_id: selectedResellerId \}\)\.eq\(\'id\', transferKitId\)',
    transfer_kit_mod.strip(),
    content
)

# 2. Update handleEditKit to use kit.updated_at || kit.created_at
handle_edit_kit_mod = """
  const handleEditKit = (kit: any) => {
    const ONE_HOUR = 60 * 60 * 1000
    const kitDate = kit.updated_at || kit.created_at
    const kitAge = Date.now() - new Date(kitDate).getTime()
"""
content = re.sub(
    r'const ONE_HOUR = 60 \* 60 \* 1000\n\s*const kitAge = Date\.now\(\) - new Date\(kit\.created_at\)\.getTime\(\)',
    handle_edit_kit_mod.strip(),
    content
)

# 3. Update the UI for the "Editar" button to use kit.updated_at || kit.created_at
edit_btn_mod = """
                            <div className="flex justify-end gap-2 p-4 bg-slate-50 border-t border-slate-100">
                                {(userRole === 'ADMIN' || (Date.now() - new Date(kit.updated_at || kit.created_at).getTime() <= 3600000)) && (
"""
content = re.sub(
    r'<div className="flex justify-end gap-2 p-4 bg-slate-50 border-t border-slate-100">\n\s*\{\(userRole === \'ADMIN\' \|\| \(Date\.now\(\) - new Date\(kit\.created_at\)\.getTime\(\)\) <= 3600000\)\} && \(',
    edit_btn_mod.strip(),
    content
)

with open("app/admin/(protected)/estoque/revendedoras/page.tsx", "w") as f:
    f.write(content)

print("Updated admin revendedoras with updated_at logic.")
