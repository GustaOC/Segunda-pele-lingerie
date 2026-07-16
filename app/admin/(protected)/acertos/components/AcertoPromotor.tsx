"use client";

import { useState, useEffect } from "react";
import { Users, Package, Search, Calculator, CheckCircle, Loader2, History, Briefcase } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import Link from "next/link";

export default function AcertoPromotor() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [promoters, setPromoters] = useState<any[]>([]);
  const [selectedPromoterId, setSelectedPromoterId] = useState("");
  
  const [promoterKits, setPromoterKits] = useState<any[]>([]);
  const [periods, setPeriods] = useState<string[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState("");
  
  const [commissionPercent, setCommissionPercent] = useState(10); // Standard manual 10%
  
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
    
    // Fetch Promoters via API or table (Assuming profiles table or API)
    const [usersRes] = await Promise.all([
        fetch('/api/admin/user').then(res => res.json())
    ]);

    if (usersRes.data) {
        const promData = usersRes.data.filter((u: any) => ['CONSULTANT', 'PROMOTOR', 'ADMIN'].includes(u.role));
        setPromoters(promData);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    if (!selectedPromoterId) {
        setPromoterKits([]);
        setPeriods([]);
        setSelectedPeriod("");
        return;
    }
    fetchPeriods(selectedPromoterId);
  }, [selectedPromoterId]);

  const fetchPeriods = async (promoterId: string) => {
      const { data: kitsData } = await supabase.from('promoter_kits')
          .select('period')
          .eq('promoter_id', promoterId)
          .like('name', '%[FINALIZADO]%')
          .not('name', 'like', '%[ACERTADO]%');
      
      const periodSet = new Set<string>();
      if (kitsData) {
          kitsData.forEach(k => {
              if (k.period) periodSet.add(k.period);
          });
      }
      
      const uniquePeriods = Array.from(periodSet).sort();
      setPeriods(uniquePeriods);
      setSelectedPeriod("");
      setPromoterKits([]);
  };

  useEffect(() => {
      if (!selectedPromoterId || !selectedPeriod) {
          setPromoterKits([]);
          return;
      }
      fetchPromoterKits(selectedPromoterId, selectedPeriod);
  }, [selectedPromoterId, selectedPeriod]);

  const fetchPromoterKits = async (promoterId: string, period: string) => {
      // Fetch products to get current prices and categories
      const { data: prods } = await supabase.from('products').select('id, price, category_id');
      const { data: cats } = await supabase.from('categories').select('id, name');
      
      const catMap = new Map();
      if (cats) {
          cats.forEach(c => catMap.set(c.id, c.name.toLowerCase()));
      }

      const productsMap = new Map();
      if (prods) {
          prods.forEach(p => {
              const catName = p.category_id ? catMap.get(p.category_id) : '';
              const isRoupa = catName && catName.includes('roupa');
              productsMap.set(p.id, { price: p.price, isRoupa });
          });
      }

      const { data: kits } = await supabase.from('promoter_kits')
          .select('*, resellers(name), items:promoter_kit_items(product_id, quantity)')
          .eq('promoter_id', promoterId)
          .eq('period', period)
          .like('name', '%[FINALIZADO]%')
          .not('name', 'like', '%[ACERTADO]%');
          
      if (kits) {
          const mappedKits = kits.map(k => {
              let soldNormal = 0;
              let soldRoupas = 0;
              
              if (k.items) {
                  k.items.forEach((item: any) => {
                      const p = productsMap.get(item.product_id);
                      if (p) {
                          if (p.isRoupa) soldRoupas += (item.quantity * p.price);
                          else soldNormal += (item.quantity * p.price);
                      }
                  });
              }

              const actualSold = soldNormal + soldRoupas;
              const percentSold = k.total_price > 0 ? (actualSold / k.total_price) * 100 : 0;
              
              let cp = 0;
              if (percentSold >= 100) cp = 40;
              else if (percentSold >= 70) cp = 35;
              else if (percentSold >= 30) cp = 30;
              
              const revendedoraCommission = (soldNormal * (cp / 100)) + (soldRoupas * 0.25);

              return {
                  id: k.id,
                  name: k.name,
                  reseller_name: k.resellers?.name || 'Desconhecido',
                  total_price: k.total_price || 0,
                  actual_sold: actualSold,
                  revendedora_commission: revendedoraCommission,
                  revendedora_percent: cp
              };
          });
          setPromoterKits(mappedKits);
      } else {
          setPromoterKits([]);
      }
  };

  // Calculations
  let totalSoldValue = 0;
  let totalRevendedoraCommission = 0;
  
  promoterKits.forEach(kit => {
      totalSoldValue += kit.actual_sold;
      totalRevendedoraCommission += kit.revendedora_commission;
  });
  
  const totalCommission = (totalSoldValue - totalRevendedoraCommission) * (commissionPercent / 100);
  const finalAmountToPay = totalSoldValue - totalRevendedoraCommission - totalCommission;

  const handleFinalize = async () => {
      if (!selectedPromoterId) return;

      setSubmitting(true);
      try {
          const { data: { session } } = await supabase.auth.getSession();
          const adminId = session?.user.id;
          
          // 1. Mark pending kits as [ACERTADO]
          if (promoterKits.length > 0) {
              for (const kit of promoterKits) {
                  const { data: kitData } = await supabase.from('promoter_kits').select('name').eq('id', kit.id).single();
                  if (kitData && !kitData.name.includes('[ACERTADO]')) {
                      await supabase.from('promoter_kits').update({ name: `${kitData.name} [ACERTADO]` }).eq('id', kit.id);
                  }
              }
          }
          
          // 2. Save Acerto History
          const itemsDetails = promoterKits.map(kit => ({
              id: kit.id,
              name: `Kit: ${kit.reseller_name}`,
              price: kit.actual_sold,
              returned: 0,
              sold: 1
          })) as any[];

          if (isInstallment) {
              itemsDetails.push({
                  isInstallment: true,
                  paidNow: parseFloat(paidNow) || 0,
                  installmentDueDate,
                  remainingAmount: finalAmountToPay - (parseFloat(paidNow) || 0)
              });
          }

          const { error: insertError } = await supabase.from('promoter_acertos').insert({
              promoter_id: selectedPromoterId,
              period: selectedPeriod,
              total_sold: totalSoldValue,
              total_commission: totalCommission,
              total_paid: finalAmountToPay,
              created_by: adminId,
              details: itemsDetails
          });
          
          if (insertError) throw insertError;

          // 3. Save to Financeiro
          const todayStr = new Date().toISOString().split("T")[0];
          const promoter = promoters.find(p => p.id === selectedPromoterId);
          const promoterName = promoter ? promoter.nome : "Promotor";

          const financeiroPayload: any[] = [];
          if (isInstallment) {
              const paidAmount = parseFloat(paidNow) || 0;
              const remainingAmount = finalAmountToPay - paidAmount;
              
              if (paidAmount > 0) {
                  financeiroPayload.push({
                      type: "RECEIVABLE",
                      description: `Acerto Promotor: ${promoterName} - ${selectedPeriod} (Pago no Ato)`,
                      total_value: paidAmount,
                      paid_value: paidAmount,
                      due_date: todayStr,
                      payment_date: todayStr,
                      status: "QUITADO",
                      category: "Acertos",
                  });
              }
              if (remainingAmount > 0 && installmentDueDate) {
                  financeiroPayload.push({
                      type: "RECEIVABLE",
                      description: `Parcela Acerto Promotor: ${promoterName} - ${selectedPeriod}`,
                      total_value: remainingAmount,
                      due_date: installmentDueDate,
                      status: "PENDENTE",
                      category: "Acertos",
                      installment: "1/1"
                  });
              }
          } else {
              financeiroPayload.push({
                  type: "RECEIVABLE",
                  description: `Acerto Promotor: ${promoterName} - ${selectedPeriod}`,
                  total_value: finalAmountToPay,
                  paid_value: finalAmountToPay,
                  due_date: todayStr,
                  payment_date: todayStr,
                  status: "QUITADO",
                  category: "Acertos",
              });
          }

          await fetch("/api/admin/financeiro", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(financeiroPayload),
          });
          
          toast({
              title: "Acerto Finalizado!",
              description: "Acerto do promotor registrado com sucesso.",
              className: "bg-green-50 text-green-900 border-green-200"
          });
          
          fetchPromoterKits(selectedPromoterId, selectedPeriod);
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

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-brand-plum" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
          <Link href="/admin/acertos/historico">
              <Button 
                  variant="outline" 
                  className="text-brand-plum border-brand-plum hover:bg-brand-plum hover:text-white"
              >
                  <History className="w-4 h-4 mr-2" />
                  Ver Histórico de Acertos
              </Button>
          </Link>
      </div>
      
      {/* SELETORES */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Promotor</label>
              <SearchableSelect
                  options={promoters.map(p => ({ value: p.id, label: p.nome || p.email }))}
                  value={selectedPromoterId}
                  onChange={(val) => setSelectedPromoterId(val)}
                  placeholder="Selecione um promotor..."
                  emptyMessage="Nenhum promotor encontrado."
              />
          </div>
          <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Período / Semana</label>
              <SearchableSelect
                  options={periods.map(p => ({ value: p, label: p }))}
                  value={selectedPeriod}
                  onChange={(val) => setSelectedPeriod(val)}
                  placeholder={periods.length === 0 ? "Nenhum período pendente" : "Selecione o período..."}
                  emptyMessage="Nenhum período pendente"
                  disabled={!selectedPromoterId || periods.length === 0}
              />
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
      
      {selectedPromoterId && promoterKits.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* LISTA DE KITS */}
              <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden h-fit">
                  <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                      <h3 className="font-bold text-slate-800 flex items-center">
                          <Briefcase className="w-5 h-5 mr-2 text-brand-plum" />
                          Kits da Revendedora
                      </h3>
                  </div>
                  
                  <div className="p-0 overflow-x-auto">
                      <table className="w-full text-sm text-left text-slate-600">
                          <thead className="text-xs uppercase bg-slate-50 text-slate-500 border-b border-slate-100">
                              <tr>
                                  <th className="px-4 py-3">Revendedora</th>
                                  <th className="px-4 py-3 text-right">Valor do Kit (R$)</th>
                                  <th className="px-4 py-3 text-right">Total Vendido (R$)</th>
                                  <th className="px-4 py-3 text-right">Comissão Rev.</th>
                                  <th className="px-4 py-3 text-right">Empresa (R$)</th>
                              </tr>
                          </thead>
                          <tbody>
                              {promoterKits.map((kit) => {
                                  const kitPromoterCommission = (kit.actual_sold - kit.revendedora_commission) * (commissionPercent / 100);
                                  const kitCompany = kit.actual_sold - kit.revendedora_commission - kitPromoterCommission;
                                  return (
                                      <tr key={kit.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                                          <td className="px-4 py-3">
                                              <div className="font-medium text-slate-800">{kit.reseller_name}</div>
                                          </td>
                                          <td className="px-4 py-3 text-right font-medium text-slate-500">
                                              R$ {kit.total_price.toFixed(2)}
                                          </td>
                                          <td className="px-4 py-3 text-right font-medium text-slate-700">
                                              R$ {kit.actual_sold.toFixed(2)}
                                          </td>
                                          <td className="px-4 py-3 text-right text-brand-plum font-medium">
                                              R$ {kit.revendedora_commission.toFixed(2)}
                                              <span className="block text-xs text-slate-400">({kit.revendedora_percent}%)</span>
                                          </td>
                                          <td className="px-4 py-3 text-right text-emerald-600 font-bold">
                                              R$ {kitCompany.toFixed(2)}
                                          </td>
                                      </tr>
                                  );
                              })}
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
                          <span className="text-slate-500">Total Faturado</span>
                          <span className="font-medium">R$ {(totalSoldValue - totalRevendedoraCommission).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm pb-3 border-b border-slate-100">
                          <span className="text-slate-500">Comissão Promotor ({commissionPercent}%)</span>
                          <span className="font-medium text-brand-plum">R$ {totalCommission.toFixed(2)}</span>
                      </div>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-slate-200">
                      <div className="mb-6 space-y-4">
                          <div className="flex items-center gap-2 mb-2">
                              <input 
                                  type="checkbox" 
                                  id="isInstallment" 
                                  checked={isInstallment} 
                                  onChange={(e) => setIsInstallment(e.target.checked)} 
                                  disabled={submitting}
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
                                          disabled={submitting}
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
                                          disabled={submitting}
                                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-brand-plum text-sm"
                                      />
                                  </div>
                              </div>
                          )}
                      </div>

                      <div className="flex justify-between items-center mb-6">
                          <span className="text-base text-slate-600 font-medium">Valor para a Empresa</span>
                          <span className="text-2xl font-bold text-emerald-600">
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
                  </div>
              </div>
          </div>
      )}
      
      {selectedPromoterId && promoterKits.length === 0 && (
          <div className="bg-white p-8 text-center rounded-3xl border border-slate-200">
              <p className="text-slate-500">Este promotor não possui kits pendentes para acerto no período.</p>
          </div>
      )}

    </div>
  );
}
