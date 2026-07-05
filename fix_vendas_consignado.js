const fs = require('fs');

let content = fs.readFileSync('app/admin/(protected)/vendas/page.tsx', 'utf8');

// 1. Remove limit from quantity input during exchanges
const qtyMaxMatch = `max={mode === 'EXCHANGE' ? Math.min(maxQuantity, (exchangeSourceType === 'OUT_PROMOTER' && returnProductId && returnColor && returnSize ? (exchangePromoterInventory.find(i => i.product_id === returnProductId && i.color === returnColor && i.size === returnSize)?.quantity || 999) : (selectedTransactionId ? Math.abs(recentTransactions.find(t => t.id === selectedTransactionId)?.quantity || 999) : 999))) : maxQuantity}`;
const qtyMaxReplace = `max={maxQuantity}`;
content = content.replace(qtyMaxMatch, qtyMaxReplace);

// Remove the text that says "Limite da devolução"
const devLimit1 = `{mode === 'EXCHANGE' && exchangeSourceType !== 'OUT_PROMOTER' && selectedTransactionId && (
                      <p className="text-xs text-amber-600 mt-1">
                        Limite da devolução: {Math.abs(recentTransactions.find(t => t.id === selectedTransactionId)?.quantity || 999)} un.
                      </p>
                    )}`;
const devLimit2 = `{mode === 'EXCHANGE' && exchangeSourceType === 'OUT_PROMOTER' && returnProductId && returnColor && returnSize && (
                      <p className="text-xs text-amber-600 mt-1">
                        Limite da devolução: {exchangePromoterInventory.find(i => i.product_id === returnProductId && i.color === returnColor && i.size === returnSize)?.quantity || 999} un.
                      </p>
                    )}`;
content = content.replace(devLimit1, "");
content = content.replace(devLimit2, "");

// 2. Hide Client selection during OUT_PROMOTER exchange
const clientUIStart = `<div className="flex items-center space-x-2 mb-4">
                  <input
                    type="checkbox"
                    id="isConsumer"`;

const clientUIReplace = `{!(mode === 'EXCHANGE' && exchangeSourceType === 'OUT_PROMOTER') && (
                <>
                <div className="flex items-center space-x-2 mb-4">
                  <input
                    type="checkbox"
                    id="isConsumer"`;
content = content.replace(clientUIStart, clientUIReplace);

const clientUIEnd = `                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                )}`;

const clientUIEndReplace = `                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                )}
                </>
                )}`;
content = content.replace(clientUIEnd, clientUIEndReplace);

// 3. Update handleSubmit validation
const validationMatch = `if (!selectedClient && !isConsumerSale) {
      alert("Por favor, selecione um cliente cadastrado.")
      setSubmitting(false)
      return
    }`;
const validationReplace = `if (!selectedClient && !isConsumerSale && !(mode === 'EXCHANGE' && exchangeSourceType === 'OUT_PROMOTER')) {
      alert("Por favor, selecione um cliente cadastrado.")
      setSubmitting(false)
      return
    }`;
content = content.replace(validationMatch, validationReplace);

// 4. Update clientName inside handleSubmit
const clientNameMatch = `const clientName = isConsumerSale ? \`Consumidor #\${nextConsumerId}\` : (clients.find(c => c.id === selectedClient)?.nome || selectedClient)
    const txNotes = \`Cliente: \${clientName}\${notes ? \` | Obs: \${notes}\` : ''}\``;
const clientNameReplace = `let clientName = isConsumerSale ? \`Consumidor #\${nextConsumerId}\` : (clients.find(c => c.id === selectedClient)?.nome || selectedClient)
    if (mode === 'EXCHANGE' && exchangeSourceType === 'OUT_PROMOTER') {
        const pName = promoters.find(p => p.id === exchangePromoterId)?.nome || ''
        clientName = \`Promotor(a) \${pName}\`
    }
    const txNotes = \`Cliente: \${clientName}\${notes ? \` | Obs: \${notes}\` : ''}\``;
content = content.replace(clientNameMatch, clientNameReplace);

fs.writeFileSync('app/admin/(protected)/vendas/page.tsx', content);
console.log("Updated file successfully");
