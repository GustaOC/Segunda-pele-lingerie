import re

with open("app/area-promotora/kits/page.tsx", "r") as f:
    kits_content = f.read()

# Replace isPeriodExpired in kits
kits_content = re.sub(
    r"const isPeriodExpired = \(period: string \| null \| undefined\) => {.*?return false;\n};",
    """const isPeriodExpired = (period: string | null | undefined) => {
  if (!period || period === 'null' || period === 'Sem Período Registrado') return true;
  
  const match = period.match(/a\s+(\d{2})\/(\d{2})\/(\d{4})/);
  if (match) {
    const [_, day, month, year] = match;
    const endDate = new Date(Number(year), Number(month) - 1, Number(day), 23, 59, 59);
    return new Date() > endDate;
  }
  return true;
};""",
    kits_content,
    flags=re.DOTALL
)

with open("app/area-promotora/kits/page.tsx", "w") as f:
    f.write(kits_content)


with open("app/admin/(protected)/estoque/promotores/page.tsx", "r") as f:
    promo_content = f.read()

is_period_expired_str = """const isPeriodExpired = (period: string | null | undefined) => {
  if (!period || period === 'null' || period === 'Sem Período Registrado') return true;
  
  const match = period.match(/a\\s+(\\d{2})\\/(\\d{2})\\/(\\d{4})/);
  if (match) {
    const [_, day, month, year] = match;
    const endDate = new Date(Number(year), Number(month) - 1, Number(day), 23, 59, 59);
    return new Date() > endDate;
  }
  return true;
};

export default function EstoquePromotoresPage() {"""

if "isPeriodExpired = " not in promo_content:
    promo_content = promo_content.replace("export default function EstoquePromotoresPage() {", is_period_expired_str)

fetch_logic_old = """    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).maybeSingle()
      setUserRole(profile?.role || session.user.user_metadata?.role || "")
    }"""

fetch_logic_new = """    let currentRole = "";
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).maybeSingle()
      currentRole = profile?.role || session.user.user_metadata?.role || "";
      setUserRole(currentRole)
    }"""

promo_content = promo_content.replace(fetch_logic_old, fetch_logic_new)

map_logic_old = """    if (invRes.data && prodRes.data && promData) {
      const mapped = invRes.data.map(inv => {
        const p = prodRes.data.find(p => p.id === inv.product_id)
        const pr = promData.find((pr: any) => pr.id === inv.promoter_id)
        return {
          ...inv,
          product_name: p ? p.name : 'Produto Desconhecido',
          sku: p ? p.sku : '-',
          promoter_name: pr ? pr.nome : 'Promotor Desconhecido'
        }
      })
      setInventory(mapped)
    }"""

map_logic_new = """    if (invRes.data && prodRes.data && promData) {
      let mapped = invRes.data.map(inv => {
        const p = prodRes.data.find(p => p.id === inv.product_id)
        const pr = promData.find((pr: any) => pr.id === inv.promoter_id)
        return {
          ...inv,
          product_name: p ? p.name : 'Produto Desconhecido',
          sku: p ? p.sku : '-',
          promoter_name: pr ? pr.nome : 'Promotor Desconhecido'
        }
      })
      
      if (currentRole !== 'ADMIN') {
        mapped = mapped.filter(inv => !isPeriodExpired(inv.period))
      }
      
      setInventory(mapped)
    }"""

promo_content = promo_content.replace(map_logic_old, map_logic_new)

with open("app/admin/(protected)/estoque/promotores/page.tsx", "w") as f:
    f.write(promo_content)

print("Applied strict expiration to kits and promotores page")
