"use client";

import { useState } from "react";
import { Playfair_Display, Inter } from "next/font/google";
import FluxoCaixa from "./components/FluxoCaixa";
import HistoricoFinanceiro from "./components/HistoricoFinanceiro";
import ContasPagar from "./components/ContasPagar";
import ContasReceber from "./components/ContasReceber";
import Link from "next/link";
import { Wallet, ArrowDownCircle, ArrowUpCircle, LineChart, History, ArrowLeft } from "lucide-react";

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-playfair" });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-inter" });

export default function FinanceiroPage() {
  const [activeTab, setActiveTab] = useState("pagar");

  return (
    <div className={`min-h-screen bg-slate-50/50 p-4 md:p-8 ${inter.variable} ${playfair.variable}`}>
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <Link 
            href="/admin/dashboard" 
            className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para o Dashboard
          </Link>
          <h1 className="text-3xl font-playfair font-bold text-slate-800 flex items-center">
            <Wallet className="w-8 h-8 mr-3" style={{ color: "#5D3A5B" }} />
            Módulo Financeiro
          </h1>
          <p className="text-slate-500 mt-2 font-inter">
            Gerencie suas contas a pagar, contas a receber e fluxo de caixa.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-white rounded-2xl w-fit shadow-sm border border-slate-100 font-inter">
          <button 
            onClick={() => setActiveTab("pagar")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 ${
              activeTab === "pagar" ? "bg-red-50 text-red-700 font-medium shadow-sm" : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            <ArrowDownCircle className="w-4 h-4" />
            Contas a Pagar
          </button>
          
          <button 
            onClick={() => setActiveTab("receber")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 ${
              activeTab === "receber" ? "bg-emerald-50 text-emerald-700 font-medium shadow-sm" : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            <ArrowUpCircle className="w-4 h-4" />
            Contas a Receber
          </button>
          
          <button 
            onClick={() => setActiveTab("fluxo")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 ${
              activeTab === "fluxo" ? "bg-purple-50 text-purple-700 font-medium shadow-sm" : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            <LineChart className="w-4 h-4" />
            Fluxo de Caixa
          </button>

          <button 
            onClick={() => setActiveTab("historico")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 ${
              activeTab === "historico" ? "bg-slate-800 text-white font-medium shadow-sm" : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            <History className="w-4 h-4" />
            Histórico
          </button>
        </div>

        <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === "pagar" && <ContasPagar />}
          {activeTab === "receber" && <ContasReceber />}
          {activeTab === "fluxo" && <FluxoCaixa />}
          {activeTab === "historico" && <HistoricoFinanceiro />}
        </div>

      </div>
    </div>
  );
}
