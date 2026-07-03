"use client"

import { Playfair_Display, Inter } from "next/font/google"
import React, { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Loader2, ArrowLeft, Package, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-playfair" })
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-inter" })

const getColorHex = (colorName: string) => {
  if (!colorName) return '#ccc';
  const color = colorName.toLowerCase().trim();
  
  if (color === 'preto') return '#000000';
  if (color === 'branco') return '#ffffff';
  if (color === 'vermelho') return '#ef4444'; // red-500
  if (color === 'nude') return '#f3ceb6';
  if (color === 'azul') return '#3b82f6'; // blue-500
  if (color === 'rosa') return '#ec4899'; // pink-500
  if (color === 'verde') return '#22c55e'; // green-500
  if (color === 'amarelo') return '#eab308'; // yellow-500
  if (color.includes('verde musgo')) return '#4d7c0f'; // lime-700
  if (color === 'vinho') return '#7f1d1d'; // red-900
  if (color === 'marrom') return '#78350f'; // amber-900
  if (color === 'cinza') return '#6b7280'; // gray-500
  if (color === 'laranja') return '#f97316'; // orange-500
  
  return '#ccc'; // fallback
}

export default function EstoqueHistoricoPage() {
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<any[]>([])
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('inventory_transactions')
        .select(`
          *,
          products (
            id,
            name,
            sku
          ),
          profiles:promoter_id (
            id,
            nome
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      setTransactions(data || [])
    } catch (err) {
      console.error(err)
      alert("Erro ao carregar histórico.")
    } finally {
      setLoading(false)
    }
  }

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'IN': return { label: 'Entrada', color: 'bg-emerald-100 text-emerald-700' }
      case 'MANUAL_ADJUST': return { label: 'Ajuste Manual', color: 'bg-amber-100 text-amber-700' }
      case 'TRANSFER_PROMOTER': return { label: 'Transf. Promotora', color: 'bg-brand-rose/20 text-brand-plum' }
      case 'OUT_RETAIL': return { label: 'Venda Varejo', color: 'bg-blue-100 text-blue-700' }
      case 'OUT_WHOLESALE': return { label: 'Venda Atacado', color: 'bg-indigo-100 text-indigo-700' }
      case 'OUT_PROMOTER': return { label: 'Venda Promotora', color: 'bg-purple-100 text-purple-700' }
      case 'EXCHANGE_IN': return { label: 'Entrada (Troca)', color: 'bg-teal-100 text-teal-700' }
      case 'EXCHANGE_OUT': return { label: 'Saída (Troca)', color: 'bg-orange-100 text-orange-700' }
      case 'EXCHANGE_DEFECT': return { label: 'Defeito (Troca)', color: 'bg-red-100 text-red-700' }
      default: return { label: type, color: 'bg-slate-100 text-slate-700' }
    }
  }

  return (
    <div className={`min-h-screen bg-slate-50 relative overflow-hidden ${inter.variable} ${playfair.variable} font-sans pb-20`}>
      <div className="container mx-auto px-4 py-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-white p-6 rounded-3xl shadow-sm border border-slate-200 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <button 
                onClick={() => router.back()}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <h1 className="text-3xl font-bold text-slate-800" style={{ fontFamily: "var(--font-playfair)" }}>
                Histórico de Movimentações
              </h1>
            </div>
            <p className="text-slate-500 mt-1 pl-11">Visualize todas as entradas, saídas e transferências de estoque em tempo real.</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={fetchData} variant="outline" className="rounded-xl px-4 py-2 shadow-sm font-semibold">
              Atualizar Histórico
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-brand-plum" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="px-6 py-8 text-center text-slate-500">
                Nenhuma movimentação registrada.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-600 uppercase tracking-wider">
                    <th className="px-6 py-4">Data / Hora</th>
                    <th className="px-6 py-4">Tipo</th>
                    <th className="px-6 py-4">Produto</th>
                    <th className="px-6 py-4">Variação</th>
                    <th className="px-6 py-4 text-center">Qtd</th>
                    <th className="px-6 py-4">Envolvido / Notas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((t) => {
                    const typeInfo = getTransactionTypeLabel(t.type)
                    const dateObj = new Date(t.created_at)
                    return (
                      <tr key={t.id} className="hover:bg-slate-50 transition-colors text-sm">
                        <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                          <div className="font-medium">{dateObj.toLocaleDateString('pt-BR')}</div>
                          <div className="text-xs text-slate-400">{dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border border-transparent ${typeInfo.color}`}>
                            {typeInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center mr-3 shrink-0">
                              <Package className="w-4 h-4 text-slate-400" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-800 line-clamp-1">{t.products?.name || 'Produto Excluído'}</div>
                              <div className="text-xs text-slate-500">SKU: {t.products?.sku || '-'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-bold border border-slate-200">
                              {t.size}
                            </span>
                            <div className="flex items-center text-xs text-slate-600">
                              <div 
                                className="w-3 h-3 rounded-full border border-slate-200 mr-1 shadow-inner" 
                                style={{backgroundColor: getColorHex(t.color)}}
                              ></div>
                              {t.color}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`text-base font-bold ${t.quantity > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {t.quantity > 0 ? `+${t.quantity}` : t.quantity}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {t.profiles && (
                            <div className="flex items-center text-slate-700 mb-1 font-medium">
                              <User className="w-3 h-3 mr-1 text-brand-plum" />
                              {t.profiles.nome}
                            </div>
                          )}
                          {t.notes && (
                            <div className="text-xs text-slate-500 italic">"{t.notes}"</div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
        
      </div>
    </div>
  )
}
