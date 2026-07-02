import re

with open("app/area-promotora/kits/page.tsx", "r") as f:
    content = f.read()

helper_function = """
const isPeriodExpired = (period: string | null | undefined) => {
  if (!period || period === 'null') return false;
  
  const match = period.match(/a\\s+(\\d{2})\\/(\\d{2})\\/(\\d{4})/);
  if (match) {
    const [_, day, month, year] = match;
    const endDate = new Date(Number(year), Number(month) - 1, Number(day), 23, 59, 59);
    return new Date() > endDate;
  }
  return false;
};

export default function KitsPromotoraPage() {"""

if "isPeriodExpired =" not in content:
    content = content.replace("export default function KitsPromotoraPage() {", helper_function)

# In case the filter wasn't applied:
if "inv => !isPeriodExpired(inv.period)" not in content:
    content = content.replace(
        "const mappedInv = invRes.data.map(inv => {",
        "const mappedInv = invRes.data.filter(inv => !isPeriodExpired(inv.period)).map(inv => {"
    )

if "kit => !isPeriodExpired(kit.period)" not in content and "(kit: any) => !isPeriodExpired(kit.period)" not in content:
    content = content.replace(
        "const mappedKits = kitsRes.data.map((kit: any) => ({",
        "const mappedKits = kitsRes.data.filter((kit: any) => !isPeriodExpired(kit.period)).map((kit: any) => ({"
    )

with open("app/area-promotora/kits/page.tsx", "w") as f:
    f.write(content)

print("Applied expiration logic to kits page")
