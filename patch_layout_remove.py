import re

with open("app/area-promotora/layout.tsx", "r") as f:
    content = f.read()

# Replace the role check with just session check
mod = """
  if (!session) {
    redirect("/login")
  }
"""

content = re.sub(
    r'if \(!session\) \{\n\s*redirect\("/login"\)\n\s*\}[\s\S]*?redirect\("/conta"\)\n\s*\}',
    mod.strip(),
    content
)

with open("app/area-promotora/layout.tsx", "w") as f:
    f.write(content)

print("Removed strict role check from server layout")
