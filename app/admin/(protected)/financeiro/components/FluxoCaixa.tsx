"use client";

import { useState, useEffect, useMemo } from "react";
import { Loader2, Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";

const MONTHS = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

export default function FluxoCaixa() {
  const [loading, setLoading] = useState(true);
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear().toString());
  const [grupoSelecionado, setGrupoSelecionado] = useState("all");
  const [data, setData] = useState<any>(null);

  const fetchData = async (ano: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/financeiro/fluxo?ano=${ano}`);
      const json = await res.json();
      if (res.ok) {
        setData(json);
      }
    } catch (error) {
      console.error("Error fetching fluxo de caixa:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(anoSelecionado);
  }, [anoSelecionado]);

  const handleGerar = () => {
    fetchData(anoSelecionado);
  };

  const chartData = useMemo(() => {
    if (!data) return [];
    return data.meses.map((m: any, i: number) => ({
      name: MONTHS[i],
      Receitas: m.receitas,
      Despesas: m.despesas > 0 ? -m.despesas : 0, // Plotar despesas para baixo
      "Resultado mês": m.resultadoMes,
      "Acumulado do Ano": m.saldoAcumulado
    }));
  }, [data]);

  const allGroups = useMemo(() => {
    if (!data) return [];
    const groups = new Set<string>();
    data.meses.forEach((m: any) => {
      Object.keys(m.grupos).forEach(g => groups.add(g));
    });
    return Array.from(groups).sort();
  }, [data]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val);
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Filtros */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-end">
        <div className="space-y-2 flex-1 md:max-w-xs">
          <label className="text-sm font-medium text-slate-700">Grupos</label>
          <Select value={grupoSelecionado} onValueChange={setGrupoSelecionado}>
            <SelectTrigger>
              <SelectValue placeholder="Todos os grupos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os grupos</SelectItem>
              {allGroups.map(g => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 flex-1 md:max-w-[150px]">
          <label className="text-sm font-medium text-slate-700">Ano</label>
          <Select value={anoSelecionado} onValueChange={setAnoSelecionado}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026, 2027, 2028].map(y => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <button 
          onClick={handleGerar}
          className="px-6 py-2 h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-300 font-medium"
        >
          Gerar
        </button>
      </div>

      {/* Gráfico */}
      {data && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-center font-playfair text-xl text-slate-600 mb-6">Fluxo de Caixa</h3>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid stroke="#f5f5f5" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(value) => `${value / 1000}k`} />
                <Tooltip 
                  formatter={(value: number) => `R$ ${formatCurrency(Math.abs(value))}`}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <ReferenceLine y={0} stroke="#cbd5e1" />
                <Bar dataKey="Receitas" barSize={20} fill="#818cf8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Despesas" barSize={20} fill="#f472b6" radius={[0, 0, 4, 4]} />
                <Line type="monotone" dataKey="Resultado mês" stroke="#0ea5e9" strokeWidth={2} dot={{r: 4}} />
                <Line type="monotone" dataKey="Acumulado do Ano" stroke="#84cc16" strokeWidth={2} dot={{r: 4}} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tabela de Dados */}
      {data && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-200">
                <TableHead className="w-[200px] font-bold text-slate-600 uppercase text-xs">Caixa</TableHead>
                {MONTHS.map(m => (
                  <TableHead key={m} className="text-right font-bold text-slate-600 uppercase text-xs min-w-[100px]">{m}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Saldo Inicial */}
              <TableRow className="bg-slate-100/50 hover:bg-slate-100/80">
                <TableCell className="font-semibold text-slate-700">Saldo Inicial</TableCell>
                {data.meses.map((m: any, i: number) => {
                  let saldoMes = i === 0 ? data.saldoInicialAno : data.meses[i-1].saldoAcumulado;
                  return (
                    <TableCell key={i} className={`text-right font-medium ${saldoMes < 0 ? 'text-red-600' : 'text-slate-700'}`}>
                      {formatCurrency(saldoMes)}
                    </TableCell>
                  );
                })}
              </TableRow>

              {/* Receitas Totais */}
              <TableRow className="bg-blue-50/50 hover:bg-blue-50">
                <TableCell className="font-bold text-blue-800">Receitas</TableCell>
                {data.meses.map((m: any, i: number) => (
                  <TableCell key={i} className="text-right font-bold text-blue-700">
                    {formatCurrency(m.receitas)}
                  </TableCell>
                ))}
              </TableRow>

              {/* Despesas Totais */}
              <TableRow className="bg-pink-50/50 hover:bg-pink-50">
                <TableCell className="font-bold text-pink-800">Despesas</TableCell>
                {data.meses.map((m: any, i: number) => (
                  <TableCell key={i} className="text-right font-bold text-pink-700">
                    {formatCurrency(m.despesas)}
                  </TableCell>
                ))}
              </TableRow>

              {/* Grupos */}
              {allGroups
                .filter(g => grupoSelecionado === "all" || g === grupoSelecionado)
                .map((grupo) => (
                  <TableRow key={grupo} className="hover:bg-slate-50">
                    <TableCell className="text-slate-600 font-medium text-sm">{grupo}</TableCell>
                    {data.meses.map((m: any, i: number) => {
                      const val = m.grupos[grupo] || 0;
                      return (
                        <TableCell key={i} className="text-right text-slate-500 text-sm">
                          {val === 0 ? "0,00" : formatCurrency(val)}
                        </TableCell>
                      );
                    })}
                  </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
