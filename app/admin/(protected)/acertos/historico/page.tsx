"use client";

import { useState, useEffect } from "react";
import { History, ArrowLeft, PackageOpen, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { generateAcertoPDF } from "./pdfGenerator";

export default function HistoricoAcertosPage() {
  const [loading, setLoading] = useState(true);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [selectedAcerto, setSelectedAcerto] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    // Busca acertos
    const { data: acertosData } = await supabase.from('promoter_acertos')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (acertosData) {
      // Busca promotores via API
      try {
          const res = await fetch('/api/admin/user');
          const profilesData = await res.json();
            
          const profilesMap = new Map();
          if (profilesData && Array.isArray(profilesData)) {
            profilesData.forEach((p: any) => profilesMap.set(p.id, p.nome));
          }
          
          const mappedData = acertosData.map((a: any) => ({
            ...a,
            profiles: { nome: profilesMap.get(a.promoter_id) }
          }));
          
          setHistoryData(mappedData);
      } catch (e) {
          console.error("Erro ao buscar promotores:", e);
          setHistoryData(acertosData); // Fallback
      }
    }
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/acertos">
            <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5 text-slate-500" />
            </Button>
        </Link>
        <div>
            <h1 className="text-3xl font-bold text-brand-plum flex items-center gap-2">
                <History className="w-8 h-8" />
                Histórico de Acertos
            </h1>
            <p className="text-slate-500 mt-1">
                Relatório de todos os acertos finalizados.
            </p>
        </div>
      </div>

      {loading ? (
          <div className="flex justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-brand-plum" />
          </div>
      ) : (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              {historyData.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">Nenhum acerto registrado.</div>
              ) : (
                  <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                          <tr>
                              <th className="px-6 py-4 font-semibold">Data</th>
                              <th className="px-6 py-4 font-semibold">Promotor</th>
                              <th className="px-6 py-4 font-semibold">Período</th>
                              <th className="px-6 py-4 font-semibold text-right">Faturado</th>
                              <th className="px-6 py-4 font-semibold text-right">Comissão</th>
                              <th className="px-6 py-4 font-semibold text-right">Valor Pago</th>
                              <th className="px-6 py-4 font-semibold text-center">Ações</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                          {historyData.map(h => (
                              <tr key={h.id} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="px-6 py-4 text-slate-600">{new Date(h.created_at).toLocaleDateString('pt-BR')}</td>
                                  <td className="px-6 py-4 font-medium text-slate-800">{h.profiles?.nome || 'Desconhecido'}</td>
                                  <td className="px-6 py-4 text-slate-600">{h.period}</td>
                                  <td className="px-6 py-4 text-right text-slate-800">R$ {h.total_sold.toFixed(2)}</td>
                                  <td className="px-6 py-4 text-right text-brand-plum">R$ {h.total_commission.toFixed(2)}</td>
                                  <td className="px-6 py-4 text-right font-bold text-emerald-600">R$ {h.total_paid.toFixed(2)}</td>
                                  <td className="px-6 py-4 text-center">
                                      <Button 
                                          variant="outline" 
                                          size="sm"
                                          onClick={() => setSelectedAcerto(h)}
                                          className="text-brand-plum border-brand-plum hover:bg-brand-plum hover:text-white"
                                      >
                                          <PackageOpen className="w-4 h-4 mr-2" />
                                          Detalhes
                                      </Button>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              )}
          </div>
      )}

      {/* DETAILS MODAL */}
      <Dialog open={!!selectedAcerto} onOpenChange={(open) => { if (!open) setSelectedAcerto(null); }}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
              <DialogHeader>
                  <DialogTitle className="flex flex-col gap-1">
                      <span>Detalhes do Acerto</span>
                      <span className="text-sm font-normal text-slate-500">
                          {selectedAcerto?.profiles?.nome} • {selectedAcerto?.period}
                      </span>
                  </DialogTitle>
              </DialogHeader>
              
              <div className="flex-1 overflow-y-auto mt-4 pr-2">
                  {!selectedAcerto?.details || selectedAcerto.details.length === 0 ? (
                      <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                          Nenhum detalhe de peças gravado neste recibo.<br/>
                          <span className="text-xs mt-2 block">(Acertos antigos não possuem extrato de peças)</span>
                      </div>
                  ) : (
                      <div className="border border-slate-200 rounded-2xl overflow-hidden">
                          <table className="w-full text-left text-sm">
                              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                                  <tr>
                                      <th className="px-4 py-3 font-semibold">Produto</th>
                                      <th className="px-4 py-3 font-semibold text-center">Vendido</th>
                                      <th className="px-4 py-3 font-semibold text-center">Devolvido</th>
                                      <th className="px-4 py-3 font-semibold text-right">Preço Unit.</th>
                                      <th className="px-4 py-3 font-semibold text-right">Subtotal Vendido</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 bg-white">
                                  {selectedAcerto.details.map((item: any, idx: number) => (
                                      <tr key={idx} className="hover:bg-slate-50/50">
                                          <td className="px-4 py-3 font-medium text-slate-700">{item.name}</td>
                                          <td className="px-4 py-3 text-center text-emerald-600 font-semibold">{item.sold || 0}</td>
                                          <td className="px-4 py-3 text-center text-amber-600 font-semibold">{item.returned || 0}</td>
                                          <td className="px-4 py-3 text-right text-slate-600">R$ {Number(item.price).toFixed(2)}</td>
                                          <td className="px-4 py-3 text-right font-semibold text-slate-800">
                                              R$ {(Number(item.sold || 0) * Number(item.price)).toFixed(2)}
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  )}
              </div>
              
              <DialogFooter className="mt-4 border-t pt-4">
                  <Button 
                      variant="outline" 
                      onClick={() => setSelectedAcerto(null)}
                      disabled={generatingPdf}
                  >
                      Fechar
                  </Button>
                  <Button 
                      onClick={async () => {
                          if (selectedAcerto) {
                              setGeneratingPdf(true);
                              try {
                                  await generateAcertoPDF(selectedAcerto);
                              } catch (err) {
                                  console.error("Erro ao gerar PDF:", err);
                                  alert("Ocorreu um erro ao gerar o PDF.");
                              } finally {
                                  setGeneratingPdf(false);
                              }
                          }
                      }}
                      disabled={generatingPdf || !selectedAcerto?.details || selectedAcerto.details.length === 0}
                      className="bg-brand-plum hover:bg-brand-plum/90 text-white"
                  >
                      {generatingPdf ? (
                          <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Gerando...
                          </>
                      ) : (
                          "Baixar PDF"
                      )}
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
}
