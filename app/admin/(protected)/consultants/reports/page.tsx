"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Download,
  FileText,
  BarChart3,
  FileSpreadsheet,
  Mail,
  RefreshCw,
  Heart,
  ChevronLeft,
} from "lucide-react"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import ShaderBackground from "@/components/shader-background"
import Image from "next/image"

export default function ReportsPage() {
  const router = useRouter()
  const [selectedReport, setSelectedReport] = useState("overview")
  const [exportFormat, setExportFormat] = useState("excel")
  const [isGenerating, setIsGenerating] = useState(false)
  
  const handleExport = async () => {
    setIsGenerating(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    const filename = `relatorio_${selectedReport}_${format(new Date(), "yyyy-MM-dd")}.${exportFormat === "excel" ? "xlsx" : "csv"}`
    alert(`Relatório "${filename}" foi gerado com sucesso!`)
    setIsGenerating(false)
  }

  const handleScheduleReport = () => {
    alert("Funcionalidade de agendamento será implementada em breve.")
  }

  return (
    <ShaderBackground>
        <header className="bg-white/10 backdrop-blur-lg border-b border-white/20">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Image src="/logo2.png" alt="Segunda Pele Lingerie" width={50} height={50} className="drop-shadow-lg" />
                        <div>
                            <span className="text-xl font-bold text-white">Segunda Pele Lingerie</span>
                            <p className="text-sm text-violet-200">Relatórios e Análises</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Button variant="outline" size="sm" onClick={() => router.push('/admin/dashboard')} className="bg-white/10 text-white hover:bg-white/20">
                            <ChevronLeft className="w-4 h-4 mr-2" />
                            Dashboard
                        </Button>
                    </div>
                </div>
            </div>
        </header>

      <div className="container mx-auto px-4 py-8 text-white">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-80">
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Gerar Relatório
                </CardTitle>
                <CardDescription className="text-violet-200">Configure e exporte relatórios personalizados</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-violet-200">Tipo de Relatório</Label>
                  <Select value={selectedReport} onValueChange={setSelectedReport}>
                    <SelectTrigger className="bg-white/10 border-white/20"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-violet-900/90 text-white border-violet-400/30">
                      <SelectItem value="overview">Visão Geral</SelectItem>
                      <SelectItem value="promoters">Performance por Promotor</SelectItem>
                      <SelectItem value="consultants">Cadastros de Consultoras</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-violet-200">Formato de Exportação</Label>
                  <Select value={exportFormat} onValueChange={setExportFormat}>
                    <SelectTrigger className="bg-white/10 border-white/20"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-violet-900/90 text-white border-violet-400/30">
                      <SelectItem value="excel"><div className="flex items-center gap-2"><FileSpreadsheet className="w-4 h-4" />Excel (.xlsx)</div></SelectItem>
                      <SelectItem value="csv"><div className="flex items-center gap-2"><FileText className="w-4 h-4" />CSV (.csv)</div></SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Button onClick={handleExport} className="w-full" disabled={isGenerating}>
                    {isGenerating ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Gerando...</> : <><Download className="w-4 h-4 mr-2" />Exportar Relatório</>}
                  </Button>
                  <Button onClick={handleScheduleReport} variant="outline" className="w-full bg-transparent text-white">
                    <Mail className="w-4 h-4 mr-2" />
                    Agendar Envio
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex-1">
             <div className="mb-6">
              <h1 className="text-3xl font-bold text-white mb-2">Visualização de Relatórios</h1>
              <p className="text-violet-200">Selecione um tipo de relatório para visualizar os dados.</p>
            </div>
            {/* Espaço para futuros gráficos e tabelas de relatórios */}
            <div className="p-8 text-center bg-white/5 rounded-lg border border-dashed border-white/20">
                <p className="text-violet-300">A visualização do relatório aparecerá aqui.</p>
            </div>
          </div>
        </div>
      </div>
    </ShaderBackground>
  )
}