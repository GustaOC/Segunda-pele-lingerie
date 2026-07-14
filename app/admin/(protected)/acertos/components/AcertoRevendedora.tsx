"use client";

import { useState, useEffect } from "react";
import { User, Package, Search, Calculator, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { addDays, differenceInDays } from "date-fns";

export default function AcertoRevendedora({ isPromoter }: { isPromoter: boolean }) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [resellers, setResellers] = useState<any[]>([]);
  const [selectedResellerId, setSelectedResellerId] = useState("");
  
  const [kits, setKits] = useState<any[]>([]);
  const [selectedKitId, setSelectedKitId] = useState("");
  
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  
  const [kitItems, setKitItems] = useState<any[]>([]);
  
  // States for calculation
  const [isFirstKit, setIsFirstKit] = useState(false);
  
  const supabase = createClient();
  const { toast } = useToast();

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    // In real scenario, we might want all resellers if Admin, or just linked if Promoter
    // For now, let's fetch all resellers if Admin, or specific if Promoter
    const promoterId = session.user.id;
    let resQuery = supabase.from('resellers').select('*').order('name');
    if (isPromoter) {
        resQuery = resQuery.eq('promoter_id', promoterId);
    }
    
    const [resRes, prodRes, catRes] = await Promise.all([
      resQuery,
      supabase.from('products').select('*'),
      supabase.from('categories').select('*')
    ]);

    if (resRes.data) setResellers(resRes.data);
    if (prodRes.data) setProducts(prodRes.data);
    if (catRes.data) setCategories(catRes.data);
    
    setLoading(false);
  };

  useEffect(() => {
    if (!selectedResellerId) {
      setKits([]);
      setSelectedKitId("");
      return;
    }
    fetchKits(selectedResellerId);
  }, [selectedResellerId]);

  const fetchKits = async (resellerId: string) => {
    // only fetch active/open kits? We can fetch all that are not fully returned
    const { data } = await supabase.from('promoter_kits')
      .select('*, items:promoter_kit_items(*)')
      .eq('reseller_id', resellerId)
      .order('created_at', { ascending: false });
    
    if (data) {
        setKits(data);
    }
  };

  useEffect(() => {
      if (!selectedKitId) {
          setKitItems([]);
          return;
      }
      const kit = kits.find(k => k.id === selectedKitId);
      if (kit && kit.items) {
          // Initialize items with quantity (enviado) and returned = 0
          const itemsWithDetails = kit.items.map((item: any) => {
              const prod = products.find(p => p.id === item.product_id);
              const cat = prod ? categories.find(c => c.id === prod.category_id) : null;
              const isRoupa = cat ? cat.name.toLowerCase().includes('roupa') : false;
              
              return {
                  ...item,
                  product_name: prod ? prod.name : 'Desconhecido',
                  price: prod ? prod.price : 0,
                  sku: prod ? prod.sku : '',
                  isRoupa,
                  returned: 0,
                  sold: item.quantity
              };
          });
          setKitItems(itemsWithDetails);
      }
  }, [selectedKitId]);

  const handleReturnedChange = (itemId: string, value: string) => {
      let returned = parseInt(value) || 0;
      setKitItems(prev => prev.map(item => {
          if (item.id === itemId) {
              if (returned > item.quantity) returned = item.quantity;
              if (returned < 0) returned = 0;
              return { ...item, returned, sold: item.quantity - returned };
          }
          return item;
      }));
  };

  // Calculations
  let totalKitValue = 0;
  let totalSoldValue = 0;
  let totalSoldRoupas = 0;
  let totalSoldNormal = 0;
  
  kitItems.forEach(item => {
      const itemTotal = item.quantity * item.price;
      const soldValue = item.sold * item.price;
      
      totalKitValue += itemTotal;
      totalSoldValue += soldValue;
      
      if (item.isRoupa) {
          totalSoldRoupas += soldValue;
      } else {
          totalSoldNormal += soldValue;
      }
  });

  const percentSold = totalKitValue > 0 ? (totalSoldValue / totalKitValue) * 100 : 0;
  
  let normalCommissionPercent = 0;
  if (percentSold >= 100) normalCommissionPercent = 40;
  else if (percentSold >= 70) normalCommissionPercent = 35;
  else if (percentSold >= 30) normalCommissionPercent = 30;
  else normalCommissionPercent = 0;

  let commissionNormal = totalSoldNormal * (normalCommissionPercent / 100);
  let commissionRoupas = totalSoldRoupas * 0.25; // Roupas is fixed at 25%
  
  let totalCommission = commissionNormal + commissionRoupas;
  
  // Rule: 1º Kit é valido mínimo de venda de R$ 250,00 para ter comissão
  if (isFirstKit && totalSoldValue < 250) {
      totalCommission = 0;
  }
  
  const selectedKit = kits.find(k => k.id === selectedKitId);
  const transferDate = selectedKit ? new Date(selectedKit.created_at) : new Date();
  const dueDate = addDays(transferDate, 45);
  const today = new Date();
  const daysLate = differenceInDays(today, dueDate);
  
  let fineAmount = 0;
  let isExpiredReturn = false;
  
  const netAmountOwed = totalSoldValue - totalCommission;

  if (daysLate > 0) {
      // Após o vencimento multa de 5% + 0,33% ao dia
      // Assuming the fine applies to the Net Amount Owed
      const finePercent = 5 + (0.33 * daysLate);
      fineAmount = netAmountOwed * (finePercent / 100);
  }
  
  if (daysLate > 7) {
      // Não aceitamos devolução de mercadorias após 7 dias do vencimento
      isExpiredReturn = true;
  }
  
  const finalAmountToPay = netAmountOwed + fineAmount;

  const handleFinalize = async () => {
      if (!selectedKitId) return;
      
      if (isExpiredReturn) {
          const confirm = window.confirm("ATENÇÃO: Este kit está vencido há mais de 7 dias. Pelas regras, não é aceita devolução. Deseja registrar o acerto mesmo assim?");
          if (!confirm) return;
      }

      setSubmitting(true);
      try {
          const { data: { session } } = await supabase.auth.getSession();
          const adminId = session?.user.id;
          
          // 1. Process returned items to Promoter Inventory (promoter_inventory)
          const targetPromoterId = selectedKit?.promoter_id || resellers.find(r => r.id === selectedResellerId)?.promoter_id;
          
          for (const item of kitItems) {
              if (item.returned > 0 && targetPromoterId) {
                  // Find promoter inventory item
                  const { data: invData } = await supabase.from('promoter_inventory')
                      .select('*')
                      .eq('promoter_id', targetPromoterId)
                      .eq('product_id', item.product_id)
                      .eq('color', item.color)
                      .eq('size', item.size)
                      .maybeSingle();
                      
                  if (invData) {
                      await supabase.from('promoter_inventory').update({ 
                          quantity: invData.quantity + item.returned 
                      }).eq('id', invData.id);
                  } else {
                      await supabase.from('promoter_inventory').insert({
                          promoter_id: targetPromoterId,
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
                      notes: `Devolução do Acerto [Kit: ${selectedKitId}] (Revendedora: ${resellers.find(r=>r.id===selectedResellerId)?.name}) para Promotor`
                  });
              }
              
              // 2. Update promoter_kit_items (reduce quantity to what was actually sold, or just leave it and rely on a status flag)
              // We will just subtract the returned pieces from the kit, so the kit reflects what was kept/sold
              if (item.returned > 0) {
                  const newQty = item.quantity - item.returned;
                  if (newQty > 0) {
                      await supabase.from('promoter_kit_items').update({ quantity: newQty }).eq('id', item.id);
                  } else {
                      await supabase.from('promoter_kit_items').delete().eq('id', item.id);
                  }
              }
          }
          
          // 3. Mark Kit as Settled (Update name to include [FINALIZADO])
          const kitName = selectedKit?.name || `Kit #${selectedKitId.substring(0,8)}`;
          if (!kitName.includes('[FINALIZADO]')) {
              await supabase.from('promoter_kits').update({ 
                  name: `${kitName} [FINALIZADO]`
              }).eq('id', selectedKitId);
          }
          
          toast({
              title: "Acerto Finalizado!",
              description: "O acerto foi registrado e o estoque geral foi atualizado com as devoluções.",
              className: "bg-green-50 text-green-900 border-green-200"
          });
          
          // Reset
          setSelectedKitId("");
          fetchKits(selectedResellerId);
          
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

  const isFinalizado = selectedKit?.name?.includes('[FINALIZADO]') || false;

  return (
    <div className="space-y-6">
      
      {/* SELETORES */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Revendedora</label>
                  <select 
                      value={selectedResellerId} 
                      onChange={(e) => setSelectedResellerId(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:border-brand-plum bg-slate-50"
                  >
                      <option value="">Selecione uma revendedora...</option>
                      {resellers.map(r => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                  </select>
              </div>
              
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Período / Kit</label>
                  <select 
                      value={selectedKitId} 
                      onChange={(e) => setSelectedKitId(e.target.value)}
                      disabled={!selectedResellerId || kits.length === 0}
                      className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:border-brand-plum bg-slate-50 disabled:opacity-50"
                  >
                      <option value="">{kits.length === 0 ? "Nenhum kit encontrado" : "Selecione o período/kit..."}</option>
                      {kits.map(k => (
                          <option key={k.id} value={k.id}>
                              {k.period ? `[${k.period}] - ` : ''}{new Date(k.created_at).toLocaleDateString()} - Pedido: {k.id.substring(0,8).toUpperCase()} {k.name?.includes('[FINALIZADO]') ? '✅ FINALIZADO' : ''}
                          </option>
                      ))}
                  </select>
              </div>
          </div>
          
          <div className="mt-4 flex items-center gap-2">
              <input type="checkbox" id="firstKit" checked={isFirstKit} onChange={(e) => setIsFirstKit(e.target.checked)} className="rounded text-brand-plum focus:ring-brand-plum w-4 h-4" />
              <label htmlFor="firstKit" className="text-sm font-medium text-slate-700">Este é o 1º Kit da revendedora? (Mínimo de R$ 250,00 para comissão)</label>
          </div>
      </div>
      
      {selectedKitId && kitItems.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* LISTA DE ITENS */}
              <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                      <h3 className="font-bold text-slate-800 flex items-center">
                          <Package className="w-5 h-5 mr-2 text-brand-plum" />
                          Itens do Kit
                      </h3>
                  </div>
                  
                  <div className="p-0 overflow-x-auto">
                      <table className="w-full text-sm text-left text-slate-600">
                          <thead className="text-xs uppercase bg-slate-50 text-slate-500 border-b border-slate-100">
                              <tr>
                                  <th className="px-4 py-3">Produto</th>
                                  <th className="px-4 py-3 text-center">Enviado</th>
                                  <th className="px-4 py-3 text-center">Devolvido</th>
                                  <th className="px-4 py-3 text-center">Vendido</th>
                                  <th className="px-4 py-3 text-right">R$ Venda</th>
                              </tr>
                          </thead>
                          <tbody>
                              {kitItems.map((item) => (
                                  <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                                      <td className="px-4 py-3">
                                          <div className="font-medium text-slate-800">{item.sku} - {item.product_name}</div>
                                          <div className="text-xs text-slate-500">{item.size} | {item.color} {item.isRoupa && <span className="ml-2 bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Roupa (25%)</span>}</div>
                                      </td>
                                      <td className="px-4 py-3 text-center font-medium bg-slate-50/50">{item.quantity}</td>
                                      <td className="px-4 py-3">
                                          <input 
                                              type="number" 
                                              min="0" 
                                              max={item.quantity}
                                              value={item.returned}
                                              onChange={(e) => handleReturnedChange(item.id, e.target.value)}
                                              disabled={isFinalizado}
                                              className="w-20 mx-auto text-center border border-slate-200 rounded-lg p-1 outline-none focus:border-brand-plum bg-white disabled:bg-slate-100 disabled:text-slate-400"
                                          />
                                      </td>
                                      <td className="px-4 py-3 text-center font-bold text-slate-800">{item.sold}</td>
                                      <td className="px-4 py-3 text-right font-medium">R$ {(item.sold * item.price).toFixed(2)}</td>
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
                          <span className="text-slate-500">Valor Total do Kit</span>
                          <span className="font-medium">R$ {totalKitValue.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500">Total Vendido</span>
                          <span className="font-medium">R$ {totalSoldValue.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm pb-3 border-b border-slate-100">
                          <span className="text-slate-500">% Vendido</span>
                          <span className={`font-bold ${percentSold >= 30 ? 'text-green-600' : 'text-red-500'}`}>
                              {percentSold.toFixed(1)}%
                          </span>
                      </div>
                      
                      <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500">Comissão (Geral: {normalCommissionPercent}%)</span>
                          <span className="font-medium text-brand-plum">R$ {commissionNormal.toFixed(2)}</span>
                      </div>
                      
                      {totalSoldRoupas > 0 && (
                          <div className="flex justify-between items-center text-sm">
                              <span className="text-slate-500">Comissão Roupas (25%)</span>
                              <span className="font-medium text-brand-plum">R$ {commissionRoupas.toFixed(2)}</span>
                          </div>
                      )}
                      
                      <div className="flex justify-between items-center text-sm pb-3 border-b border-slate-100">
                          <span className="text-slate-500 font-bold">Total Comissão</span>
                          <span className="font-bold text-brand-plum">
                              R$ {totalCommission.toFixed(2)}
                              {isFirstKit && totalSoldValue < 250 && <span className="block text-xs text-red-500 font-normal">Anulada (Venda &lt; R$ 250)</span>}
                          </span>
                      </div>
                      
                      {daysLate > 0 && (
                          <div className="bg-red-50 text-red-700 p-3 rounded-xl border border-red-100 space-y-1 mb-2">
                              <div className="flex justify-between items-center text-sm">
                                  <span>Dias de Atraso</span>
                                  <span className="font-bold">{daysLate} dias</span>
                              </div>
                              <div className="flex justify-between items-center text-sm">
                                  <span>Multa (5% + 0.33%/dia)</span>
                                  <span className="font-bold">R$ {fineAmount.toFixed(2)}</span>
                              </div>
                          </div>
                      )}
                      
                      {isExpiredReturn && (
                          <div className="bg-red-100 text-red-800 p-3 rounded-xl border border-red-200 text-sm flex items-start gap-2 mb-2 font-medium">
                              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                              Prazo de devolução (7 dias após o vencimento) expirado!
                          </div>
                      )}
                      
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
                          disabled={submitting || totalSoldValue === 0 && kitItems.every(i => i.returned === 0) || isFinalizado} 
                          className={`w-full h-12 rounded-xl text-base font-bold transition-all shadow-md hover:shadow-lg ${isFinalizado ? 'bg-green-600 text-white hover:bg-green-600' : 'bg-brand-plum hover:bg-brand-rose text-white'}`}
                      >
                          {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                              <>
                                  <CheckCircle className="w-5 h-5 mr-2" />
                                  {isFinalizado ? "Acerto Finalizado" : "Finalizar Acerto"}
                              </>
                          )}
                      </Button>
                      <p className="text-xs text-center text-slate-400 mt-3">
                          As peças devolvidas voltarão para o estoque do Promotor.
                      </p>
                  </div>
              </div>
          </div>
      )}
      
    </div>
  );
}
