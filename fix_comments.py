import re

with open("app/admin/(protected)/dashboard/DashboardClient.tsx", "r") as f:
    content = f.read()

# Fix Gráficos principais
content = content.replace('{!isPromoter && (\n                        {/* Gráficos principais */}', '{/* Gráficos principais */}\n                        {!isPromoter && (')

with open("app/admin/(protected)/dashboard/DashboardClient.tsx", "w") as f:
    f.write(content)

print("Fixed comments")
