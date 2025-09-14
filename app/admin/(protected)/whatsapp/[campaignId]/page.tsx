"use client";

import { useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import useSWR, { mutate } from 'swr';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ArrowLeft, RefreshCw, Users, Mail, PlayCircle, BarChart, PlusCircle, Loader2, Send, Check, CheckCheck, XCircle, Inbox } from "lucide-react";
import { Playfair_Display, Poppins } from "next/font/google";
import Image from "next/image";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-playfair" });
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-poppins" });

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Tipos
type Consultant = { id: string; nome: string; telefone: string; };
type WhatsappMessage = { id: string; recipient_number: string; recipient_name: string; status: string; };
type Campaign = {
    id: string;
    name: string;
    message_template: string;
    status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
    messages: WhatsappMessage[];
};
type WhatsappIncomingMessage = {
    id: string;
    from_number: string;
    message_body: string;
    received_at: string;
};


export default function CampaignDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const campaignId = params.campaignId as string;

  const { data: campaignResponse, error, isLoading, mutate: mutateCampaign } = useSWR(`/api/whatsapp/campaigns/${campaignId}`, fetcher, { revalidateOnFocus: false });
  const { data: leadsResponse } = useSWR('/api/leads/id?status=APROVADO', fetcher, { revalidateOnFocus: false });
  const { data: incomingMessagesResponse } = useSWR(`/api/whatsapp/incoming-messages?campaignId=${campaignId}`, fetcher);
  
  const campaign: Campaign | undefined = campaignResponse?.data;
  const incomingMessages: WhatsappIncomingMessage[] = incomingMessagesResponse?.data || [];

  const approvedConsultants: Consultant[] = useMemo(() => {
    if (!leadsResponse?.data) return [];
    return leadsResponse.data.map((lead: any) => ({
        id: lead.consultant.id,
        nome: lead.consultant.nome,
        telefone: lead.consultant.telefone,
    }));
  }, [leadsResponse]);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Calcula as estatísticas da campanha
  const stats = useMemo(() => {
    if (!campaign?.messages) return { sent: 0, delivered: 0, read: 0, failed: 0, deliveryRate: 0, readRate: 0 };
    const messages = campaign.messages;
    const sent = messages.filter(m => m.status !== 'pending' && m.status !== 'draft').length;
    const delivered = messages.filter(m => m.status === 'delivered' || m.status === 'read').length;
    const read = messages.filter(m => m.status === 'read').length;
    const failed = messages.filter(m => m.status === 'failed').length;
    
    const deliveryRate = sent > 0 ? (delivered / sent) * 100 : 0;
    const readRate = delivered > 0 ? (read / delivered) * 100 : 0;

    return { sent, delivered, read, failed, deliveryRate, readRate };
  }, [campaign]);


  const handleToggleContact = (contactId: string) => {
    setSelectedContacts(prev =>
      prev.includes(contactId) ? prev.filter(id => id !== contactId) : [...prev, contactId]
    );
  };

  const handleImportContacts = async () => {
    if (selectedContacts.length === 0) {
        toast({ title: "Nenhum contato selecionado", variant: "destructive" });
        return;
    }
    setIsImporting(true);
    try {
        const response = await fetch(`/api/whatsapp/campaigns/${campaignId}/add-recipients`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contactIds: selectedContacts }),
        });
        if (!response.ok) throw new Error("Falha ao adicionar contatos.");
        toast({ title: "Sucesso!", description: `${selectedContacts.length} contatos adicionados à campanha.` });
        mutateCampaign();
        setIsImportModalOpen(false);
        setSelectedContacts([]);
    } catch (error) {
        toast({ title: "Erro", description: "Não foi possível adicionar os contatos.", variant: "destructive" });
    } finally {
        setIsImporting(false);
    }
  };

  const handleStartSending = async () => {
    setIsSending(true);
    try {
        const response = await fetch(`/api/whatsapp/campaigns/${campaignId}/send`, {
            method: 'POST',
        });
        if (!response.ok) throw new Error("Falha ao iniciar o envio da campanha.");
        toast({ title: "Campanha Enviada!", description: "As mensagens estão sendo processadas." });
        mutateCampaign();
    } catch (error) {
        toast({ title: "Erro", description: "Não foi possível enviar a campanha.", variant: "destructive" });
    } finally {
        setIsSending(false);
    }
  };

  const refreshData = () => {
    mutateCampaign();
    toast({
        title: "Dados atualizados!",
        description: "As informações da campanha foram recarregadas.",
        duration: 2000
    });
  };
  
  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
        draft: "bg-gray-100 text-gray-800 border-gray-200",
        pending: "bg-amber-100 text-amber-800 border-amber-200",
        sent: "bg-blue-100 text-blue-800 border-blue-200",
        delivered: "bg-green-100 text-green-800 border-green-200",
        read: "bg-purple-100 text-purple-800 border-purple-200",
        failed: "bg-red-100 text-red-800 border-red-200",
    };
    const statusText: Record<string, string> = {
        draft: "Rascunho",
        pending: "Pendente",
        sent: "Enviada",
        delivered: "Entregue",
        read: "Lida",
        failed: "Falhou",
    }
    return <Badge className={variants[status] || "bg-gray-100 text-gray-800"}>{statusText[status] || status}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Carregando Campanha...</h2>
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 flex items-center justify-center">
            <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
                <h2 className="text-xl font-semibold text-red-600 mb-2">Campanha não encontrada.</h2>
                <Button onClick={() => router.back()}>Voltar</Button>
            </div>
      </div>
    );
  }

  const hasPendingMessages = campaign.messages.some(m => m.status === 'pending');

  return (
    <>
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 ${poppins.variable} ${playfair.variable} font-sans`}>
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg">
                <Image src="/logo2.png" alt="Segunda Pele" width={40} height={40} className="filter brightness-0 invert" />
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900" style={{ fontFamily: "var(--font-playfair)" }}>Campanha</span>
                <p className="text-sm text-gray-600 truncate max-w-xs" style={{ fontFamily: "var(--font-poppins)" }}>{campaign.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button onClick={refreshData} variant="outline" size="sm" className="border-purple-200 bg-white text-purple-700 hover:bg-purple-50 hover:text-purple-800 shadow-sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
              <Button variant="outline" size="sm" onClick={() => router.push('/admin/whatsapp')} className="border-purple-200 bg-white text-purple-700 hover:bg-purple-50 hover:text-purple-800 shadow-sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Detalhes da Campanha</CardTitle>
                        <CardDescription>Status: {getStatusBadge(campaign.status)}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Nome</p>
                            <p className="font-semibold">{campaign.name}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Mensagem</p>
                            <p className="text-sm p-3 bg-gray-50 rounded-md border">{campaign.message_template}</p>
                        </div>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button className="w-full bg-green-600 hover:bg-green-700" disabled={!hasPendingMessages || isSending}>
                                    {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />}
                                    {isSending ? 'Enviando...' : `Iniciar Envio (${campaign.messages.filter(m => m.status === 'pending').length})`}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmar Envio da Campanha?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Você está prestes a enviar esta campanha para {campaign.messages.filter(m => m.status === 'pending').length} destinatários. Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleStartSending} className="bg-green-600 hover:bg-green-700">Confirmar e Enviar</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Estatísticas</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-blue-50 rounded-md text-center">
                            <p className="text-xl font-bold text-blue-800">{stats.sent}</p>
                            <p className="text-xs text-blue-700">Enviadas</p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-md text-center">
                            <p className="text-xl font-bold text-green-800">{stats.delivered}</p>
                            <p className="text-xs text-green-700">Entregues ({stats.deliveryRate.toFixed(1)}%)</p>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-md text-center">
                            <p className="text-xl font-bold text-purple-800">{stats.read}</p>
                            <p className="text-xs text-purple-700">Lidas ({stats.readRate.toFixed(1)}%)</p>
                        </div>
                        <div className="p-3 bg-red-50 rounded-md text-center">
                            <p className="text-xl font-bold text-red-800">{stats.failed}</p>
                            <p className="text-xs text-red-700">Falhas</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-2">
                <Tabs defaultValue="recipients">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="recipients">Destinatários</TabsTrigger>
                        <TabsTrigger value="responses">Respostas</TabsTrigger>
                    </TabsList>
                    <TabsContent value="recipients">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Destinatários</CardTitle>
                                    <CardDescription>{campaign.messages.length} contatos nesta campanha.</CardDescription>
                                </div>
                                <Button onClick={() => setIsImportModalOpen(true)} disabled={campaign.status !== 'draft'}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Contatos
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {campaign.messages.length === 0 ? (
                                    <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-lg">
                                        <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum destinatário</h3>
                                        <p className="text-gray-600">Adicione contatos para iniciar o envio da campanha.</p>
                                    </div>
                                ) : (
                                    <div className="max-h-96 overflow-y-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Nome</TableHead>
                                                    <TableHead>Número</TableHead>
                                                    <TableHead>Status</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {campaign.messages.map(msg => (
                                                    <TableRow key={msg.id}>
                                                        <TableCell>{msg.recipient_name}</TableCell>
                                                        <TableCell>{msg.recipient_number}</TableCell>
                                                        <TableCell>{getStatusBadge(msg.status)}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="responses">
                    <Card>
                        <CardHeader>
                            <CardTitle>Respostas Recebidas</CardTitle>
                            <CardDescription>Mensagens enviadas pelas consultoras.</CardDescription>
                        </CardHeader>
                        <CardContent>
                        {incomingMessages.length === 0 ? (
                                <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-lg">
                                    <Inbox className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma resposta</h3>
                                    <p className="text-gray-600">As respostas recebidas aparecerão aqui.</p>
                                </div>
                            ) : (
                                <div className="max-h-96 overflow-y-auto space-y-4">
                                    {incomingMessages.map(msg => (
                                        <div key={msg.id} className="p-3 bg-gray-50 rounded-lg border">
                                            <div className="flex justify-between items-center mb-1">
                                                <p className="font-semibold text-sm">{msg.from_number}</p>
                                                <p className="text-xs text-gray-500">{format(new Date(msg.received_at), 'dd/MM/yy HH:mm', { locale: ptBR })}</p>
                                            </div>
                                            <p className="text-sm">{msg.message_body}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
      </div>
    </div>

    <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
            <DialogHeader>
                <DialogTitle>Importar Contatos</DialogTitle>
                <DialogDescription>Selecione as consultoras aprovadas para adicionar a esta campanha.</DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto pr-2">
                <Table>
                    <TableHeader className="sticky top-0 bg-white">
                        <TableRow>
                            <TableHead className="w-10">
                                <Checkbox
                                    checked={selectedContacts.length > 0 && selectedContacts.length === approvedConsultants.length}
                                    onCheckedChange={(checked) => {
                                        if (checked) {
                                            setSelectedContacts(approvedConsultants.map(c => c.id));
                                        } else {
                                            setSelectedContacts([]);
                                        }
                                    }}
                                />
                            </TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead>Telefone</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {approvedConsultants.map(contact => (
                            <TableRow key={contact.id}>
                                <TableCell>
                                    <Checkbox
                                        checked={selectedContacts.includes(contact.id)}
                                        onCheckedChange={() => handleToggleContact(contact.id)}
                                    />
                                </TableCell>
                                <TableCell>{contact.nome}</TableCell>
                                <TableCell>{contact.telefone}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsImportModalOpen(false)}>Cancelar</Button>
                <Button onClick={handleImportContacts} disabled={isImporting}>
                    {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                    Adicionar {selectedContacts.length} Contatos
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}