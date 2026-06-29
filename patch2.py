import re

# 1. Update estoque/revendedoras/page.tsx
with open("app/admin/(protected)/estoque/revendedoras/page.tsx", "r") as f:
    content = f.read()

user_state = """
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string>("")
"""
content = content.replace("const [selectedPromoterId, setSelectedPromoterId] = useState(\"\")", "const [selectedPromoterId, setSelectedPromoterId] = useState(\"\")\n" + user_state)

fetch_promoters_mod = """
  const fetchPromoters = async () => {
    setLoading(true)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      let currentRole = ""
      if (session) {
        setCurrentUser(session.user)
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
        currentRole = profile?.role || session.user.user_metadata?.role || ""
        setUserRole(currentRole)
      }

      const res = await fetch('/api/admin/user')
      const usersRes = await res.json()
      
      if (usersRes.data) {
        let promotersList = usersRes.data.filter((u: any) => ['CONSULTANT', 'PROMOTOR', 'ADMIN'].includes(u.role))
        
        if (currentRole === 'PROMOTOR' || currentRole === 'CONSULTANT') {
           promotersList = promotersList.filter((u: any) => u.id === session?.user.id)
           if (promotersList.length > 0) {
             setSelectedPromoterId(promotersList[0].id)
           }
        }
        
        setPromoters(promotersList)
      }
    } catch (e) {
      console.error(e)
    }

    const { data: prodData } = await supabase.from('products').select('*')
    if (prodData) setProducts(prodData)
    setLoading(false)
  }
"""
content = re.sub(r'const fetchPromoters = async \(\) => \{[\s\S]*?const \{ data: prodData \} = await supabase\.from\(\'products\'\)\.select\(\'\*\'\)\n    if \(prodData\) setProducts\(prodData\)\n    setLoading\(false\)\n  \}', fetch_promoters_mod.strip(), content)

select_promoter_mod = """
            <select
              disabled={userRole === 'PROMOTOR' || userRole === 'CONSULTANT'}
              value={selectedPromoterId}
              onChange={(e) => setSelectedPromoterId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum text-sm disabled:opacity-50"
            >
"""
content = content.replace("""            <select
              value={selectedPromoterId}
              onChange={(e) => setSelectedPromoterId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum text-sm"
            >""", select_promoter_mod.strip())

with open("app/admin/(protected)/estoque/revendedoras/page.tsx", "w") as f:
    f.write(content)

# 2. Update vendas/page.tsx
with open("app/admin/(protected)/vendas/page.tsx", "r") as f:
    vendas_content = f.read()

vendas_user_state = """
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string>("")
"""
vendas_content = vendas_content.replace("const [promoters, setPromoters] = useState<any[]>([])", "const [promoters, setPromoters] = useState<any[]>([])\n" + vendas_user_state)

vendas_init_mod = """
      try {
        const { data: { session } } = await supabase.auth.getSession()
        let currentRole = ""
        if (session) {
          setCurrentUser(session.user)
          const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
          currentRole = profile?.role || session.user.user_metadata?.role || ""
          setUserRole(currentRole)
        }

        const res = await fetch('/api/admin/user')
        const usersRes = await res.json()
        if (usersRes.data) {
          let promotersList = usersRes.data.filter((u: any) => ['CONSULTANT', 'PROMOTOR', 'ADMIN'].includes(u.role))
          
          if (currentRole === 'PROMOTOR' || currentRole === 'CONSULTANT') {
            promotersList = promotersList.filter((u: any) => u.id === session?.user.id)
            if (promotersList.length > 0) {
              setExchangePromoterId(promotersList[0].id)
              setSelectedPromoterId(promotersList[0].id)
            }
          }
          setPromoters(promotersList)
        }
      } catch (e) {
        console.error(e)
      }
"""
vendas_content = re.sub(r'try \{\n\s*const res = await fetch\(\'/api/admin/user\'\)\n\s*const usersRes = await res\.json\(\)\n\s*if \(usersRes\.data\) \{\n\s*const promotersList = usersRes\.data\.filter\(\(u: any\) => \[\'CONSULTANT\', \'PROMOTOR\', \'ADMIN\'\]\.includes\(u\.role\)\)\n\s*setPromoters\(promotersList\)\n\s*\}\n\s*\} catch \(e\) \{\n\s*console\.error\(e\)\n\s*\}', vendas_init_mod.strip(), vendas_content)

vendas_select_promoter_mod = """
                <select
                  disabled={userRole === 'PROMOTOR' || userRole === 'CONSULTANT'}
                  value={exchangePromoterId}
                  onChange={(e) => {
                    setExchangePromoterId(e.target.value)
                    setExchangeResellerId("")
                    setExchangePromoterInventory([])
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum text-sm disabled:opacity-50"
                >
"""
vendas_content = vendas_content.replace("""                <select
                  value={exchangePromoterId}
                  onChange={(e) => {
                    setExchangePromoterId(e.target.value)
                    setExchangeResellerId("")
                    setExchangePromoterInventory([])
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum text-sm"
                >""", vendas_select_promoter_mod.strip())

with open("app/admin/(protected)/vendas/page.tsx", "w") as f:
    f.write(vendas_content)

print("Patch 2 applied successfully.")
