import re

with open("app/admin/(protected)/dashboard/DashboardClient.tsx", "r") as f:
    content = f.read()

# Hide Funcionarios button
content = re.sub(
    r'(<Button\n\s*onClick=\{\(\) => router\.push\(\'/admin/user\'\)\}\n\s*variant="outline"\n\s*size="sm".*?</Button>)',
    r'{!isPromoter && (\n                                \1\n                            )}',
    content,
    flags=re.DOTALL
)

# Hide Select and Input (Controls)
content = re.sub(
    r'(<div className="flex items-center gap-3 flex-wrap">\n\s*<Select value=\{selectedPeriod\}.*?</div>\n\s*</div>)',
    r'{!isPromoter && (\n                    \1\n                    )}',
    content,
    flags=re.DOTALL
)

# Hide Metrics Cards
content = re.sub(
    r'(<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">\n.*?<!--.*?-->\n\s*</div>)',
    r'{!isPromoter && (\n                \1\n                )}',
    content,
    flags=re.DOTALL
)

# Hide TabsList
content = re.sub(
    r'(<TabsList className="grid w-full grid-cols-4 bg-white/50 backdrop-blur-sm p-1 rounded-2xl border border-white/30">.*?</TabsList>)',
    r'{!isPromoter && (\n                        \1\n                    )}',
    content,
    flags=re.DOTALL
)

with open("app/admin/(protected)/dashboard/DashboardClient.tsx", "w") as f:
    f.write(content)

print("Fixed header")
