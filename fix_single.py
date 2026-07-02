import re

with open("app/admin/(protected)/estoque/promotores/page.tsx", "r") as f:
    content = f.read()

# Replace .single() with .maybeSingle() for query and inventory fetches where appropriate
content = content.replace(
    ".eq('size', selectedSize)\n          .single()",
    ".eq('size', selectedSize)\n          .maybeSingle()"
)

content = content.replace(
    ".eq('color', item.color)\n          .single()",
    ".eq('color', item.color)\n          .maybeSingle()"
)

content = content.replace(
    "const { data: existingPromInv, error: existingError } = await query.single()",
    "const { data: existingPromInv, error: existingError } = await query.maybeSingle()"
)

with open("app/admin/(protected)/estoque/promotores/page.tsx", "w") as f:
    f.write(content)

print("Applied maybeSingle patch")
