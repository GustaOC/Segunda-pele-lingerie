import re

with open("app/area-promotora/layout.tsx", "r") as f:
    content = f.read()

mod = """
  const rawRole = session.user?.user_metadata?.role || profile?.role
  const userRole = rawRole ? rawRole.toUpperCase().trim() : null

  if (!userRole || (userRole !== 'PROMOTOR' && userRole !== 'CONSULTANT' && userRole !== 'ADMIN')) {
    redirect("/conta")
  }
"""

content = re.sub(
    r'const userRole = session\.user\?\.user_metadata\?\.role \|\| profile\?\.role\n\n\s*if \(!userRole \|\| \(userRole !== \'PROMOTOR\' && userRole !== \'CONSULTANT\' && userRole !== \'ADMIN\'\)\) \{\n\s*redirect\("/conta"\)\n\s*\}',
    mod.strip(),
    content
)

with open("app/area-promotora/layout.tsx", "w") as f:
    f.write(content)

print("Patched layout")
