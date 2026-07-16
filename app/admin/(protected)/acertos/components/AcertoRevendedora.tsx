"use client";

import { useState, useEffect } from "react";
import { User, Package, Search, Calculator, CheckCircle, AlertTriangle, Loader2, History, Download, X, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { addDays, differenceInDays } from "date-fns";
import { generateAcertoPDF } from "../utils/generateAcertoPDF";

export default function AcertoRevendedora({ isPromoter }: { isPromoter: boolean }) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [resellers, setResellers] = useState<any[]>([]);
  const [selectedResellerId, setSelectedResellerId] = useState("");
  const [promoters, setPromoters] = useState<any[]>([]);
  const [selectedPromoterId, setSelectedPromoterId] = useState("");
  
  const [kits, setKits] = useState<any[]>([]);
  const [selectedKitId, setSelectedKitId] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [kitsFromAll, setKitsFromAll] = useState<any[]>([]);
  const [kitItems, setKitItems] = useState<any[]>([]);
  
  // History Modal States
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyKits, setHistoryKits] = useState<any[]>([]);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  // States for calculation
  const [isFirstKit, setIsFirstKit] = useState(false);
  
  // Installment states
  const [isInstallment, setIsInstallment] = useState(false);
  const [paidNow, setPaidNow] = useState<string>("");
  const [installmentDueDate, setInstallmentDueDate] = useState<string>("");
  
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
    
    const [resRes, prodRes, catRes, promRes] = await Promise.all([
      resQuery,
      supabase.from('products').select('*'),
      supabase.from('categories').select('*'),
      !isPromoter ? fetch('/api/admin/user').then(res => res.json()).then(data => ({ data: (data.data || []).filter((u: any) => u.role === 'PROMOTOR').sort((a: any, b: any) => a.nome.localeCompare(b.nome)) })) : Promise.resolve({ data: [] })
    ]);

    if (resRes.data) setResellers(resRes.data);
    if (prodRes.data) setProducts(prodRes.data);
    if (catRes.data) setCategories(catRes.data);
    if (promRes.data) setPromoters(promRes.data);
    
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
    
    // We need to keep a reference to ALL kits so we can show history, even if restricted from dropdown
    let allKits = data || [];
    setKitsFromAll(allKits); // We'll add this state to keep track of all kits for history

    if (data) {
        if (isPromoter) {
            const nonFinalized = data.filter(k => !k.name?.includes('[FINALIZADO]'));
            if (nonFinalized.length > 0) {
                setKits([nonFinalized[0]]);
                setSelectedKitId(nonFinalized[0].id);
            } else {
                setKits([]);
            }
        } else {
            setKits(data);
        }
    }
  };

  useEffect(() => {
      if (!selectedKitId) {
          setKitItems([]);
          return;
      }
      
      const fetchDetails = async () => {
          const kit = kits.find(k => k.id === selectedKitId);
          if (kit && kit.items) {
              let returnedMap: Record<string, number> = {};
              
              if (kit.name?.includes('[FINALIZADO]')) {
                  // Fetch inventory transactions to find returned quantities
                  const { data: txs } = await supabase.from('inventory_transactions')
                      .select('product_id, color, size, quantity')
                      .like('notes', `%[Kit: ${kit.id}]%`);
                      
                  if (txs) {
                      txs.forEach(tx => {
                          const key = `${tx.product_id}-${tx.color}-${tx.size}`;
                          returnedMap[key] = (returnedMap[key] || 0) + tx.quantity;
                      });
                  }
              }

              const itemsWithDetails = kit.items.map((item: any) => {
                  const prod = products.find(p => p.id === item.product_id);
                  const cat = prod ? categories.find(c => c.id === prod.category_id) : null;
                  const isRoupa = cat ? cat.name.toLowerCase().includes('roupa') : false;
                  
                  const key = `${item.product_id}-${item.color}-${item.size}`;
                  const returned = returnedMap[key] || 0;
                  
                  return {
                      ...item,
                      product_name: prod ? prod.name : 'Desconhecido',
                      price: prod ? prod.price : 0,
                      sku: prod ? prod.sku : '',
                      isRoupa,
                      returned: returned,
                      sold: item.quantity - returned
                  };
              });
              setKitItems(itemsWithDetails);
          }
      };
      
      fetchDetails();
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
              
              // 2. We do NOT update promoter_kit_items quantity here.
              // We want to keep the original "Enviado" quantity for the history.
              // The returned items are recorded in inventory_transactions.
          }
          
          // 3. Mark Kit as Settled (Update name to include [FINALIZADO])
          const kitName = selectedKit?.name || `Kit #${selectedKitId.substring(0,8)}`;
          if (!kitName.includes('[FINALIZADO]')) {
              await supabase.from('promoter_kits').update({ 
                  name: `${kitName} [FINALIZADO]`
              }).eq('id', selectedKitId);
          }
          
          // 4. Installments to Finance
          if (isInstallment) {
              const paidAmount = parseFloat(paidNow) || 0;
              const remainingAmount = finalAmountToPay - paidAmount;
              if (remainingAmount > 0 && installmentDueDate) {
                  // Receiveable from Reseller
                  await supabase.from('financial_transactions').insert({
                      type: 'RECEIVABLE',
                      description: `Parcela Acerto Revendedora (${resellers.find(r=>r.id===selectedResellerId)?.name}) - Kit #${selectedKitId.substring(0,8)}`,
                      total_value: parseFloat(remainingAmount.toFixed(2)),
                      due_date: installmentDueDate,
                      installment: '1/1',
                      status: 'NAO_PAGO'
                  });
              }
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

  const handleDownloadPDF = async (kit: any) => {
      setIsDownloading(kit.id);
      try {
          let returnedMap: Record<string, number> = {};
          
          if (kit.name?.includes('[FINALIZADO]')) {
              const { data: txs } = await supabase.from('inventory_transactions')
                  .select('product_id, color, size, quantity')
                  .like('notes', `%[Kit: ${kit.id}]%`);
                  
              if (txs) {
                  txs.forEach(tx => {
                      const key = `${tx.product_id}-${tx.color}-${tx.size}`;
                      returnedMap[key] = (returnedMap[key] || 0) + tx.quantity;
                  });
              }
          }

          const localKitItems = kit.items.map((item: any) => {
              const prod = products.find(p => p.id === item.product_id);
              const cat = prod ? categories.find(c => c.id === prod.category_id) : null;
              const isRoupa = cat ? cat.name.toLowerCase().includes('roupa') : false;
              
              const key = `${item.product_id}-${item.color}-${item.size}`;
              const returned = returnedMap[key] || 0;
              
              return {
                  ...item,
                  product_name: prod ? prod.name : 'Desconhecido',
                  price: prod ? prod.price : 0,
                  sku: prod ? prod.sku : '',
                  isRoupa,
                  returned: returned,
                  sold: item.quantity - returned
              };
          });

          // Calculations for PDF
          let sumTotalKit = 0;
          let sumSoldValue = 0;
          let sumSoldRoupas = 0;
          let sumSoldNormal = 0;
          
          localKitItems.forEach((item: any) => {
              const itemTotal = item.quantity * item.price;
              const soldValue = item.sold * item.price;
              
              sumTotalKit += itemTotal;
              sumSoldValue += soldValue;
              
              if (item.isRoupa) {
                  sumSoldRoupas += soldValue;
              } else {
                  sumSoldNormal += soldValue;
              }
          });

          const pctSold = sumTotalKit > 0 ? (sumSoldValue / sumTotalKit) * 100 : 0;
          
          let normComm = 0;
          if (pctSold >= 100) normComm = 40;
          else if (pctSold >= 70) normComm = 35;
          else if (pctSold >= 30) normComm = 30;
          
          let cNormal = sumSoldNormal * (normComm / 100);
          let cRoupas = sumSoldRoupas * 0.25;
          let tComm = cNormal + cRoupas;
          
          // First Kit rule checking wasn't persisted in DB for history unfortunately, 
          // but we can assume normal rules apply. To be perfectly accurate we would need to know if it was first kit.
          // For simplicity, we apply the > 250 rule if it's generally low.
          // Since we can't reliably know if it was the first kit, we'll skip the first kit rule in historical PDF
          // unless it was saved.
          
          const tDate = new Date(kit.created_at);
          const dDate = addDays(tDate, 45);
          const dLate = differenceInDays(new Date(), dDate);
          
          let fine = 0;
          const net = sumSoldValue - tComm;

          // For a finalized kit, the fine might have been applied at finalization time.
          // Since we don't have finalization date in promoter_kits, we calculate based on today.
          // Ideally we would have a 'finalized_at' or 'acerto' row. 
          
          const reseller = resellers.find(r => r.id === selectedResellerId) || {};
          
          const { data: { session } } = await supabase.auth.getSession();
          let promoterName = "PROMOTOR(A)";
          if (session?.user?.user_metadata?.name) {
              promoterName = session.user.user_metadata.name;
          } else if (reseller?.promoter_id) {
              const { data: pData } = await supabase.from('profiles').select('nome').eq('id', reseller.promoter_id).maybeSingle();
              if (pData) promoterName = pData.nome;
          }
          
          generateAcertoPDF(reseller, promoterName, kit, localKitItems, {
              totalKitValue: sumTotalKit,
              totalSoldValue: sumSoldValue,
              percentSold: pctSold,
              commissionNormal: cNormal,
              commissionRoupas: cRoupas,
              totalCommission: tComm,
              fineAmount: fine,
              finalAmountToPay: net + fine,
              daysLate: dLate > 0 ? dLate : 0,
              isInstallment,
              paidNow: parseFloat(paidNow) || 0,
              installmentDueDate
          });

      } catch (err) {
          console.error(err);
          toast({
              title: "Erro",
              description: "Não foi possível gerar o PDF.",
              variant: "destructive"
          });
      } finally {
          setIsDownloading(null);
      }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-brand-plum" /></div>;

  const isFinalizado = selectedKit?.name?.includes('[FINALIZADO]') || false;

  return (
    <div className="space-y-6">
      
      {/* SELETORES */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
          {!isPromoter && (
              <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Filtrar por Promotor</label>
                  <SearchableSelect
                      options={promoters.map(p => ({ value: p.id, label: p.nome || p.email }))}
                      value={selectedPromoterId}
                      onChange={(val) => {
                          setSelectedPromoterId(val);
                          setSelectedResellerId("");
                      }}
                      placeholder="Todos os Promotores"
                      emptyMessage="Nenhum promotor encontrado."
                  />
              </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-medium text-slate-700">Revendedora</label>
                  </div>
                  <SearchableSelect
                      options={(isPromoter ? resellers : (selectedPromoterId ? resellers.filter(r => r.promoter_id === selectedPromoterId) : resellers)).map(r => ({ value: r.id, label: r.name }))}
                      value={selectedResellerId}
                      onChange={(val) => setSelectedResellerId(val)}
                      placeholder="Selecione uma revendedora..."
                      emptyMessage="Nenhuma revendedora encontrada."
                  />
                  
                  <div className="mt-3">
                      <Button 
                          onClick={() => {
                              const revKits = isPromoter ? kitsFromAll.filter(k => k.name?.includes('[FINALIZADO]')) : kits.filter(k => k.name?.includes('[FINALIZADO]'));
                              setHistoryKits(revKits);
                              setShowHistoryModal(true);
                          }}
                          variant="outline"
                          disabled={!selectedResellerId}
                          className="w-full text-brand-plum border-brand-plum/30 hover:bg-brand-plum hover:text-white disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-brand-plum"
                      >
                          <History className="w-4 h-4 mr-2" />
                          Ver Histórico da Revendedora
                      </Button>
                  </div>
              </div>
              
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Período / Kit</label>
                  <SearchableSelect
                      options={kits.map(k => ({
                          value: k.id,
                          label: `${k.period ? `[${k.period}] - ` : ''}${new Date(k.created_at).toLocaleDateString()} - Pedido: ${k.id.substring(0,8).toUpperCase()} ${k.name?.includes('[FINALIZADO]') ? '✅ FINALIZADO' : ''}`
                      }))}
                      value={selectedKitId}
                      onChange={(val) => setSelectedKitId(val)}
                      placeholder={kits.length === 0 ? "Nenhum kit encontrado" : "Selecione o período/kit..."}
                      emptyMessage="Nenhum kit encontrado"
                      disabled={!selectedResellerId || kits.length === 0}
                  />
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
                      <div className="mb-6 space-y-4">
                          <div className="flex items-center gap-2 mb-2">
                              <input 
                                  type="checkbox" 
                                  id="isInstallment" 
                                  checked={isInstallment} 
                                  onChange={(e) => setIsInstallment(e.target.checked)} 
                                  disabled={isFinalizado}
                                  className="rounded text-brand-plum focus:ring-brand-plum w-4 h-4" 
                              />
                              <label htmlFor="isInstallment" className="text-sm font-medium text-slate-700">
                                  Pagamento Parcial (Lançar Restante no Financeiro)
                              </label>
                          </div>
                          
                          {isInstallment && (
                              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                                  <div>
                                      <label className="block text-xs font-medium text-slate-500 mb-1">Valor Pago no Ato (R$)</label>
                                      <input 
                                          type="number" 
                                          min="0"
                                          step="0.01"
                                          value={paidNow}
                                          onChange={(e) => setPaidNow(e.target.value)}
                                          disabled={isFinalizado}
                                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-brand-plum text-sm"
                                          placeholder="Ex: 300.00"
                                      />
                                  </div>
                                  <div className="flex justify-between items-center text-sm">
                                      <span className="text-slate-500">Valor Restante:</span>
                                      <span className="font-bold text-red-600">
                                          R$ {Math.max(0, finalAmountToPay - (parseFloat(paidNow) || 0)).toFixed(2)}
                                      </span>
                                  </div>
                                  <div>
                                      <label className="block text-xs font-medium text-slate-500 mb-1">Data de Vencimento do Restante</label>
                                      <input 
                                          type="date"
                                          value={installmentDueDate}
                                          onChange={(e) => setInstallmentDueDate(e.target.value)}
                                          disabled={isFinalizado}
                                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-brand-plum text-sm"
                                      />
                                  </div>
                              </div>
                          )}
                      </div>

                      <div className="flex justify-between items-center mb-6">
                          <span className="text-base text-slate-600 font-medium">Valor a Receber</span>
                          <span className="text-2xl font-bold text-slate-800">
                              R$ {finalAmountToPay.toFixed(2)}
                          </span>
                      </div>
                      
                       <Button 
                          onClick={handleFinalize} 
                          disabled={submitting || (totalSoldValue === 0 && kitItems.every(i => i.returned === 0)) || isFinalizado} 
                          className={`w-full h-12 rounded-xl text-base font-bold transition-all shadow-md hover:shadow-lg ${isFinalizado ? 'bg-green-600 text-white hover:bg-green-600' : 'bg-brand-plum hover:bg-brand-rose text-white'}`}
                      >
                          {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                              <>
                                  <CheckCircle className="w-5 h-5 mr-2" />
                                  {isFinalizado ? "Acerto Finalizado" : "Finalizar Acerto"}
                              </>
                          )}
                      </Button>
                      {isFinalizado && (
                          <Button 
                              onClick={() => handleDownloadPDF(selectedKit)} 
                              disabled={isDownloading === selectedKit?.id} 
                              variant="outline"
                              className="w-full mt-3 h-12 rounded-xl text-base font-bold transition-all border-brand-plum text-brand-plum hover:bg-brand-plum hover:text-white"
                          >
                              {isDownloading === selectedKit?.id ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Download className="w-5 h-5 mr-2" />}
                              Baixar PDF deste Acerto
                          </Button>
                      )}
                      <p className="text-xs text-center text-slate-400 mt-3">
                          As peças devolvidas voltarão para o estoque do Promotor.
                      </p>
                  </div>
              </div>
          </div>
      )}
      
      {/* HISTORY MODAL */}
      {showHistoryModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <div>
                          <h2 className="text-xl font-bold text-slate-800 flex items-center">
                              <History className="w-6 h-6 mr-2 text-brand-plum" />
                              Histórico de Acertos
                          </h2>
                          <p className="text-sm text-slate-500 mt-1">
                              {resellers.find(r => r.id === selectedResellerId)?.name}
                          </p>
                      </div>
                      <button onClick={() => setShowHistoryModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                          <X className="w-5 h-5 text-slate-500" />
                      </button>
                  </div>
                  
                  <div className="p-6 overflow-y-auto flex-1 bg-white">
                      {historyKits.length === 0 ? (
                          <div className="text-center py-12 text-slate-500">
                              <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                              Nenhum acerto finalizado encontrado para esta revendedora.
                          </div>
                      ) : (
                          <div className="space-y-4">
                              {historyKits.map(kit => (
                                  <div key={kit.id} className="border border-slate-200 rounded-2xl p-5 hover:border-brand-plum/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                                      <div>
                                          <h4 className="font-bold text-slate-800">{kit.name || `Kit #${kit.id.substring(0,8)}`}</h4>
                                          <div className="text-sm text-slate-500 flex gap-4 mt-1">
                                              <span>Enviado: {new Date(kit.created_at).toLocaleDateString('pt-BR')}</span>
                                              {kit.period && <span>Período: {kit.period}</span>}
                                          </div>
                                      </div>
                                      <Button
                                          onClick={() => handleDownloadPDF(kit)}
                                          disabled={isDownloading === kit.id}
                                          variant="outline"
                                          className="text-brand-plum border-brand-plum/30 hover:bg-brand-plum hover:text-white"
                                      >
                                          {isDownloading === kit.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                                          Baixar PDF
                                      </Button>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}
      
    </div>
  );
}
