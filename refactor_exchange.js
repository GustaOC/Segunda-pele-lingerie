const fs = require('fs');
const file = 'app/admin/(protected)/vendas/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add returnCartItems and returnQuantity states
content = content.replace(
  /const \[returnAvailablePeriods, setReturnAvailablePeriods\] = useState<any\[\]>\(\[\]\)/,
  `const [returnAvailablePeriods, setReturnAvailablePeriods] = useState<any[]>([])\n  const [returnCartItems, setReturnCartItems] = useState<any[]>([])\n  const [returnQuantity, setReturnQuantity] = useState(1)`
);

// 2. Add addReturnToCart and removeReturnFromCart
const cartFunctions = `
  const addReturnToCart = () => {
    if (!returnProductId || !returnColor || !returnSize || returnQuantity <= 0) {
      alert("Preencha todos os campos do produto devolvido corretamente.");
      return;
    }
    const item = {
      id: Date.now().toString(),
      productId: returnProductId,
      productObj: products.find(p => p.id === returnProductId) || (exchangeSourceType === 'OUT_PROMOTER' ? [...exchangePromoterInventory, ...exchangeResellerInventory, ...exchangeResellerKits.flatMap(k => k.items)].find((i:any) => i.product_id === returnProductId)?.products : null),
      color: returnColor,
      size: returnSize,
      quantity: returnQuantity,
      period: returnPeriod,
      kitId: exchangeResellerSourceType === 'KIT' ? exchangeKitId : undefined
    };
    setReturnCartItems([...returnCartItems, item]);
    setReturnProductId("");
    setReturnColor("");
    setReturnSize("");
    setReturnQuantity(1);
    setSelectedTransactionId("");
  };

  const removeReturnFromCart = (id: string) => {
    setReturnCartItems(returnCartItems.filter(item => item.id !== id));
  };
`;
content = content.replace(/const addToCart = \(\) => \{/, cartFunctions + '\n  const addToCart = () => {');

// 3. Rewrite handleSubmit logic for EXCHANGE
// From `} else if (mode === 'EXCHANGE') {` to the end of the `handleSubmit` block
// Wait, replacing a huge block with regex is hard. Let's do it using string search.
const exchangeLogicStart = "} else if (mode === 'EXCHANGE') {";
const exchangeLogicEnd = `      alert("Transação registrada com sucesso!")`;
const startIdx = content.indexOf(exchangeLogicStart);
const endIdx = content.indexOf(exchangeLogicEnd);

if (startIdx !== -1 && endIdx !== -1) {
  const newExchangeLogic = `} else if (mode === 'EXCHANGE') {
        if (cartItems.length === 0 && returnCartItems.length === 0) {
          alert("Adicione peças para troca/devolução.");
          setSubmitting(false);
          return;
        }

        // Loop das peças que estão SAINDO (cartItems)
        for (const item of cartItems) {
          if (exchangeSourceType === 'OUT_PROMOTER') {
            const pQ = item.period === 'null' ? null : item.period;
            
            // 1. Remove new piece from general inventory
            const { data: invOut } = await supabase.from('inventory').select('id, quantity').eq('product_id', item.productId).eq('size', item.size).eq('color', item.color).maybeSingle()
            if (invOut) {
              await supabase.from('inventory').update({ quantity: invOut.quantity - item.quantity, updated_at: new Date().toISOString() }).eq('id', invOut.id)
              await supabase.from('inventory_transactions').insert({
                created_by: (await supabase.auth.getSession()).data.session?.user?.id,
                type: 'EXCHANGE_OUT', product_id: item.productId, size: item.size, color: item.color, quantity: -item.quantity, notes: txNotes + " (Saída para Troca)", created_at: new Date(transactionDate + 'T12:00:00Z').toISOString()
              })
            }

            // 2. Add new piece to promoter/reseller destination
            if (!exchangeResellerId) {
              let promOutQuery = supabase.from('promoter_inventory').select('*').eq('promoter_id', exchangePromoterId).eq('product_id', item.productId).eq('color', item.color).eq('size', item.size)
              if (pQ) promOutQuery = promOutQuery.eq('period', pQ)
              else promOutQuery = promOutQuery.is('period', null)
              
              const { data: promInvOut } = await promOutQuery.maybeSingle()
              if (promInvOut) {
                await supabase.from('promoter_inventory').update({ quantity: promInvOut.quantity + item.quantity, updated_at: new Date().toISOString() }).eq('id', promInvOut.id)
              } else {
                await supabase.from('promoter_inventory').insert({
                  promoter_id: exchangePromoterId, product_id: item.productId, color: item.color, size: item.size, quantity: item.quantity, period: pQ
                })
              }
            } else {
              let resOutQuery = supabase.from('reseller_inventory').select('*').eq('reseller_id', exchangeResellerId).eq('product_id', item.productId).eq('color', item.color).eq('size', item.size)
              if (pQ) resOutQuery = resOutQuery.eq('period', pQ)
              else resOutQuery = resOutQuery.is('period', null)
              
              const { data: resInvOut } = await resOutQuery.maybeSingle()
              if (resInvOut) {
                await supabase.from('reseller_inventory').update({ quantity: resInvOut.quantity + item.quantity, updated_at: new Date().toISOString() }).eq('id', resInvOut.id)
              } else {
                await supabase.from('reseller_inventory').insert({
                  reseller_id: exchangeResellerId, product_id: item.productId, color: item.color, size: item.size, quantity: item.quantity, period: pQ
                })
              }
            }
          } else {
            // RETAIL / WHOLESALE
            const { data: invOut } = await supabase.from('inventory').select('id, quantity').eq('product_id', item.productId).eq('size', item.size).eq('color', item.color).maybeSingle()
            if (invOut) {
              await supabase.from('inventory').update({ quantity: invOut.quantity - item.quantity, updated_at: new Date().toISOString() }).eq('id', invOut.id)
              await supabase.from('inventory_transactions').insert({
                created_by: (await supabase.auth.getSession()).data.session?.user?.id,
                type: 'EXCHANGE_OUT', product_id: item.productId, size: item.size, color: item.color, quantity: -item.quantity, notes: txNotes + " (Saída por troca)", created_at: new Date(transactionDate + 'T12:00:00Z').toISOString()
              })
            }
          }
        }

        // Loop das peças que estão ENTRANDO (returnCartItems)
        for (const item of returnCartItems) {
          if (exchangeSourceType === 'OUT_PROMOTER') {
            const pQ = item.period === 'null' ? null : item.period;

            // Remove from source
            if (!exchangeResellerId) {
              let promInQuery = supabase.from('promoter_inventory').select('*').eq('promoter_id', exchangePromoterId).eq('product_id', item.productId).eq('color', item.color).eq('size', item.size)
              if (pQ) promInQuery = promInQuery.eq('period', pQ)
              else promInQuery = promInQuery.is('period', null)
              
              const { data: promInvIn } = await promInQuery.maybeSingle()
              if (promInvIn) {
                const newQ = promInvIn.quantity - item.quantity
                if (newQ <= 0) {
                  await supabase.from('promoter_inventory').delete().eq('id', promInvIn.id)
                } else {
                  await supabase.from('promoter_inventory').update({ quantity: newQ, updated_at: new Date().toISOString() }).eq('id', promInvIn.id)
                }
              }
            } else {
              if (item.kitId) {
                const { data: kitItem } = await supabase.from('promoter_kit_items')
                  .select('*')
                  .eq('kit_id', item.kitId)
                  .eq('product_id', item.productId)
                  .eq('color', item.color)
                  .eq('size', item.size)
                  .single()
                if (kitItem) {
                  const newQ = kitItem.quantity - item.quantity
                  if (newQ <= 0) {
                    await supabase.from('promoter_kit_items').delete().eq('id', kitItem.id)
                  } else {
                    await supabase.from('promoter_kit_items').update({ quantity: newQ }).eq('id', kitItem.id)
                  }
                  const { data: inProd } = await supabase.from('products').select('price').eq('id', item.productId).single()
                  const { data: kit } = await supabase.from('promoter_kits').select('total_price').eq('id', item.kitId).single()
                  if (inProd && kit) {
                    await supabase.from('promoter_kits').update({
                      total_price: Number(kit.total_price) - (Number(inProd.price) * item.quantity)
                    }).eq('id', item.kitId)
                  }
                }
              } else {
                let resInQuery = supabase.from('reseller_inventory').select('*').eq('reseller_id', exchangeResellerId).eq('product_id', item.productId).eq('color', item.color).eq('size', item.size)
                if (pQ) resInQuery = resInQuery.eq('period', pQ)
                else resInQuery = resInQuery.is('period', null)
                
                const { data: resInvIn } = await resInQuery.maybeSingle()
                if (resInvIn) {
                  const newQ = resInvIn.quantity - item.quantity
                  if (newQ <= 0) {
                    await supabase.from('reseller_inventory').delete().eq('id', resInvIn.id)
                  } else {
                    await supabase.from('reseller_inventory').update({ quantity: newQ, updated_at: new Date().toISOString() }).eq('id', resInvIn.id)
                  }
                }
              }
            }
          }

          // Add to general inventory (all EXCHANGE sources)
          const { data: invIn } = await supabase.from('inventory').select('id, quantity').eq('product_id', item.productId).eq('size', item.size).eq('color', item.color).maybeSingle()
          if (invIn) {
            await supabase.from('inventory').update({ quantity: invIn.quantity + item.quantity, updated_at: new Date().toISOString() }).eq('id', invIn.id)
          } else {
            await supabase.from('inventory').insert({
              product_id: item.productId, size: item.size, color: item.color, quantity: item.quantity
            })
          }
          await supabase.from('inventory_transactions').insert({
            created_by: (await supabase.auth.getSession()).data.session?.user?.id,
            type: 'EXCHANGE_IN', product_id: item.productId, size: item.size, color: item.color, quantity: item.quantity, notes: txNotes + " (Entrada de Troca)", created_at: new Date(transactionDate + 'T12:00:00Z').toISOString()
          })
        }
      }

`;
  content = content.substring(0, startIdx) + newExchangeLogic + content.substring(endIdx);
}

// 4. Update the reset logic at the end of handleSubmit
content = content.replace(
  /setCartItems\(\[\]\)/,
  `setCartItems([])\n      setReturnCartItems([])`
);

// 5. Update the return UI: add quantity and Add button, then list returnCartItems
const returnUIStart = `<div className="pt-2 border-t border-amber-200/50">`;
const returnUIQuantity = `
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Quantidade Devolvida *</label>
                      <input type="number" min="1" disabled={!!selectedTransactionId && mode === 'EXCHANGE'} value={returnQuantity} onChange={(e) => setReturnQuantity(parseInt(e.target.value) || 1)} className="w-full bg-white border border-amber-200 rounded-xl px-4 py-3 outline-none focus:border-amber-400 text-sm" />
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <Button type="button" onClick={addReturnToCart} className="w-full bg-white hover:bg-amber-50 border border-amber-400 text-amber-600 rounded-xl py-3 font-bold text-sm shadow-sm transition-all">
                      + Adicionar Peça Devolvida
                    </Button>
                  </div>
                  
                  {returnCartItems.length > 0 && (
                    <div className="mt-6 bg-white border border-amber-200 rounded-xl p-4">
                      <h3 className="font-bold text-amber-800 mb-3">Itens Sendo Devolvidos ({returnCartItems.length})</h3>
                      <div className="space-y-2">
                        {returnCartItems.map((item:any) => (
                          <div key={item.id} className="flex justify-between items-center bg-amber-50 p-3 rounded-lg border border-amber-100">
                            <div>
                              <p className="text-sm font-semibold text-slate-800">{item.productObj?.name || 'Produto'}</p>
                              <p className="text-xs text-slate-500">Cor: {item.color} | Tamanho: {item.size} | Qtd: {item.quantity}</p>
                            </div>
                            <button type="button" onClick={() => removeReturnFromCart(item.id)} className="text-red-500 hover:text-red-700 p-2 flex items-center text-xs font-medium">
                              <Trash2 className="w-4 h-4 mr-1" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
`;
// find the end of the `<div>` holding returnSize
const returnSizeEnd = `                      </select>\n                    </div>\n                  </div>\n                )}`;
content = content.replace(returnSizeEnd, returnSizeEnd + '\n' + returnUIQuantity);


// 6. Update the Cart button visibility (mode !== 'EXCHANGE')
// Find: {mode !== 'EXCHANGE' && ( <div className="pt-6 border-t border-slate-100"> <Button type="button" onClick={addToCart}
content = content.replace(/\{mode !== 'EXCHANGE' && \(\s+<div className="pt-6 border-t border-slate-100">/g, `{/* always show cart for all modes */} ( <div className="pt-6 border-t border-slate-100">`);
content = content.replace(/\{mode !== 'EXCHANGE' && cartItems\.length > 0 && \(/g, `{cartItems.length > 0 && (`);

// 7. Update submit button disabled logic
content = content.replace(
  /disabled=\{submitting \|\| \(mode === 'EXCHANGE' && \(maxQuantity === 0 \|\| isExpired\)\) \|\| \(mode !== 'EXCHANGE' && cartItems\.length === 0\)\}/,
  `disabled={submitting || (mode === 'EXCHANGE' ? (cartItems.length === 0 && returnCartItems.length === 0) : cartItems.length === 0)}`
);

fs.writeFileSync(file, content);
console.log('done');
