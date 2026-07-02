import re

with open("app/conta/page.tsx", "r") as f:
    content = f.read()

# Replace the router.push('/admin') with a ternary check
mod = """
              <Button onClick={() => router.push(role === 'ADMIN' ? '/admin/dashboard' : '/area-promotora/kits')} variant="outline" className="border-brand-plum text-brand-plum hover:bg-brand-plum hover:text-white rounded-full w-full md:w-auto">
"""

content = re.sub(
    r'<Button onClick=\{.*?\}\s+variant="outline" className="border-brand-plum text-brand-plum hover:bg-brand-plum hover:text-white rounded-full w-full md:w-auto">',
    mod.strip(),
    content
)

with open("app/conta/page.tsx", "w") as f:
    f.write(content)

print("Patched conta button")
