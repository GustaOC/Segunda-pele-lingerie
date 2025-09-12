"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, PlusCircle, Trash2, Users, ArrowLeft } from "lucide-react";
import ShaderBackground from "@/components/shader-background";
import { createClient } from "@/lib/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import useSWR, { mutate } from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function PromoterManagementPage() {
  const { toast } = useToast();
  const supabase = createClient();
  const router = useRouter();
  
  const { data: promotersResponse, error, isLoading } = useSWR('/api/promoters', fetcher);
  const promoters = promotersResponse?.data || [];

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await supabase.from("promoters").insert([{ name, phone }]);

    if (error) {
      toast({
        title: "Erro!",
        description: "Não foi possível cadastrar o promotor.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sucesso!",
        description: "Promotor cadastrado com sucesso.",
      });
      setName("");
      setPhone("");
      mutate('/api/promoters'); // Re-fetch data
    }

    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este promotor?")) return;

    const { error } = await supabase.from("promoters").delete().eq('id', id);

    if (error) {
        toast({ title: "Erro!", description: "Não foi possível excluir o promotor.", variant: "destructive" });
    } else {
        toast({ title: "Sucesso!", description: "Promotor excluído." });
        mutate('/api/promoters');
    }
  }

  return (
    <ShaderBackground>
      <div className="container mx-auto p-4 py-8 text-white">
        <div className="flex justify-end mb-4">
          <Button variant="outline" size="sm" onClick={() => router.back()} className="bg-white/10 text-white hover:bg-white/20">
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center text-xl text-white">
                  <PlusCircle className="mr-2" />
                  Cadastrar Promotor
                </CardTitle>
                <CardDescription className="text-violet-200">Adicione um novo promotor ao sistema.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-violet-200">Nome do Promotor</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="bg-violet-900/40 border-violet-400 text-white placeholder-violet-200"
                      placeholder="Ex: Carlos Mendes"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-violet-200">Telefone (com DDD)</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="bg-violet-900/40 border-violet-400 text-white placeholder-violet-200"
                      placeholder="Ex: 67999998888"
                    />
                  </div>
                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</>
                    ) : (
                      "Salvar Promotor"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
          <div className="md:col-span-2">
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardHeader>
                    <CardTitle className="flex items-center text-xl text-white">
                        <Users className="mr-2"/>
                        Promotores Cadastrados
                    </CardTitle>
                    <CardDescription className="text-violet-200">Lista de todos os promotores no sistema.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? <Loader2 className="mx-auto h-8 w-8 animate-spin text-white"/> : (
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b border-white/20 hover:bg-transparent">
                                <TableHead className="text-violet-200">Nome</TableHead>
                                <TableHead className="text-violet-200">Telefone</TableHead>
                                <TableHead className="text-right text-violet-200">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {promoters.map((p: any) => (
                                <TableRow key={p.id} className="border-b border-white/20 hover:bg-white/5">
                                    <TableCell className="font-medium text-white">{p.name}</TableCell>
                                    <TableCell className="text-white">{p.phone}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="destructive" size="sm" onClick={() => handleDelete(p.id)}>
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
    </ShaderBackground>
  );
}