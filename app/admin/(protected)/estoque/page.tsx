"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Package, User, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Playfair_Display, Inter } from "next/font/google";

import EstoqueGeral from "./components/EstoqueGeral";
import EstoquePromotores from "./components/EstoquePromotores";
import EstoqueRevendedoras from "./components/EstoqueRevendedoras";

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-playfair" });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-inter" });

export default function EstoqueWrapperPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("geral");

  return (
    <div className={`min-h-screen bg-slate-50 relative overflow-hidden ${inter.variable} ${playfair.variable} font-sans pb-20`}>
      <div className="container mx-auto px-4 py-8">
        
        {/* PAGE HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <button 
                onClick={() => router.push('/admin/dashboard')}
                className="p-2 bg-white border border-slate-200 hover:bg-slate-100 rounded-full transition-colors shadow-sm"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <h1 className="text-3xl font-bold text-slate-800" style={{ fontFamily: "var(--font-playfair)" }}>
                Gestão de Estoques
              </h1>
            </div>
            <p className="text-slate-500 mt-1 ml-12">Central de controle e movimentações de produtos</p>
          </div>
        </div>

        {/* TABS CONTAINER */}
        <Tabs defaultValue="geral" value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
          <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 inline-block w-full max-w-3xl overflow-x-auto">
            <TabsList className="grid w-full grid-cols-3 h-auto bg-transparent gap-2">
              <TabsTrigger 
                value="geral" 
                className="data-[state=active]:bg-brand-plum data-[state=active]:text-white rounded-xl py-3 px-4 font-semibold text-slate-600 hover:bg-slate-50 transition-all"
              >
                <Package className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Estoque</span> Geral
              </TabsTrigger>
              <TabsTrigger 
                value="promotores" 
                className="data-[state=active]:bg-brand-plum data-[state=active]:text-white rounded-xl py-3 px-4 font-semibold text-slate-600 hover:bg-slate-50 transition-all"
              >
                <Users className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Estoque</span> Promotores
              </TabsTrigger>
              <TabsTrigger 
                value="revendedoras" 
                className="data-[state=active]:bg-brand-plum data-[state=active]:text-white rounded-xl py-3 px-4 font-semibold text-slate-600 hover:bg-slate-50 transition-all"
              >
                <User className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Estoque</span> Revendedoras
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="geral" className="outline-none">
            {activeTab === 'geral' && <EstoqueGeral />}
          </TabsContent>

          <TabsContent value="promotores" className="outline-none">
            {activeTab === 'promotores' && <EstoquePromotores />}
          </TabsContent>

          <TabsContent value="revendedoras" className="outline-none">
            {activeTab === 'revendedoras' && <EstoqueRevendedoras />}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
