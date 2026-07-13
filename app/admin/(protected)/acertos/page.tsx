"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Wallet, User, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Playfair_Display, Inter } from "next/font/google";
import { createClient } from "@/lib/supabase/client";

import AcertoPromotor from "./components/AcertoPromotor";
import AcertoRevendedora from "./components/AcertoRevendedora";

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-playfair" });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-inter" });

export default function AcertosWrapperPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("revendedora");
  const [isPromoter, setIsPromoter] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function checkRole() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).maybeSingle();
        const role = profile?.role || session.user.user_metadata?.role || "";
        if (role === 'PROMOTOR' || role === 'CONSULTANT') {
          setIsPromoter(true);
          setActiveTab("revendedora");
        } else {
          setIsPromoter(false);
          setActiveTab("promotor");
        }
      }
      setLoading(false);
    }
    checkRole();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50">Carregando...</div>;
  }

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
                Gestão de Acertos
              </h1>
            </div>
            <p className="text-slate-500 mt-1 ml-12">Realize acertos financeiros e de estoque com promotores e revendedoras</p>
          </div>
        </div>

        {/* TABS CONTAINER */}
        <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
          <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 inline-block w-full max-w-3xl overflow-x-auto">
            <TabsList className={`grid w-full h-auto bg-transparent gap-2 ${isPromoter ? 'grid-cols-1' : 'grid-cols-2'}`}>
              
              {!isPromoter && (
                <TabsTrigger 
                  value="promotor" 
                  className="data-[state=active]:bg-brand-plum data-[state=active]:text-white rounded-xl py-3 px-4 font-semibold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Acerto com Promotor
                </TabsTrigger>
              )}
              
              <TabsTrigger 
                value="revendedora" 
                className="data-[state=active]:bg-brand-plum data-[state=active]:text-white rounded-xl py-3 px-4 font-semibold text-slate-600 hover:bg-slate-50 transition-all"
              >
                <User className="w-4 h-4 mr-2" />
                Acerto com Revendedora
              </TabsTrigger>
              
            </TabsList>
          </div>

          {!isPromoter && (
            <TabsContent value="promotor" className="outline-none">
              <AcertoPromotor />
            </TabsContent>
          )}

          <TabsContent value="revendedora" className="outline-none">
            <AcertoRevendedora isPromoter={isPromoter} />
          </TabsContent>
          
        </Tabs>
      </div>
    </div>
  );
}
