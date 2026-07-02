import os
import re

files_to_patch = [
    "app/admin/(protected)/vendas/page.tsx",
    "app/area-promotora/kits/page.tsx",
    "app/admin/(protected)/estoque/revendedoras/page.tsx"
]

for filepath in files_to_patch:
    if os.path.exists(filepath):
        with open(filepath, "r") as f:
            content = f.read()
        
        # Replace .single() with .maybeSingle() for all inventory queries
        # The easiest safe way is to replace .single() with .maybeSingle() where it's chained after inventory queries.
        
        # We can just replace all `.single()` with `.maybeSingle()` if they follow .eq(...) since most are of this form.
        # But to be safe, let's target the exact lines that query inventory.
        content = re.sub(r"promOutQuery\.single\(\)", "promOutQuery.maybeSingle()", content)
        content = re.sub(r"promInQuery\.single\(\)", "promInQuery.maybeSingle()", content)
        content = re.sub(r"resOutQuery\.single\(\)", "resOutQuery.maybeSingle()", content)
        content = re.sub(r"resInQuery\.single\(\)", "resInQuery.maybeSingle()", content)
        
        # Also replace direct supabase.from('inventory')...single()
        content = re.sub(r"supabase\.from\('inventory'\)(.*?)\.single\(\)", r"supabase.from('inventory')\1.maybeSingle()", content)
        content = re.sub(r"supabase\.from\('promoter_inventory'\)(.*?)\.single\(\)", r"supabase.from('promoter_inventory')\1.maybeSingle()", content)
        content = re.sub(r"supabase\.from\('reseller_inventory'\)(.*?)\.single\(\)", r"supabase.from('reseller_inventory')\1.maybeSingle()", content)
        
        with open(filepath, "w") as f:
            f.write(content)

print("Applied maybeSingle to all other files")
