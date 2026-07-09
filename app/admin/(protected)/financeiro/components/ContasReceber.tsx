"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Playfair_Display, Inter } from "next/font/google";
import { Loader2, Plus, Download, Search, CheckCircle, FileText, Check } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { toast } from "@/components/ui/use-toast";

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-playfair" });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-inter" });

export default function ContasReceber() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Form State
  const [formData, setFormData] = useState({
    description: "",
    reference: "",
    invoice: "",
    total_value: "",
    due_date: "",
    category: "",
    payment_method: "",
    installment: "1/1"
  });

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/financeiro?type=RECEIVABLE");
      const { data } = await res.json();
      if (data) {
        setTransactions(data);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleAddSubmit = async (e: React.MouseEvent | React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.total_value || !formData.due_date) {
      toast({ title: "Erro", description: "Preencha a descrição, valor total e vencimento.", variant: "destructive" });
      return;
    }
    setIsAdding(true);
    try {
      const res = await fetch("/api/admin/financeiro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "RECEIVABLE",
          ...formData,
          total_value: parseFloat(formData.total_value),
        }),
      });
      if (res.ok) {
        toast({ title: "Sucesso", description: "Conta a receber cadastrada com sucesso." });
        setFormData({
          description: "", reference: "", invoice: "", total_value: "",
          due_date: "", category: "", payment_method: "", installment: "1/1"
        });
        document.getElementById("close-add-modal")?.click();
        fetchTransactions();
      } else {
        toast({ title: "Erro", description: "Falha ao cadastrar.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast({ title: "Erro", description: "Ocorreu um erro no servidor.", variant: "destructive" });
    } finally {
      setIsAdding(false);
    }
  };

  const handleQuitar = async (id: string, total_value: number) => {
    try {
      const res = await fetch(`/api/admin/financeiro/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "QUITADO",
          paid_value: total_value,
          payment_date: new Date().toISOString()
        })
      });
      if (res.ok) {
        toast({ title: "Sucesso", description: "Conta baixada como Quitada." });
        fetchTransactions();
      }
    } catch (error) {
      console.error("Erro ao quitar", error);
    }
  };

  const filtered = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (t.reference && t.reference.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Relatório de Contas a Receber", 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [["Ref", "Descrição", "Vencimento", "Total", "Status"]],
      body: filtered.map(t => [
        t.reference || "-",
        t.description,
        format(new Date(t.due_date), "dd/MM/yyyy"),
        `R$ ${t.total_value.toFixed(2)}`,
        t.status
      ])
    });
    doc.save("contas-a-receber.pdf");
  };

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filtered.map(t => ({
      Referência: t.reference,
      Descrição: t.description,
      Nota_Fiscal: t.invoice,
      Total: t.total_value,
      Pago: t.paid_value,
      Parcela: t.installment,
      Vencimento: format(new Date(t.due_date), "dd/MM/yyyy"),
      Status: t.status,
      Forma_Pagamento: t.payment_method
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Contas a Receber");
    XLSX.writeFile(workbook, "contas-a-receber.xlsx");
  };

  return (
    <div className={`space-y-6 ${inter.variable} ${playfair.variable}`}>
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="flex gap-4">
          <Input 
            placeholder="Buscar por descrição ou referência..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-80"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Situação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="NAO_PAGO">Não Pago</SelectItem>
              <SelectItem value="QUITADO">Quitado</SelectItem>
              <SelectItem value="VENCIDO">Vencido</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportPDF} className="text-red-600 border-red-200 hover:bg-red-50">
            <FileText className="w-4 h-4 mr-2" /> PDF
          </Button>
          <Button variant="outline" onClick={exportExcel} className="text-green-600 border-green-200 hover:bg-green-50">
            <Download className="w-4 h-4 mr-2" /> Excel
          </Button>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-purple-700 hover:bg-purple-800 text-white">
                <Plus className="w-4 h-4 mr-2" /> Adicionar Conta
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="font-playfair text-xl">Nova Conta a Receber</DialogTitle>
                <DialogDescription>Cadastre uma nova obrigação financeira.</DialogDescription>
              </DialogHeader>
              <form className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Descrição *</label>
                    <Input required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Ex: Fornecedor XYZ" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Valor Total (R$) *</label>
                    <Input required type="number" step="0.01" value={formData.total_value} onChange={e => setFormData({...formData, total_value: e.target.value})} placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Data de Vencimento *</label>
                    <Input required type="date" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Referência (Opcional)</label>
                    <Input value={formData.reference} onChange={e => setFormData({...formData, reference: e.target.value})} placeholder="Código ou Ref" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nota Fiscal (Opcional)</label>
                    <Input value={formData.invoice} onChange={e => setFormData({...formData, invoice: e.target.value})} placeholder="Número NFe" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Forma de Pagamento (Opcional)</label>
                    <Select value={formData.payment_method} onValueChange={val => setFormData({...formData, payment_method: val})}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione a forma" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Boleto Bancário">Boleto Bancário</SelectItem>
                        <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                        <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                        <SelectItem value="Cheque">Cheque</SelectItem>
                        <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="Depósito Bancário">Depósito Bancário</SelectItem>
                        <SelectItem value="Transferência bancária">Transferência bancária</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Parcela (Opcional)</label>
                    <Input value={formData.installment} onChange={e => setFormData({...formData, installment: e.target.value})} placeholder="Ex: 1/1" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Categoria/Grupo (Opcional)</label>
                    <Input value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} placeholder="Ex: Despesas Fixas" />
                  </div>
                </div>
                <div className="pt-4 flex justify-end gap-2">
                  <DialogTrigger asChild>
                    <Button id="close-add-modal" type="button" variant="ghost">Cancelar</Button>
                  </DialogTrigger>
                  <Button type="button" onClick={handleAddSubmit} disabled={isAdding} className="bg-purple-700 hover:bg-purple-800 text-white">
                    {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar Conta"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="whitespace-nowrap">Referência</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Nota Fiscal</TableHead>
                <TableHead className="text-right">Total (R$)</TableHead>
                <TableHead className="text-right">Pago (R$)</TableHead>
                <TableHead className="text-center">Parcela</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Carregando contas...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-slate-500">
                    Nenhuma conta a receber encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((t) => (
                  <TableRow key={t.id} className="hover:bg-slate-50 transition-colors">
                    <TableCell className="text-slate-500 text-sm">{t.reference || "-"}</TableCell>
                    <TableCell className="font-medium text-slate-800">{t.description}</TableCell>
                    <TableCell className="text-slate-500 text-sm">{t.invoice || "-"}</TableCell>
                    <TableCell className="text-right font-medium">{(t.total_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right text-emerald-600 font-medium">{(t.paid_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-center text-slate-500 text-sm">{t.installment}</TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(t.due_date), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        t.status === 'QUITADO' ? 'bg-emerald-100 text-emerald-700' :
                        t.status === 'VENCIDO' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {t.status === 'NAO_PAGO' ? 'Não Pago' : t.status === 'QUITADO' ? 'Quitado' : 'Vencido'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {t.status !== 'QUITADO' && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleQuitar(t.id, t.total_value)}
                          className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 h-8"
                        >
                          <Check className="w-4 h-4 mr-1" /> Quitar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
