"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR, { mutate } from 'swr';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Users, Settings, ArrowLeft, RefreshCw, BarChart3, Bot, PlusCircle } from "lucide-react";
import { Playfair_Display, Poppins } from "next/font/google";
import Image from "next/image";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-playfair" });
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-poppins" });

// Tipos para os dados, alinhados com types/database.ts
type WhatsappCampaign = {
    id: string;
    name: string;
    message_template: string;
    status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
    created_at: string;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function WhatsappManagerPage() {
  const router = useRouter();
  const { toast } = useToast();

  // Busca de dados com SWR
  const { data: campaignsResponse, error, isLoading } = useSWR('/api/whatsapp/campaigns', fetcher);
  const campaigns: WhatsappCampaign[] = campaignsResponse?.data || [];

  // Estado do formulário
  const [campaignName, setCampaignName] = useState("");
  const [messageTemplate, setMessageTemplate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignName || !messageTemplate) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha o nome da campanha e a mensagem.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
        const response = await fetch('/api/whatsapp/campaigns', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: campaignName, message_template: messageTemplate }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro ao criar campanha');
        }

        toast({
            title: "Campanha Criada!",
            description: `A campanha "${campaignName}" foi criada como rascunho.`,
        });

        setCampaignName("");
        setMessageTemplate("");
        mutate('/api/whatsapp/campaigns'); // Revalida os dados da lista de campanhas
    } catch (err: any) {
        toast({
            title: "Erro ao criar campanha",
            description: err.message,
            variant: "destructive",
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Rascunho</Badge>;
      case "sent":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Enviada</Badge>;
      case "sending":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Enviando</Badge>;
      case "scheduled":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Agendada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const refreshData = () => {
    mutate('/api/whatsapp/campaigns');
    toast({
        title: "Dados atualizados!",
        description: "As informações da página foram recarregadas.",
        duration: 2000
    });
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 ${poppins.variable} ${playfair.variable} font-sans`}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg">
                <Image src="/logo2.png" alt="Segunda Pele" width={40} height={40} className="filter brightness-0 invert" />
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900" style={{ fontFamily: "var(--font-playfair)" }}>Segunda Pele Lingerie</span>
                <p className="text-sm text-gray-600" style={{ fontFamily: "var(--font-poppins)" }}>Gerenciador de WhatsApp</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button onClick={refreshData} variant="outline" size="sm" className="border-purple-200 bg-white text-purple-700 hover:bg-purple-50 hover:text-purple-800 shadow-sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
              <Button variant="outline" size="sm" onClick={() => router.push('/admin/dashboard')} className="border-purple-200 bg-white text-purple-700 hover:bg-purple-50 hover:text-purple-800 shadow-sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao Dashboard
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-1" style={{ fontFamily: "var(--font-playfair)" }}>
            Gerenciador de Campanhas WhatsApp
          </h1>
          <p className="text-gray-600">Envie mensagens, gerencie campanhas e visualize conversas.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
                <Card className="border-0 shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center text-xl text-gray-900" style={{ fontFamily: "var(--font-playfair)" }}>
                            <PlusCircle className="mr-2 text-purple-600" />
                            Nova Campanha
                        </CardTitle>
                        <CardDescription>Crie uma nova campanha para enviar em massa.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreateCampaign} className="space-y-4">
                            <div>
                                <Label htmlFor="campaignName" className="text-gray-700 font-medium">Nome da Campanha</Label>
                                <Input
                                id="campaignName"
                                value={campaignName}
                                onChange={(e) => setCampaignName(e.target.value)}
                                placeholder="Ex: Promoção Dia das Mães"
                                className="border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                                />
                            </div>
                            <div>
                                <Label htmlFor="messageTemplate" className="text-gray-700 font-medium">Mensagem</Label>
                                <Textarea
                                id="messageTemplate"
                                value={messageTemplate}
                                onChange={(e) => setMessageTemplate(e.target.value)}
                                placeholder="Olá {nome}, temos uma oferta especial para você!"
                                className="border-gray-200 focus:border-purple-500 focus:ring-purple-500 min-h-[120px]"
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                            >
                                {isSubmitting ? (
                                    <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Salvando...</>
                                ) : (
                                    "Salvar Campanha"
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>

            <div className="lg:col-span-2">
                <Card className="border-0 shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center text-xl text-gray-900" style={{ fontFamily: "var(--font-playfair)" }}>
                            <Bot className="mr-2 text-purple-600" />
                            Campanhas Recentes
                        </CardTitle>
                        <CardDescription>Visualize e gerencie suas campanhas salvas.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="p-8 text-center">
                                <RefreshCw className="mx-auto h-8 w-8 text-gray-400 animate-spin" />
                                <p className="mt-2 text-gray-500">Carregando campanhas...</p>
                            </div>
                        ) : error ? (
                             <div className="p-8 text-center text-red-500">Falha ao carregar campanhas.</div>
                        ) : campaigns.length === 0 ? (
                            <div className="p-8 text-center">
                                <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma campanha encontrada</h3>
                                <p className="text-gray-600">Crie sua primeira campanha no formulário ao lado.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nome da Campanha</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Data de Criação</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {campaigns.map((campaign) => (
                                        <TableRow key={campaign.id}>
                                            <TableCell className="font-medium">{campaign.name}</TableCell>
                                            <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                                            <TableCell>{format(new Date(campaign.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</TableCell>
                                            <TableCell className="text-right">
    <Button variant="outline" size="sm" onClick={() => router.push(`/admin/whatsapp/${campaign.id}`)}>
        Gerenciar
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