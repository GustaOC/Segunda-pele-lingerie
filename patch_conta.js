const fs = require('fs');
let content = fs.readFileSync('app/conta/page.tsx', 'utf8');

// Add orders state
content = content.replace('const [favorites, setFavorites] = useState<any[]>([])',
  'const [favorites, setFavorites] = useState<any[]>([])\n  const [orders, setOrders] = useState<any[]>([])'
);

// Add fetch orders
const fetchOrdersStr = `
        const fetchOrders = async () => {
          const { data } = await supabase
            .from('orders')
            .select('id, status, total, created_at, order_items(product_id, quantity, size, color, price_at_time, products(name, image, colors))')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false })
          if (data) setOrders(data)
        }
        fetchOrders()
`;

content = content.replace('fetchFavorites()', 'fetchFavorites()\n' + fetchOrdersStr);

// Replace the Meus Pedidos section
const oldPedidos = `          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <div className="w-12 h-12 bg-brand-peach/50 text-brand-plum rounded-full flex items-center justify-center mb-6">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2" style={{ fontFamily: "var(--font-playfair)" }}>Meus Pedidos</h3>
            <p className="text-slate-500 text-sm">Você ainda não tem nenhum pedido.</p>
          </div>`;

const newPedidos = `          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col max-h-[400px]">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-brand-peach/50 text-brand-plum rounded-full flex items-center justify-center">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900" style={{ fontFamily: "var(--font-playfair)" }}>Meus Pedidos</h3>
            </div>
            {orders.length === 0 ? (
              <p className="text-slate-500 text-sm">Você ainda não tem nenhum pedido.</p>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {orders.map((order) => (
                  <div key={order.id} className="border border-slate-100 rounded-xl p-4 hover:border-brand-plum/30 transition-colors">
                    <div className="flex justify-between items-center mb-3 pb-3 border-b border-slate-50">
                      <div>
                        <span className="text-xs text-slate-400">Data</span>
                        <p className="text-sm font-medium text-slate-700">{new Date(order.created_at).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400">Status</span>
                        <p className={"text-sm font-bold " + (order.status === 'approved' ? 'text-green-600' : 'text-amber-500')}>
                          {order.status === 'approved' ? 'Aprovado' : (order.status === 'pending' ? 'Pendente' : 'Cancelado')}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {order.order_items?.map((item: any, idx: number) => {
                        let itemImg = item.products?.image;
                        if (item.color && item.products?.colors && Array.isArray(item.products.colors)) {
                           const cMatch = item.products.colors.find((c: any) => c.name.toLowerCase() === item.color.toLowerCase());
                           if (cMatch && cMatch.images && cMatch.images.length > 0) itemImg = cMatch.images[0];
                        }
                        return (
                          <div key={idx} className="flex items-center space-x-3">
                            {itemImg && <img src={itemImg} alt="" className="w-12 h-12 rounded object-cover" />}
                            <div className="flex-1">
                              <p className="text-sm font-bold text-slate-800 line-clamp-1">{item.products?.name}</p>
                              <p className="text-xs text-slate-500">
                                {item.quantity}x • Tamanho: {item.size} {item.color ? \`• Cor: \${item.color}\` : ''}
                              </p>
                            </div>
                            <p className="text-sm font-bold text-brand-plum">R$ {item.price_at_time?.toFixed(2).replace('.', ',')}</p>
                          </div>
                        )
                      })}
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-50 flex justify-between items-center">
                      <span className="text-sm text-slate-500">Total:</span>
                      <span className="text-base font-bold text-slate-900">R$ {order.total?.toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>`;

content = content.replace(oldPedidos, newPedidos);

fs.writeFileSync('app/conta/page.tsx', content);
