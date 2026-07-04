const fs = require('fs');
let content = fs.readFileSync('app/admin/(protected)/vendas/page.tsx', 'utf8');

// 1. Add imports
if (!content.includes('PopoverContent')) {
  content = content.replace(
    'import { Loader2, ShoppingCart, RefreshCw, Box, Tag, ArrowLeft } from "lucide-react"',
    `import { Loader2, ShoppingCart, RefreshCw, Box, Tag, ArrowLeft, Check, ChevronsUpDown } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"`
  );
}

// 2. Add states
if (!content.includes('const [clients, setClients] =')) {
  content = content.replace(
    'const [notes, setNotes] = useState("")',
    `const [notes, setNotes] = useState("")
  const [clients, setClients] = useState<any[]>([])
  const [selectedClient, setSelectedClient] = useState("")
  const [comboboxOpen, setComboboxOpen] = useState(false)`
  );
}

// 3. Fetch clients
if (!content.includes('setClients(usersRes.data)')) {
  content = content.replace(
    'setPromoters(promotersList)',
    `setPromoters(promotersList)
          setClients(usersRes.data)`
  );
}

// 4. Update handleSubmit
if (!content.includes('const txNotes =')) {
  content = content.replace(
    'const handleSubmit = async (e: React.FormEvent) => {',
    `const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    if (!selectedClient) {
      alert("Por favor, selecione um cliente cadastrado.")
      setSubmitting(false)
      return
    }`
  );
  
  content = content.replace(
    'e.preventDefault()\n    setSubmitting(true)',
    '' // Remove the duplicate since we added it above
  );

  content = content.replace(
    'try {\n      if (mode === \'PROMOTER_SALE\') {',
    `const clientName = clients.find(c => c.id === selectedClient)?.nome || selectedClient
    const txNotes = \`Cliente: \${clientName}\${notes ? \` | Obs: \${notes}\` : ''}\`

    try {
      if (mode === 'PROMOTER_SALE') {`
  );

  // Replace all notes usage inside handleSubmit
  content = content.replace(/notes: notes \|\| 'Venda Promotor'/g, 'notes: txNotes');
  content = content.replace(/notes: notes \|\| \`Venda \$\{mode\}\`/g, 'notes: txNotes');
  content = content.replace(/notes: \`Saída para Troca de Promotor\/Revenda\`/g, 'notes: txNotes + " (Saída para Troca)"');
  content = content.replace(/notes: \`Entrada de Troca de Promotor\`/g, 'notes: txNotes + " (Entrada de Troca)"');
  content = content.replace(/notes: 'Saída por troca'/g, 'notes: txNotes + " (Saída por troca)"');
  content = content.replace(/notes: notes \|\| 'Entrada por devolução\/troca'/g, 'notes: txNotes + " (Entrada por devolução)"');
}

// 5. Update UI
const oldUI = `<div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Observações / Nome do Cliente (Opcional)</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum text-sm"
                  />
                </div>`;

const newUI = `<div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Pessoa Registrada (Cliente/Promotor) *</label>
                  <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={comboboxOpen}
                        className="w-full justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 h-[46px] font-normal text-sm hover:bg-slate-100"
                      >
                        {selectedClient
                          ? clients.find((client) => client.id === selectedClient)?.nome
                          : "Pesquise e selecione..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Pesquisar pessoa..." />
                        <CommandList>
                          <CommandEmpty>Nenhuma pessoa encontrada.</CommandEmpty>
                          <CommandGroup>
                            {clients.map((client) => (
                              <CommandItem
                                key={client.id}
                                value={client.nome}
                                onSelect={() => {
                                  setSelectedClient(client.id)
                                  setComboboxOpen(false)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedClient === client.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {client.nome} <span className="ml-2 text-xs text-slate-400">({client.role})</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Observações Adicionais (Opcional)</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-brand-plum text-sm"
                  />
                </div>`;

content = content.replace(oldUI, newUI);

fs.writeFileSync('app/admin/(protected)/vendas/page.tsx', content);
console.log("Updated vendas/page.tsx");
