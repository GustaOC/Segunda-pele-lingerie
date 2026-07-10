"use client";

import { useState, useEffect } from "react";
import { Loader2, History, User, Calendar, CheckCircle2, XCircle, FileEdit, PlusCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function HistoricoFinanceiro() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [rawResponse, setRawResponse] = useState<any>(null);

  const fetchLogs = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/financeiro/history", { cache: 'no-store' });
      const json = await res.json();
      setRawResponse(json);
      if (res.ok && json.data) {
        setLogs(json.data);
      } else {
        setErrorMsg(json.error || "Erro desconhecido ao carregar o histórico.");
      }
    } catch (error: any) {
      console.error("Error fetching logs:", error);
      setErrorMsg(error.message || "Erro na requisição.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CRIOU CONTA': return <PlusCircle className="w-5 h-5 text-emerald-500" />;
      case 'QUITOU CONTA': return <CheckCircle2 className="w-5 h-5 text-blue-500" />;
      case 'ATUALIZOU CONTA': return <FileEdit className="w-5 h-5 text-amber-500" />;
      case 'EXCLUIU CONTA': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <History className="w-5 h-5 text-slate-500" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CRIOU CONTA': return 'bg-emerald-50 border-emerald-200 text-emerald-700';
      case 'QUITOU CONTA': return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'ATUALIZOU CONTA': return 'bg-amber-50 border-amber-200 text-amber-700';
      case 'EXCLUIU CONTA': return 'bg-red-50 border-red-200 text-red-700';
      default: return 'bg-slate-50 border-slate-200 text-slate-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-playfair font-bold text-slate-800 flex items-center gap-2">
              <History className="w-5 h-5 text-slate-400" />
              Histórico de Movimentações
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Acompanhe todas as alterações realizadas no financeiro.
            </p>
          </div>
          <button onClick={fetchLogs} className="text-sm text-slate-500 hover:text-slate-800 font-medium">
            Atualizar
          </button>
        </div>

        <div className="p-0">
          {errorMsg ? (
            <div className="p-12 text-center text-red-500">Erro: {errorMsg}</div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              Nenhum histórico encontrado.
              {rawResponse && (
                <div className="mt-4 p-4 bg-slate-100 rounded text-left text-xs overflow-auto">
                  <strong>Debug (Raw Response):</strong>
                  <pre>{JSON.stringify(rawResponse, null, 2)}</pre>
                </div>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {logs.map((log) => (
                <div key={log.id} className="p-4 md:p-6 hover:bg-slate-50 transition-colors flex gap-4">
                  
                  <div className="flex-shrink-0 mt-1">
                    <div className={`p-2 rounded-xl ${getActionColor(log.action).split(' ')[0]} border ${getActionColor(log.action).split(' ')[1]}`}>
                      {getActionIcon(log.action)}
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                        {log.financial_transactions?.reference && (
                          <span className="text-sm font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            Ref: {log.financial_transactions.reference}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {log.user_name}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(log.created_at), "dd 'de' MMMM, HH:mm", { locale: ptBR })}
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {log.details}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
