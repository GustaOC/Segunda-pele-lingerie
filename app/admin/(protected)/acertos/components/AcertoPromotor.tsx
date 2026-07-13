"use client";

import { useState, useEffect } from "react";
import { Users, Package, Search, Calculator, CheckCircle, Loader2, History } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function AcertoPromotor() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [promoters, setPromoters] = useState<any[]>([]);
  const [selectedPromoterId, setSelectedPromoterId] = useState("");
  
  const [products, setProducts] = useState<any[]>([]);
  const [promoterInventory, setPromoterInventory] = useState<any[]>([]);
  const [pendingKits, setPendingKits] = useState<string[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyData, setHistoryData] = useState<any[]>([]);
  
  const [periods, setPeriods] = useState<string[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState("");
  
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
        setPeriods([]);
        setSelectedPeriod("");
        return;
    }
    fetchPeriods(selectedPromoterId);
  }, [selectedPromoterId]);

  const fetchPeriods = async (promoterId: string) => {
      const { data: invData } = await supabase.from('promoter_inventory').select('period').eq('promoter_id', promoterId);
      const { data: kitsData } = await supabase.from('promoter_kits').select('period').eq('promoter_id', promoterId).like('name', '%[FINALIZADO]%').not('name', 'like', '%[ACERTADO]%');
      
      // Fetch finalized periods
      const { data: acertosData } = await supabase.from('promoter_acertos').select('period').eq('promoter_id', promoterId);
      const finalizedPeriods = new Set(acertosData?.map(a => a.period) || []);
      
      const periodSet = new Set<string>();
      if (invData) invData.forEach(i => i.period && !finalizedPeriods.has(i.period) && periodSet.add(i.period));
      if (kitsData) kitsData.forEach(k => k.period && !finalizedPeriods.has(k.period) && periodSet.add(k.period));
      
      const uniquePeriods = Array.from(periodSet).sort();
      setPeriods(uniquePeriods);
      setSelectedPeriod("");
      setPromoterInventory([]);
  };

  useEffect(() => {
      if (!selectedPromoterId || !selectedPeriod) {
          setPromoterInventory([]);
          return;
      }
      fetchPromoterInventory(selectedPromoterId, selectedPeriod);
  }, [selectedPromoterId, selectedPeriod]);

  const fetchPromoterInventory = async (promoterId: string, period: string) => {
      // 1. Fetch physical inventory
      const { data: invData } = await supabase.from('promoter_inventory')
        .select('*')
        .eq('promoter_id', promoterId)
        .eq('period', period);
        
      // 2. Fetch sold items from finalized kits
      const { data: kits } = await supabase.from('promoter_kits')
          .select('id')
          .eq('promoter_id', promoterId)
          .eq('period', period)
          .like('name', '%[FINALIZADO]%')
          .not('name', 'like', '%[ACERTADO]%');
          
      let soldItems: any[] = [];
      if (kits && kits.length > 0) {
          const kitIds = kits.map((k: any) => k.id);
          const { data: kitItems } = await supabase.from('promoter_kit_items')
              .select('*')
              .in('kit_id', kitIds);
          if (kitItems) soldItems = kitItems;
      }
      
      setPendingKits(kits ? kits.map((k: any) => k.id) : []);
      
      // 3. Combine them
      const combinedMap = new Map();
      
      if (invData) {
          invData.forEach((inv: any) => {
              const key = `${inv.product_id}_${inv.size}_${inv.color}`;
              combinedMap.set(key, {
                  id: inv.id,
                  product_id: inv.product_id,
                  size: inv.size,
                  color: inv.color,
                  em_posse: inv.quantity,
                  vendido_revendedora: 0,
                  returned: 0
              });
          });
      }
      
      soldItems.forEach((sold: any) => {
          const key = `${sold.product_id}_${sold.size}_${sold.color}`;
          if (combinedMap.has(key)) {
              const item = combinedMap.get(key);
              item.vendido_revendedora += sold.quantity;
          } else {
              combinedMap.set(key, {
                  id: `sold_${key}`,
                  product_id: sold.product_id,
                  size: sold.size,
                  color: sold.color,
                  em_posse: 0,
                  vendido_revendedora: sold.quantity,
                  returned: 0
              });
          }
      });
      
      const mapped = Array.from(combinedMap.values()).map(item => {
          const p = products.find(prod => prod.id === item.product_id);
          return {
              ...item,
              product_name: p ? p.name : 'Desconhecido',
              price: p ? p.price : 0,
              sku: p ? p.sku : '',
              quantity: item.em_posse, // for compatibility
              sold: item.vendido_revendedora
          };
      });
      
      setPromoterInventory(mapped);
  };

  const handleReturnedChange = (itemId: string, value: string) => {
      let returned = parseInt(value) || 0;
      setPromoterInventory(prev => prev.map(item => {
          if (item.id === itemId) {
              if (returned > item.em_posse) returned = item.em_posse;
              if (returned < 0) returned = 0;
              return { ...item, returned, sold: item.vendido_revendedora };
          }
          return item;
      }));
  };

  // Calculations
  let totalInventoryValue = 0;
  let totalSoldValue = 0;
  
  promoterInventory.forEach(item => {
      totalInventoryValue += (item.em_posse * item.price);
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
              
              // 2. Reduce promoter inventory (only for returned items)
              if (item.id && !item.id.startsWith('sold_')) {
                  if (item.returned > 0) {
                      if (item.returned >= item.em_posse) {
                          await supabase.from('promoter_inventory').delete().eq('id', item.id);
                      } else {
                          await supabase.from('promoter_inventory').update({ quantity: item.em_posse - item.returned }).eq('id', item.id);
                      }
                  }
              }
          }
          
          // 3. Mark pending kits as [ACERTADO]
          if (pendingKits.length > 0) {
              for (const kitId of pendingKits) {
                  const { data: kitData } = await supabase.from('promoter_kits').select('name').eq('id', kitId).single();
                  if (kitData && !kitData.name.includes('[ACERTADO]')) {
                      await supabase.from('promoter_kits').update({ name: `${kitData.name} [ACERTADO]` }).eq('id', kitId);
                  }
              }
          }
          
          // 4. Save Acerto History
          await supabase.from('promoter_acertos').insert({
              promoter_id: selectedPromoterId,
              period: selectedPeriod,
              total_sold: totalSoldValue,
              total_commission: totalCommission,
              total_paid: finalAmountToPay,
              created_by: adminId
          });
          
          toast({
              title: "Acerto Finalizado!",
              description: "Acerto do promotor registrado e estoque geral atualizado.",
              className: "bg-green-50 text-green-900 border-green-200"
          });
          
          fetchPromoterInventory(selectedPromoterId, selectedPeriod);
          fetchPeriods(selectedPromoterId);
          
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

  const fetchHistory = async () => {
    const { data } = await supabase.from('promoter_acertos')
      .select('*, profiles!promoter_acertos_promoter_id_fkey(nome)')
      .order('created_at', { ascending: false });
    if (data) setHistoryData(data);
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-brand-plum" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
          <Button 
              variant="outline" 
              onClick={() => { fetchHistory(); setIsHistoryOpen(true); }}
              className="text-brand-plum border-brand-plum hover:bg-brand-plum hover:text-white"
          >
              <History className="w-4 h-4 mr-2" />
              Ver Histórico de Acertos
          </Button>
      </div>
      
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
          <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Período / Semana</label>
              <select 
                  value={selectedPeriod} 
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  disabled={!selectedPromoterId || periods.length === 0}
                  className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:border-brand-plum bg-slate-50 disabled:opacity-50"
              >
                  <option value="">{periods.length === 0 ? "Nenhum período pendente" : "Selecione o período..."}</option>
                  {periods.map(p => (
                      <option key={p} value={p}>{p}</option>
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
                                      <td className="px-4 py-3 text-center font-medium bg-slate-50/50">{item.em_posse}</td>
                                      <td className="px-4 py-3 text-center">
                                          <input 
                                              type="number" 
                                              min="0" 
                                              max={item.em_posse}
                                              value={item.returned}
                                              disabled={item.em_posse === 0}
                                              onChange={(e) => handleReturnedChange(item.id, e.target.value)}
                                              className="w-20 mx-auto text-center border border-slate-200 rounded-lg p-1 outline-none focus:border-brand-plum bg-white disabled:bg-slate-100 disabled:text-slate-400"
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
                          disabled={submitting} 
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

      {/* HISTORICO MODAL */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Histórico de Acertos</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {historyData.length === 0 ? (
              <div className="text-center py-8 text-slate-500">Nenhum acerto registrado.</div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Data</th>
                      <th className="px-4 py-3 font-semibold">Promotor</th>
                      <th className="px-4 py-3 font-semibold">Período</th>
                      <th className="px-4 py-3 font-semibold text-right">Faturado</th>
                      <th className="px-4 py-3 font-semibold text-right">Comissão</th>
                      <th className="px-4 py-3 font-semibold text-right">Valor Pago</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {historyData.map(h => (
                      <tr key={h.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 text-slate-600">{new Date(h.created_at).toLocaleDateString('pt-BR')}</td>
                        <td className="px-4 py-3 font-medium text-slate-800">{h.profiles?.nome || 'Desconhecido'}</td>
                        <td className="px-4 py-3 text-slate-600">{h.period}</td>
                        <td className="px-4 py-3 text-right text-slate-800">R$ {h.total_sold.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-brand-plum">R$ {h.total_commission.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-600">R$ {h.total_paid.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
