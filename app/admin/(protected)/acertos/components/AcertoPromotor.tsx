"use client";

import { useState, useEffect } from "react";
import { Users, Package, Search, Calculator, CheckCircle, Loader2, History, Briefcase } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
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
      // Fetch products to get current prices
      const { data: prods } = await supabase.from('products').select('id, price');
      const productsMap = new Map();
      if (prods) {
          prods.forEach(p => productsMap.set(p.id, p.price));
      }

      const { data: kits } = await supabase.from('promoter_kits')
          .select('*, resellers(name), items:promoter_kit_items(product_id, quantity)')
          .eq('promoter_id', promoterId)
          .eq('period', period)
          .like('name', '%[FINALIZADO]%')
          .not('name', 'like', '%[ACERTADO]%');
          
      if (kits) {
          const mappedKits = kits.map(k => {
              let actualSold = 0;
              if (k.items) {
                  k.items.forEach((item: any) => {
                      const price = productsMap.get(item.product_id) || 0;
                      actualSold += (item.quantity * price);
                  });
              }

              return {
                  id: k.id,
                  name: k.name,
                  reseller_name: k.resellers?.name || 'Desconhecido',
                  total_price: k.total_price || 0,
                  actual_sold: actualSold
              };
          });
          setPromoterKits(mappedKits);
      } else {
          setPromoterKits([]);
      }
  };

  // Calculations
  let totalSoldValue = 0;
  
  promoterKits.forEach(kit => {
      totalSoldValue += kit.actual_sold;
  });
  
  const totalCommission = totalSoldValue * (commissionPercent / 100);
  const finalAmountToPay = totalSoldValue - totalCommission;

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
          }));

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
                                  <th className="px-4 py-3 text-right">Comissão ({commissionPercent}%)</th>
                                  <th className="px-4 py-3 text-right">Empresa (R$)</th>
                              </tr>
                          </thead>
                          <tbody>
                              {promoterKits.map((kit) => {
                                  const kitCommission = kit.actual_sold * (commissionPercent / 100);
                                  const kitCompany = kit.actual_sold - kitCommission;
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
                                              R$ {kitCommission.toFixed(2)}
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
                          <span className="font-medium">R$ {totalSoldValue.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm pb-3 border-b border-slate-100">
                          <span className="text-slate-500">Comissão Promotor ({commissionPercent}%)</span>
                          <span className="font-medium text-brand-plum">R$ {totalCommission.toFixed(2)}</span>
                      </div>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-slate-200">
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
