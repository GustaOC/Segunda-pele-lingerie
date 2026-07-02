import re

with open("app/admin/(protected)/dashboard/DashboardClient.tsx", "r") as f:
    content = f.read()

# Fix duplicate
content = content.replace('{!isPromoter && (\n                            {!isPromoter && (\n                            <Card', '{!isPromoter && (\n                            <Card')

with open("app/admin/(protected)/dashboard/DashboardClient.tsx", "w") as f:
    f.write(content)

print("Fixed duplicate")
