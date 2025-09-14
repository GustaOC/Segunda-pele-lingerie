"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, PlusCircle, Trash2, Users, ArrowLeft, RefreshCw, Phone, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Playfair_Display, Inter } from "next/font/google";
import Image from "next/image";
import useSWR, { mutate } from 'swr';

const playfair = Playfair_Display({ 
  subsets: ["latin"], 
  weight: ["400", "500", "600", "700"], 
  variable: "--font-playfair" 
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter"
});

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function PromoterManagementPage() {
  const { toast } = useToast();
  const supabase = createClient();
  const router = useRouter();
  
  const { data: promotersResponse, error, isLoading, mutate: mutatePromoters } = useSWR('/api/promoters', fetcher);
  const promoters = promotersResponse?.data || [];

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatPhone = (value: string) => {
    const cleanValue = value.replace(/\D/g, "");
    return cleanValue
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4,5})(\d{4})/, "$1-$2")
      .replace(/(-\d{4})\d+?$/, "$1");
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !phone.trim()) {
      toast({
        title: "Erro!",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/promoters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      });

      if (!response.ok) {
        throw new Error('Erro ao cadastrar promotor');
      }

      toast({
        title: "Sucesso!",
        description: "Promotor cadastrado com sucesso.",
      });
      
      setName("");
      setPhone("");
      mutatePromoters();
    } catch (error) {
      toast({
        title: "Erro!",
        description: "Não foi possível cadastrar o promotor.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir o promotor "${name}"?`)) return;

    try {
      const { error } = await supabase.from("promoters").delete().eq('id', id);

      if (error) throw error;

      toast({ 
        title: "Sucesso!", 
        description: `Promotor "${name}" excluído com sucesso.` 
      });
      mutatePromoters();
    } catch (error) {
      toast({ 
        title: "Erro!", 
        description: "Não foi possível excluir o promotor.", 
        variant: "destructive" 
      });
    }
  };

  const refreshData = () => {
    mutatePromoters();
    toast({
      title: "Dados atualizados!",
      description: "A lista de promotores foi recarregada.",
      duration: 2000
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-indigo-50/20 relative overflow-hidden flex items-center justify-center">
        {/* Background decorativo */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-300/10 to-pink-300/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="text-center p-8 bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 max-w-md z-10">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: "#5D3A5B" }}></div>
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2" style={{ fontFamily: "var(--font-playfair)" }}>Carregando promotores</h2>
          <p className="text-slate-600">Aguarde um momento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-indigo-50/20 relative overflow-hidden ${inter.variable} ${playfair.variable} font-sans`}>
      {/* Background decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-300/10 to-pink-300/10 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-white/50 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-2xl" style={{ background: "linear-gradient(to right, #5D3A5B, #4A2E49, #3B2338)" }}>
                <Image src="/logo2.png" alt="Segunda Pele Lingerie" width={40} height={40} className="filter brightness-0 invert" />
              </div>
              <div>
                <span className="text-xl font-bold text-slate-800" style={{ fontFamily: "var(--font-playfair)" }}>Segunda Pele Lingerie</span>
                <p className="text-sm text-slate-600" style={{ fontFamily: "var(--font-inter)" }}>Gerenciamento de Promotores</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={refreshData}
                variant="outline"
                size="sm"
                className="border-white/50 bg-white/50 text-slate-700 hover:bg-white hover:text-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
              <Button variant="outline" size="sm" onClick={() => router.back()} className="border-white/50 bg-white/50 text-slate-700 hover:bg-white hover:text-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
                <ArrowLeft className="mr-2 h-4 w-4" /> 
                Voltar
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 relative z-10">
        {/* Título */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800 mb-1" style={{ fontFamily: "var(--font-playfair)" }}>
            Gerenciar Promotores
          </h1>
          <p className="text-slate-600" style={{ fontFamily: "var(--font-inter)" }}>Cadastre e gerencie os promotores do sistema</p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card className="border border-white/50 bg-white/70 backdrop-blur-lg shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total de Promotores</p>
                <p className="text-2xl font-bold text-slate-800" style={{ fontFamily: "var(--font-playfair)" }}>{promoters.length}</p>
              </div>
              <Users className="h-8 w-8" style={{ color: "#5D3A5B" }} />
            </CardContent>
          </Card>

          <Card className="border border-white/50 bg-white/70 backdrop-blur-lg shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Promotores Ativos</p>
                <p className="text-2xl font-bold text-slate-800" style={{ fontFamily: "var(--font-playfair)" }}>{promoters.length}</p>
              </div>
              <User className="h-8 w-8 text-green-600" />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulário de Cadastro */}
          <div className="lg:col-span-1">
            <Card className="border border-white/50 bg-white/70 backdrop-blur-lg shadow-xl rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center text-xl text-slate-800" style={{ fontFamily: "var(--font-playfair)" }}>
                  <PlusCircle className="mr-2" style={{ color: "#5D3A5B" }} />
                  Cadastrar Promotor
                </CardTitle>
                <CardDescription className="text-slate-600" style={{ fontFamily: "var(--font-inter)" }}>Adicione um novo promotor ao sistema.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-slate-700 font-medium" style={{ fontFamily: "var(--font-inter)" }}>Nome do Promotor *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="border-white/50 bg-white/80 backdrop-blur-sm focus:border-purple-300 focus:ring-purple-400/50 rounded-2xl"
                      placeholder="Ex: Carlos Mendes"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-slate-700 font-medium" style={{ fontFamily: "var(--font-inter)" }}>Telefone (com DDD) *</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={handlePhoneChange}
                      required
                      className="border-white/50 bg-white/80 backdrop-blur-sm focus:border-purple-300 focus:ring-purple-400/50 rounded-2xl"
                      placeholder="(67) 99999-9999"
                      maxLength={15}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="w-full text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-purple-500/20 rounded-2xl"
                    style={{ background: "linear-gradient(to right, #5D3A5B, #4A2E49, #3B2338)" }}
                  >
                    {isSubmitting ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</>
                    ) : (
                      <>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Salvar Promotor
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Promotores */}
          <div className="lg:col-span-2">
            <Card className="border border-white/50 bg-white/70 backdrop-blur-lg shadow-xl rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center text-xl text-slate-800" style={{ fontFamily: "var(--font-playfair)" }}>
                  <Users className="mr-2" style={{ color: "#5D3A5B" }}/>
                  Promotores Cadastrados
                </CardTitle>
                <CardDescription className="text-slate-600" style={{ fontFamily: "var(--font-inter)" }}>
                  Lista de todos os promotores no sistema ({promoters.length} total).
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {promoters.length === 0 ? (
                  <div className="p-8 text-center">
                    <Users className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                    <h3 className="text-lg font-medium text-slate-800 mb-2" style={{ fontFamily: "var(--font-playfair)" }}>Nenhum promotor cadastrado</h3>
                    <p className="text-slate-600" style={{ fontFamily: "var(--font-inter)" }}>Comece cadastrando seu primeiro promotor usando o formulário ao lado.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-slate-200/50">
                        <TableHead className="text-slate-600 font-medium">Nome</TableHead>
                        <TableHead className="text-slate-600 font-medium">Telefone</TableHead>
                        <TableHead className="text-right text-slate-600 font-medium">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {promoters.map((promoter: any) => (
                        <TableRow key={promoter.id} className="border-b border-slate-100/50 hover:bg-white/50">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(to right, #5D3A5B, #4A2E49, #3B2338)" }}>
                                <User className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <div className="font-medium text-slate-800" style={{ fontFamily: "var(--font-inter)" }}>{promoter.name}</div>
                                <div className="text-sm text-slate-500">Promotor</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-slate-800">
                              <Phone className="w-4 h-4 text-slate-400" />
                              {promoter.phone}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleDelete(promoter.id, promoter.name)}
                              className="border-red-200/50 bg-red-50/70 text-red-700 hover:bg-red-100 hover:border-red-300 backdrop-blur-sm rounded-2xl"
                            >
                              <Trash2 className="w-4 h-4"/>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}