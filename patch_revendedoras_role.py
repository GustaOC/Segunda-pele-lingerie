import re

with open("app/admin/(protected)/estoque/revendedoras/page.tsx", "r") as f:
    content = f.read()

# Hide the button Transferir Kit if userRole !== 'ADMIN'
# In revendedoras/page.tsx, userRole is already available!

button_old = """            <Button
              disabled={!selectedResellerId}
              onClick={() => setIsTransferKitModalOpen(true)}
              className="bg-brand-plum hover:bg-brand-rose text-white rounded-full px-6 shadow-md transition-colors"
            >
              <ShoppingCart className="w-4 h-4 mr-2" /> Transferir Kit
            </Button>"""

button_new = """            {userRole === 'ADMIN' && (
              <Button
                disabled={!selectedResellerId}
                onClick={() => setIsTransferKitModalOpen(true)}
                className="bg-brand-plum hover:bg-brand-rose text-white rounded-full px-6 shadow-md transition-colors"
              >
                <ShoppingCart className="w-4 h-4 mr-2" /> Transferir Kit
              </Button>
            )}"""

if "{userRole === 'ADMIN' && (" not in content:
    content = content.replace(button_old, button_new)

with open("app/admin/(protected)/estoque/revendedoras/page.tsx", "w") as f:
    f.write(content)

print("Applied userRole protection to revendedoras page")
