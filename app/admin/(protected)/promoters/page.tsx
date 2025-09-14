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
import { Playfair_Display, Poppins } from "next/font/google";
import Image from "next/image";
import useSWR, { mutate } from 'swr';

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-playfair" });
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-poppins" });

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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Carregando promotores</h2>
          <p className="text-gray-600">Aguarde um momento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 ${poppins.variable} ${playfair.variable} font-sans`}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg">
                <Image src="/logo2.png" alt="Segunda Pele Lingerie" width={40} height={40} className="filter brightness-0 invert" />
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900" style={{ fontFamily: "var(--font-playfair)" }}>Segunda Pele Lingerie</span>
                <p className="text-sm text-gray-600" style={{ fontFamily: "var(--font-poppins)" }}>Gerenciamento de Promotores</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={refreshData}
                variant="outline"
                size="sm"
                className="border-purple-200 bg-white text-purple-700 hover:bg-purple-50 hover:text-purple-800 shadow-sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
              <Button variant="outline" size="sm" onClick={() => router.back()} className="border-purple-200 bg-white text-purple-700 hover:bg-purple-50 hover:text-purple-800 shadow-sm">
                <ArrowLeft className="mr-2 h-4 w-4" /> 
                Voltar
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Título */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-1" style={{ fontFamily: "var(--font-playfair)" }}>
            Gerenciar Promotores
          </h1>
          <p className="text-gray-600">Cadastre e gerencie os promotores do sistema</p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-white to-purple-50">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total de Promotores</p>
                <p className="text-2xl font-bold text-gray-900">{promoters.length}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-white to-green-50">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Promotores Ativos</p>
                <p className="text-2xl font-bold text-gray-900">{promoters.length}</p>
              </div>
              <User className="h-8 w-8 text-green-600" />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulário de Cadastro */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center text-xl text-gray-900" style={{ fontFamily: "var(--font-playfair)" }}>
                  <PlusCircle className="mr-2 text-purple-600" />
                  Cadastrar Promotor
                </CardTitle>
                <CardDescription className="text-gray-600">Adicione um novo promotor ao sistema.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-gray-700 font-medium">Nome do Promotor *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                      placeholder="Ex: Carlos Mendes"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-gray-700 font-medium">Telefone (com DDD) *</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={handlePhoneChange}
                      required
                      className="border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                      placeholder="(67) 99999-9999"
                      maxLength={15}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
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
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center text-xl text-gray-900" style={{ fontFamily: "var(--font-playfair)" }}>
                  <Users className="mr-2 text-purple-600"/>
                  Promotores Cadastrados
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Lista de todos os promotores no sistema ({promoters.length} total).
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {promoters.length === 0 ? (
                  <div className="p-8 text-center">
                    <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum promotor cadastrado</h3>
                    <p className="text-gray-600">Comece cadastrando seu primeiro promotor usando o formulário ao lado.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-gray-200">
                        <TableHead className="text-gray-600 font-medium">Nome</TableHead>
                        <TableHead className="text-gray-600 font-medium">Telefone</TableHead>
                        <TableHead className="text-right text-gray-600 font-medium">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {promoters.map((promoter: any) => (
                        <TableRow key={promoter.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{promoter.name}</div>
                                <div className="text-sm text-gray-500">Promotor</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-gray-900">
                              <Phone className="w-4 h-4 text-gray-400" />
                              {promoter.phone}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleDelete(promoter.id, promoter.name)}
                              className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
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