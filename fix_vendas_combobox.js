const fs = require('fs');

let content = fs.readFileSync('app/admin/(protected)/vendas/page.tsx', 'utf8');

// 1. Add cpf to clients
const allPeopleMatch = `const clientsOnly = usersRes.data.filter((u: any) => u.role === 'USER');
            allPeople.push(...clientsOnly.map((u: any) => ({ id: u.id, nome: u.nome || u.email || 'Sem Nome', role: 'Cliente' })))`;
const allPeopleReplace = `const clientsOnly = usersRes.data.filter((u: any) => u.role === 'USER');
            allPeople.push(...clientsOnly.map((u: any) => ({ id: u.id, nome: u.nome || u.email || 'Sem Nome', role: 'Cliente', cpf: u.cpf })))`;
content = content.replace(allPeopleMatch, allPeopleReplace);

// 2. Add combobox state for transactions
const statesMatch = `  const [exchangeSourceType, setExchangeSourceType] = useState<'OUT_RETAIL' | 'OUT_WHOLESALE' | 'OUT_PROMOTER' | ''>('')
  const [selectedTransactionId, setSelectedTransactionId] = useState("")`;
const statesReplace = `  const [exchangeSourceType, setExchangeSourceType] = useState<'OUT_RETAIL' | 'OUT_WHOLESALE' | 'OUT_PROMOTER' | ''>('')
  const [selectedTransactionId, setSelectedTransactionId] = useState("")
  const [txComboboxOpen, setTxComboboxOpen] = useState(false)`;
content = content.replace(statesMatch, statesReplace);

// 3. Replace <select> with Combobox
const selectMatch = `<div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Selecione a Venda *</label>
                    <select required value={selectedTransactionId} onChange={(e) => setSelectedTransactionId(e.target.value)} className="w-full bg-white border border-amber-200 rounded-xl px-4 py-3 outline-none focus:border-amber-400 text-sm">
                      <option value="" disabled>Selecione a venda anterior...</option>
                      {recentTransactions.filter(t => t.type === exchangeSourceType).map(t => {
                        const dateStr = new Date(t.created_at).toLocaleDateString('pt-BR')
                        const promoterName = t.promoter_id ? promoters.find(p => p.id === t.promoter_id)?.nome : ''
                        return (
                          <option key={t.id} value={t.id}>
                            {dateStr} - {t.products?.name} ({t.color} {t.size}) - {Math.abs(t.quantity)} un {promoterName ? \`- \${promoterName}\` : ''}
                          </option>
                        )
                      })}
                    </select>`;

const selectReplace = `<div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Selecione a Venda *</label>
                    <Popover open={txComboboxOpen} onOpenChange={setTxComboboxOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={txComboboxOpen}
                          className="w-full justify-between bg-white border border-amber-200 rounded-xl px-4 h-[46px] font-normal text-sm hover:bg-slate-50 focus:border-amber-400"
                        >
                          {selectedTransactionId
                            ? (() => {
                                const t = recentTransactions.find((tx) => tx.id === selectedTransactionId)
                                if (!t) return "Selecione a venda anterior..."
                                const dateStr = new Date(t.created_at).toLocaleDateString('pt-BR')
                                const promoterName = t.promoter_id ? promoters.find(p => p.id === t.promoter_id)?.nome : ''
                                return \`\${dateStr} - \${t.products?.name} - \${Math.abs(t.quantity)} un \${t.notes ? \`(\${t.notes.split(' | ')[0]})\` : ''}\`
                              })()
                            : "Selecione a venda anterior..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[500px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Pesquisar por cliente, CPF, nº da venda ou produto..." />
                          <CommandList>
                            <CommandEmpty>Nenhuma venda encontrada.</CommandEmpty>
                            <CommandGroup>
                              {recentTransactions.filter(t => t.type === exchangeSourceType).map(t => {
                                const dateStr = new Date(t.created_at).toLocaleDateString('pt-BR')
                                const promoterName = t.promoter_id ? promoters.find(p => p.id === t.promoter_id)?.nome : ''
                                
                                // Extract client name to find CPF
                                let cpf = ""
                                if (t.notes && t.notes.includes('Cliente: ')) {
                                  const cName = t.notes.split(' | ')[0].replace('Cliente: ', '').trim()
                                  const foundClient = clients.find(c => c.nome === cName)
                                  if (foundClient && foundClient.cpf) {
                                    cpf = foundClient.cpf
                                  }
                                }

                                const searchString = \`\${dateStr} \${t.products?.name} \${t.color} \${t.size} \${promoterName} \${t.notes || ''} \${cpf} \${t.id}\`
                                const label = \`\${dateStr} - \${t.products?.name} (\${t.color} \${t.size}) - \${Math.abs(t.quantity)} un \${promoterName ? \`- \${promoterName}\` : ''} \${t.notes ? \` | \${t.notes.split(' | ')[0]}\` : ''}\`

                                return (
                                  <CommandItem
                                    key={t.id}
                                    value={searchString}
                                    onSelect={() => {
                                      setSelectedTransactionId(t.id)
                                      setTxComboboxOpen(false)
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        selectedTransactionId === t.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {label}
                                  </CommandItem>
                                )
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>`;
content = content.replace(selectMatch, selectReplace);

fs.writeFileSync('app/admin/(protected)/vendas/page.tsx', content);
console.log("Replaced select with searchable Combobox");
