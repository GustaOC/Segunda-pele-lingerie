const fs = require('fs');
let content = fs.readFileSync('app/admin/(protected)/vendas/page.tsx', 'utf8');

// Add Trash2 to imports
content = content.replace(
  `import { Loader2, ShoppingCart, RefreshCw, Box, Tag, ArrowLeft, Check, ChevronsUpDown } from "lucide-react"`,
  `import { Loader2, ShoppingCart, RefreshCw, Box, Tag, ArrowLeft, Check, ChevronsUpDown, Trash2 } from "lucide-react"`
);

const submitButtonMatch = `<div className="pt-6 border-t border-slate-200">
              <Button type="submit" disabled={submitting || loading || (maxQuantity === 0 && mode !== 'EXCHANGE')} className="w-full bg-brand-plum hover:bg-purple-800 text-white rounded-xl py-6 font-bold text-lg shadow-md transition-all">
                {submitting ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <Check className="w-6 h-6 mr-2" />}
                {submitting ? 'Registrando...' : (mode === 'EXCHANGE' ? 'Registrar Troca' : 'Finalizar Registro')}
              </Button>
            </div>`;

const submitButtonReplace = `{mode !== 'EXCHANGE' && (
              <div className="pt-6 border-t border-slate-200">
                <Button type="button" onClick={addToCart} disabled={maxQuantity === 0} className="w-full bg-white hover:bg-slate-50 border border-brand-plum text-brand-plum rounded-xl py-4 font-bold text-md shadow-sm transition-all mb-4">
                  + Adicionar Peça
                </Button>
              </div>
            )}
            
            {mode !== 'EXCHANGE' && cartItems.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
                <h3 className="font-bold text-slate-800 mb-3">Itens na Venda ({cartItems.length})</h3>
                <div className="space-y-2">
                  {cartItems.map(item => (
                    <div key={item.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{item.productObj?.name || 'Produto'}</p>
                        <p className="text-xs text-slate-500">Cor: {item.color} | Tamanho: {item.size} | Qtd: {item.quantity}</p>
                      </div>
                      <button type="button" onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700 p-2 flex items-center text-xs font-medium">
                        <Trash2 className="w-4 h-4 mr-1" />
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className={\`pt-6 \${mode === 'EXCHANGE' ? 'border-t border-slate-200' : ''}\`}>
              <Button type="submit" disabled={submitting || loading || (mode !== 'EXCHANGE' && cartItems.length === 0)} className="w-full bg-brand-plum hover:bg-purple-800 text-white rounded-xl py-6 font-bold text-lg shadow-md transition-all">
                {submitting ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <Check className="w-6 h-6 mr-2" />}
                {submitting ? 'Registrando...' : (mode === 'EXCHANGE' ? 'Registrar Troca' : 'Finalizar Venda')}
              </Button>
            </div>`;

content = content.replace(submitButtonMatch, submitButtonReplace);

fs.writeFileSync('app/admin/(protected)/vendas/page.tsx', content);
console.log("Applied UI changes");
