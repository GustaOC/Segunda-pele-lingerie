"use client";

import { useState, useEffect } from "react";
import { Users, Package, Search, Calculator, CheckCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";

export default function AcertoPromotor() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [promoters, setPromoters] = useState<any[]>([]);
  const [selectedPromoterId, setSelectedPromoterId] = useState("");
  
  const [products, setProducts] = useState<any[]>([]);
  const [promoterInventory, setPromoterInventory] = useState<any[]>([]);
  
  const [commissionPercent, setCommissionPercent] = useState(10); // Standard manual 10%
  
  const supabase = createClient();
  const { toast } = useToast();

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    
    // Fetch Promoters via API or table (Assuming profiles table or API)
    const [usersRes, prodRes] = await Promise.all([
        fetch('/api/admin/user').then(res => res.json()),
        supabase.from('products').select('*')
    ]);

    if (usersRes.data) {
        const promData = usersRes.data.filter((u: any) => ['CONSULTANT', 'PROMOTOR', 'ADMIN'].includes(u.role));
        setPromoters(promData);
    }
    
    if (prodRes.data) setProducts(prodRes.data);
    setLoading(false);
  };

  useEffect(() => {
    if (!selectedPromoterId) {
        setPromoterInventory([]);
        return;
    }
    fetchPromoterInventory(selectedPromoterId);
  }, [selectedPromoterId]);

  const fetchPromoterInventory = async (promoterId: string) => {
      const { data } = await supabase.from('promoter_inventory')
        .select('*')
        .eq('promoter_id', promoterId);
        
      if (data) {
          const mapped = data.map(inv => {
              const p = products.find(prod => prod.id === inv.product_id);
              return {
                  ...inv,
                  product_name: p ? p.name : 'Desconhecido',
                  price: p ? p.price : 0,
                  sku: p ? p.sku : '',
                  returned: 0,
                  sold: 0, // Since this is pooled inventory, 'sold' means they don't return it and we deduct it
                  toPay: 0
              };
          });
          setPromoterInventory(mapped);
      }
  };

  const handleReturnedChange = (itemId: string, value: string) => {
      let returned = parseInt(value) || 0;
      setPromoterInventory(prev => prev.map(item => {
          if (item.id === itemId) {
              if (returned > item.quantity) returned = item.quantity;
              if (returned < 0) returned = 0;
              return { ...item, returned, sold: item.quantity - returned };
          }
          return item;
      }));
  };

  // Calculations
  let totalInventoryValue = 0;
  let totalSoldValue = 0;
  
  promoterInventory.forEach(item => {
      totalInventoryValue += (item.quantity * item.price);
      totalSoldValue += (item.sold * item.price);
  });
  
  const totalCommission = totalSoldValue * (commissionPercent / 100);
  const finalAmountToPay = totalSoldValue - totalCommission;

  const handleFinalize = async () => {
      if (!selectedPromoterId) return;

      setSubmitting(true);
      try {
          const { data: { session } } = await supabase.auth.getSession();
          const adminId = session?.user.id;
          
          for (const item of promoterInventory) {
              // 1. Process returned items to Estoque Geral
              if (item.returned > 0) {
                  const { data: invData } = await supabase.from('inventory')
                      .select('*')
                      .eq('product_id', item.product_id)
                      .eq('color', item.color)
                      .eq('size', item.size)
                      .maybeSingle();
                      
                  if (invData) {
                      await supabase.from('inventory').update({ 
                          quantity: invData.quantity + item.returned 
                      }).eq('id', invData.id);
                  } else {
                      await supabase.from('inventory').insert({
                          product_id: item.product_id,
                          color: item.color,
                          size: item.size,
                          quantity: item.returned
                      });
                  }
                  
                  // Log transaction
                  await supabase.from('inventory_transactions').insert({
                      created_by: adminId,
                      type: 'EXCHANGE_IN',
                      product_id: item.product_id,
                      color: item.color,
                      size: item.size,
                      quantity: item.returned,
                      notes: `Devolução do Promotor: ${promoters.find(p=>p.id===selectedPromoterId)?.nome}`
                  });
              }
              
              // 2. Reduce promoter inventory (for both returned AND sold)
              // If it's returned, it goes to general stock. If it's sold, it disappears from system.
              // So the new quantity in promoter_inventory is 0 for those processed, or just delete it if all is settled.
              // Wait, if they don't settle everything, what happens? 
              // Acerto usually means settling a specific amount. If they say 'sold = 2, returned = 1', we deduct 3.
              const totalProcessed = item.returned + item.sold;
              if (totalProcessed > 0) {
                  const newQty = item.quantity - totalProcessed;
                  if (newQty > 0) {
                      await supabase.from('promoter_inventory').update({ quantity: newQty }).eq('id', item.id);
                  } else {
                      await supabase.from('promoter_inventory').delete().eq('id', item.id);
                  }
              }
          }
          
          toast({
              title: "Acerto Finalizado!",
              description: "Acerto do promotor registrado e estoque geral atualizado.",
              className: "bg-green-50 text-green-900 border-green-200"
          });
          
          fetchPromoterInventory(selectedPromoterId);
          
      } catch (e: any) {
          toast({
              title: "Erro",
              description: e.message || "Erro ao finalizar o acerto.",
              variant: "destructive"
          });
      } finally {
          setSubmitting(false);
      }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-brand-plum" /></div>;

  return (
    <div className="space-y-6">
      
      {/* SELETORES */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Promotor</label>
              <select 
                  value={selectedPromoterId} 
                  onChange={(e) => setSelectedPromoterId(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:border-brand-plum bg-slate-50"
              >
                  <option value="">Selecione um promotor...</option>
                  {promoters.map(p => (
                      <option key={p.id} value={p.id}>{p.nome || p.email}</option>
                  ))}
              </select>
          </div>
          <div className="w-full md:w-48">
              <label className="block text-sm font-medium text-slate-700 mb-1">Comissão Promotor (%)</label>
              <input 
                  type="number" 
                  min="0" 
                  max="100"
                  value={commissionPercent}
                  onChange={(e) => setCommissionPercent(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:border-brand-plum bg-slate-50"
              />
          </div>
      </div>
      
      {selectedPromoterId && promoterInventory.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* LISTA DE ITENS */}
              <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                      <h3 className="font-bold text-slate-800 flex items-center">
                          <Package className="w-5 h-5 mr-2 text-brand-plum" />
                          Estoque em Posse
                      </h3>
                  </div>
                  
                  <div className="p-0 overflow-x-auto">
                      <table className="w-full text-sm text-left text-slate-600">
                          <thead className="text-xs uppercase bg-slate-50 text-slate-500 border-b border-slate-100">
                              <tr>
                                  <th className="px-4 py-3">Produto</th>
                                  <th className="px-4 py-3 text-center">Em Posse</th>
                                  <th className="px-4 py-3 text-center">Devolvido</th>
                                  <th className="px-4 py-3 text-center">Vendido/Faturar</th>
                              </tr>
                          </thead>
                          <tbody>
                              {promoterInventory.map((item) => (
                                  <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                                      <td className="px-4 py-3">
                                          <div className="font-medium text-slate-800">{item.sku} - {item.product_name}</div>
                                          <div className="text-xs text-slate-500">{item.size} | {item.color}</div>
                                      </td>
                                      <td className="px-4 py-3 text-center font-medium bg-slate-50/50">{item.quantity}</td>
                                      <td className="px-4 py-3 text-center">
                                          <input 
                                              type="number" 
                                              min="0" 
                                              max={item.quantity}
                                              value={item.returned}
                                              onChange={(e) => handleReturnedChange(item.id, e.target.value)}
                                              className="w-20 mx-auto text-center border border-slate-200 rounded-lg p-1 outline-none focus:border-brand-plum bg-white"
                                          />
                                      </td>
                                      <td className="px-4 py-3 text-center font-bold text-slate-800">{item.sold}</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
              
              {/* RESUMO FINANCEIRO */}
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex flex-col h-fit sticky top-6">
                  <h3 className="font-bold text-slate-800 flex items-center mb-6 text-lg border-b border-slate-100 pb-4">
                      <Calculator className="w-5 h-5 mr-2 text-brand-plum" />
                      Acerto Financeiro
                  </h3>
                  
                  <div className="space-y-4 flex-1">
                      <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500">Valor Total em Posse</span>
                          <span className="font-medium">R$ {totalInventoryValue.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500">Total Faturado</span>
                          <span className="font-medium">R$ {totalSoldValue.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm pb-3 border-b border-slate-100">
                          <span className="text-slate-500">Comissão Promotor ({commissionPercent}%)</span>
                          <span className="font-medium text-brand-plum">R$ {totalCommission.toFixed(2)}</span>
                      </div>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-slate-200">
                      <div className="flex justify-between items-center mb-6">
                          <span className="text-base text-slate-600 font-medium">Valor a Receber</span>
                          <span className="text-2xl font-bold text-slate-800">
                              R$ {finalAmountToPay.toFixed(2)}
                          </span>
                      </div>
                      
                      <Button 
                          onClick={handleFinalize} 
                          disabled={submitting || totalSoldValue === 0 && promoterInventory.every(i => i.returned === 0)} 
                          className="w-full bg-brand-plum hover:bg-brand-rose text-white h-12 rounded-xl text-base font-bold transition-all shadow-md hover:shadow-lg"
                      >
                          {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                              <>
                                  <CheckCircle className="w-5 h-5 mr-2" />
                                  Finalizar Acerto
                              </>
                          )}
                      </Button>
                      <p className="text-xs text-center text-slate-400 mt-3">
                          As peças devolvidas voltarão para o Estoque Geral.
                      </p>
                  </div>
              </div>
          </div>
      )}
      
      {selectedPromoterId && promoterInventory.length === 0 && (
          <div className="bg-white p-8 text-center rounded-3xl border border-slate-200">
              <p className="text-slate-500">Este promotor não possui estoque pendente.</p>
          </div>
      )}
      
    </div>
  );
}
