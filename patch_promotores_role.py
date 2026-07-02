import re

with open("app/admin/(protected)/estoque/promotores/page.tsx", "r") as f:
    content = f.read()

# 1. Add userRole state
if "const [userRole, setUserRole] = useState" not in content:
    content = content.replace(
        "const [loading, setLoading] = useState(true)",
        "const [loading, setLoading] = useState(true)\n  const [userRole, setUserRole] = useState(\"\")"
    )

# 2. Add auth session check in fetchData
fetch_logic = """const fetchData = async () => {
    setLoading(true)
    
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).maybeSingle()
      setUserRole(profile?.role || session.user.user_metadata?.role || "")
    }"""

if "await supabase.auth.getSession()" not in content:
    content = content.replace(
        "const fetchData = async () => {\n    setLoading(true)",
        fetch_logic
    )

# 3. Hide the button
button_old = """            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-brand-plum hover:bg-brand-rose text-white rounded-full px-6 shadow-md transition-colors"
            >
              <Package className="w-4 h-4 mr-2" /> Transferir Peças
            </Button>"""

button_new = """            {userRole === 'ADMIN' && (
              <Button
                onClick={() => setIsModalOpen(true)}
                className="bg-brand-plum hover:bg-brand-rose text-white rounded-full px-6 shadow-md transition-colors"
              >
                <Package className="w-4 h-4 mr-2" /> Transferir Peças
              </Button>
            )}"""

if "{userRole === 'ADMIN' && (" not in content:
    content = content.replace(button_old, button_new)

with open("app/admin/(protected)/estoque/promotores/page.tsx", "w") as f:
    f.write(content)

print("Applied userRole protection to promotores page")
