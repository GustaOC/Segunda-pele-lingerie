const fs = require('fs');

let content = fs.readFileSync('app/admin/(protected)/vendas/page.tsx', 'utf8');

// 1. Add states
const stateInjection = `  const [submitting, setSubmitting] = useState(false)
  const [maxQuantity, setMaxQuantity] = useState(0)

  // Consumidor state
  const [isConsumerSale, setIsConsumerSale] = useState(false)
  const [nextConsumerId, setNextConsumerId] = useState(1)`;

content = content.replace(
    '  const [submitting, setSubmitting] = useState(false)\n  const [maxQuantity, setMaxQuantity] = useState(0)',
    stateInjection
);

// 2. Fetch consumer count
const initFetchMatch = `const [prodRes, transRes, reselRes, consultRes] = await Promise.all([
        supabase.from('products').select('id, name, sku, colors, sizes'),
        supabase.from('inventory_transactions').select('*, products(id, name, sku)').in('type', ['OUT_RETAIL', 'OUT_WHOLESALE']).order('created_at', { ascending: false }).limit(200),
        supabase.from('resellers').select('*').order('name'),
        supabase.from('consultant').select('*').order('name')
      ])`;

const initFetchReplace = `const [prodRes, transRes, reselRes, consultRes, consumerTxRes] = await Promise.all([
        supabase.from('products').select('id, name, sku, colors, sizes'),
        supabase.from('inventory_transactions').select('*, products(id, name, sku)').in('type', ['OUT_RETAIL', 'OUT_WHOLESALE']).order('created_at', { ascending: false }).limit(200),
        supabase.from('resellers').select('*').order('name'),
        supabase.from('consultant').select('*').order('name'),
        supabase.from('inventory_transactions').select('notes').ilike('notes', '%Consumidor #%')
      ])

      if (consumerTxRes && consumerTxRes.data) {
        let maxId = 0;
        consumerTxRes.data.forEach((tx) => {
          const match = tx.notes?.match(/Consumidor #(\\d+)/);
          if (match) {
            const num = parseInt(match[1]);
            if (num > maxId) maxId = num;
          }
        });
        setNextConsumerId(maxId + 1);
      }`;

content = content.replace(initFetchMatch, initFetchReplace);

// 3. Handle Submit
const submitMatch = `  const handleSubmit = async (e: React.FormEvent) => {

    if (!selectedClient) {
      alert("Por favor, selecione um cliente cadastrado.")
      setSubmitting(false)
      return
    }`;

const submitReplace = `  const handleSubmit = async (e: React.FormEvent) => {

    if (!selectedClient && !isConsumerSale) {
      alert("Por favor, selecione um cliente cadastrado ou marque a opção de Venda Consumidor.")
      setSubmitting(false)
      return
    }`;
content = content.replace(submitMatch, submitReplace);

// 3.5 Use Consumer name in submit
const nameMatch = `const clientName = clients.find(c => c.id === selectedClient)?.nome || selectedClient
    const txNotes = \`Cliente: \${clientName}\${notes ? \` | Obs: \${notes}\` : ''}\``;

const nameReplace = `const clientName = isConsumerSale ? \`Consumidor #\${nextConsumerId}\` : (clients.find(c => c.id === selectedClient)?.nome || selectedClient)
    const txNotes = \`Cliente: \${clientName}\${notes ? \` | Obs: \${notes}\` : ''}\``;
content = content.replace(nameMatch, nameReplace);

// 3.6 increment nextConsumerId after success
const successMatch = `alert("Transação registrada com sucesso!")
      setQuantity(1)
      setNotes("")
      // setSelectedClient("") // keep client
      setSubmitting(false)
      router.refresh()`;

const successReplace = `alert("Transação registrada com sucesso!")
      if (isConsumerSale) setNextConsumerId(prev => prev + 1)
      setQuantity(1)
      setNotes("")
      // setSelectedClient("") // keep client
      setSubmitting(false)
      router.refresh()`;
content = content.replace(successMatch, successReplace);

// 4. Update UI
const uiMatch = `<div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cliente Registrado *</label>
                  <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>`;

const uiReplace = `<div className="flex items-center space-x-2 mb-4">
                  <input
                    type="checkbox"
                    id="isConsumer"
                    checked={isConsumerSale}
                    onChange={(e) => {
                      setIsConsumerSale(e.target.checked)
                      if (e.target.checked) setSelectedClient("")
                    }}
                    className="w-4 h-4 text-brand-plum rounded focus:ring-brand-plum"
                  />
                  <label htmlFor="isConsumer" className="text-sm font-medium text-slate-700">
                    Venda Consumidor (Venda #{nextConsumerId})
                  </label>
                </div>
                {!isConsumerSale && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cliente Registrado *</label>
                  <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>`;

content = content.replace(uiMatch, uiReplace);

// close the div
const uiEndMatch = `                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>`;

const uiEndReplace = `                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                )}`;

content = content.replace(uiEndMatch, uiEndReplace);


fs.writeFileSync('app/admin/(protected)/vendas/page.tsx', content);
console.log("Updated vendas for consumer sale");
