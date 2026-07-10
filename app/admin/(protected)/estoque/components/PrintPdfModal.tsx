"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { FileText } from "lucide-react"

type PrintPdfModalProps = {
  isOpen: boolean
  onClose: () => void
  kit: any
  reseller: any
  promoter: any
}

export default function PrintPdfModal({ isOpen, onClose, kit, reseller, promoter }: PrintPdfModalProps) {
  const [showQtyKit, setShowQtyKit] = useState(true)
  const [showQtyVendida, setShowQtyVendida] = useState(true)
  const [showPrecoUnit, setShowPrecoUnit] = useState(true)
  const [showTotalItem, setShowTotalItem] = useState(true)
  const [showTotalKit, setShowTotalKit] = useState(true)
  const [groupProductCode, setGroupProductCode] = useState(true)

  const handleGeneratePdf = () => {
    const doc = new jsPDF()

    // 1. Header Information
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    
    // Dates
    const today = new Date().toLocaleDateString('pt-BR')
    doc.text(`EMISSÃO: ${today}`, 14, 15)
    doc.text(`COBRANÇA: ___/___/___`, 70, 15)
    doc.text(`VISITA: ___/___/___`, 130, 15)
    doc.text(`PEDIDO: ${kit.id.substring(0, 8).toUpperCase()}`, 170, 15)

    // Revendedora
    doc.setFont("helvetica", "normal")
    const revendedoraName = reseller ? reseller.name.toUpperCase() : "NÃO INFORMADA"
    doc.setFont("helvetica", "bold")
    doc.text(`Nome: ${reseller?.id?.substring(0, 4) || '0000'} - ${revendedoraName}`, 14, 22)
    
    doc.setFont("helvetica", "normal")
    doc.text(`RG................: ________________`, 14, 28)
    doc.text(`CPF: __________________`, 70, 28)
    doc.text(`Tel: __________________`, 130, 28)
    
    doc.text(`Indicação: ____________________________________________________________________`, 14, 34)
    doc.text(`Endereço: ____________________________________________________________________`, 14, 40)
    
    doc.text(`Bairro......: ________________`, 14, 46)
    doc.text(`Cidade......: ________________`, 70, 46)
    doc.text(`CEP: _______________`, 140, 46)

    doc.text(`Ano/Semana: ___/___`, 14, 52)
    doc.text(`1º Ped......: ___/___`, 70, 52)
    doc.text(`Ult. Venda: ___/___`, 110, 52)
    
    const promoterName = promoter ? promoter.nome.toUpperCase() : "NÃO INFORMADO"
    doc.setFont("helvetica", "bold")
    doc.text(`Praça: ___________________`, 14, 58)
    doc.text(`Vendedor: ${promoter?.id?.substring(0, 4) || '0000'} - ${promoterName}`, 80, 58)

    // 2. Table Data
    const head = [[] as string[]]
    if (showQtyKit) head[0].push("QUANT")
    head[0].push("PRODUTO")
    head[0].push("D")
    if (showQtyVendida) head[0].push("V")
    if (showPrecoUnit) head[0].push("P. UNIT (R$)")
    if (showTotalItem) head[0].push("TOTAL (R$)")

    const body = []
    let totalPieces = 0
    let totalValue = 0

    // Grouping by SKU if selected
    let itemsToPrint = kit.items || []
    if (groupProductCode) {
      const grouped: Record<string, any> = {}
      itemsToPrint.forEach((item: any) => {
        const key = item.sku || item.product_name
        if (!grouped[key]) {
          grouped[key] = { ...item }
        } else {
          grouped[key].quantity += item.quantity
        }
      })
      itemsToPrint = Object.values(grouped)
    }

    itemsToPrint.forEach((item: any) => {
      const row = []
      if (showQtyKit) row.push(item.quantity.toString())
      const prodName = groupProductCode 
          ? `${item.sku || '-'} - ${item.product_name}` 
          : `${item.sku || '-'} - ${item.product_name} (${item.size}|${item.color})`
      row.push(prodName)
      row.push("") // D
      if (showQtyVendida) row.push(item.quantity.toString()) // V
      const itemPrice = item.price || 0
      if (showPrecoUnit) row.push(itemPrice.toFixed(2).replace('.', ','))
      if (showTotalItem) row.push((itemPrice * item.quantity).toFixed(2).replace('.', ','))
      
      body.push(row)
      totalPieces += item.quantity
      totalValue += itemPrice * item.quantity
    })

    // @ts-ignore
    autoTable(doc, {
      startY: 63,
      head: head,
      body: body,
      theme: 'grid',
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center' },
      styles: { fontSize: 8, cellPadding: 2, textColor: [0,0,0], lineColor: [150, 150, 150] },
      columnStyles: {
        0: { halign: 'center', cellWidth: showQtyKit ? 20 : 0 },
        2: { halign: 'center', cellWidth: 15 },
        3: { halign: 'center', cellWidth: 15 },
        4: { halign: 'right', cellWidth: 25 },
        5: { halign: 'right', cellWidth: 25 }
      }
    })

    // 3. Footer Summary (Totals)
    // @ts-ignore
    let finalY = doc.lastAutoTable?.finalY || 65
    
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.setDrawColor(150)
    doc.line(14, finalY, 196, finalY)
    doc.text(`QUANT. PEÇAS: ${totalPieces}`, 14, finalY + 5)
    doc.text(`ITENS: ${itemsToPrint.length}`, 60, finalY + 5)
    if (showTotalKit) {
      doc.text(`TOTAL:`, 140, finalY + 5)
      doc.text(`${totalValue.toFixed(2).replace('.', ',')}`, 175, finalY + 5)
    }
    doc.line(14, finalY + 7, 196, finalY + 7)

    // 4. Commissions and Signatures
    finalY += 12
    doc.setFontSize(8)
    doc.setFont("helvetica", "normal")
    doc.text("Explicativo de comissão", 14, finalY)
    doc.text("Venda        Comissão", 14, finalY + 4)
    doc.text("-30%          0%", 14, finalY + 8)
    doc.text("+30%         30%", 14, finalY + 12)
    doc.text("+70%         35%", 14, finalY + 16)
    doc.text("100%         40%", 14, finalY + 20)
    doc.text("Roupas        25%", 14, finalY + 24)

    doc.text("*Não aceitamos devolução de mercadorias após 7 dias do", 14, finalY + 30)
    doc.text("vencimento;", 14, finalY + 34)
    doc.text("*Após o vencimento multa de 5% + 0,33% ao dia;", 14, finalY + 38)
    doc.text("*1º Kit é valido mínimo de venda de R$ 250,00 para ter comissão;", 14, finalY + 42)
    doc.text("*Comissão calculada sobre o valor total da mercadoria.", 14, finalY + 46)

    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.text(`VALOR DO KIT :  R$ ${totalValue.toFixed(2).replace('.', ',')}`, 100, finalY + 4)
    doc.text(`COMISSÃO : R$ 0,00 - 0%`, 100, finalY + 12)
    doc.text(`A PAGAR : R$ ${totalValue.toFixed(2).replace('.', ',')}`, 100, finalY + 20)
    doc.text(`VOLTAREI DIA: ____/____/____`, 100, finalY + 28)

    // Signature box
    doc.setDrawColor(0)
    doc.rect(155, finalY, 40, 15)
    
    doc.line(120, finalY + 55, 196, finalY + 55)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.text("ASSINATURA", 148, finalY + 59)

    doc.save(`cobranca_fechamento_${revendedoraName.replace(/\s+/g, '_')}_${today.replace(/\//g, '-')}.pdf`)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="text-slate-800">Imprimir cobrança / fechamento</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="font-semibold text-slate-700 mb-3 text-sm">Mostrar os campos na impressão:</p>
          <div className="space-y-3">
            <label className="flex items-center space-x-2 text-sm text-slate-600">
              <input type="checkbox" checked={showQtyKit} onChange={e => setShowQtyKit(e.target.checked)} className="rounded border-slate-300 text-brand-plum focus:ring-brand-plum" />
              <span>Quantidade do kit</span>
            </label>
            <label className="flex items-center space-x-2 text-sm text-slate-600">
              <input type="checkbox" checked={showQtyVendida} onChange={e => setShowQtyVendida(e.target.checked)} className="rounded border-slate-300 text-brand-plum focus:ring-brand-plum" />
              <span>Quantidade Vendida</span>
            </label>
            <label className="flex items-center space-x-2 text-sm text-slate-600">
              <input type="checkbox" checked={showPrecoUnit} onChange={e => setShowPrecoUnit(e.target.checked)} className="rounded border-slate-300 text-brand-plum focus:ring-brand-plum" />
              <span>Preço Unitário</span>
            </label>
            <label className="flex items-center space-x-2 text-sm text-slate-600">
              <input type="checkbox" checked={showTotalItem} onChange={e => setShowTotalItem(e.target.checked)} className="rounded border-slate-300 text-brand-plum focus:ring-brand-plum" />
              <span>Valor Total do Item</span>
            </label>
            <label className="flex items-center space-x-2 text-sm text-slate-600">
              <input type="checkbox" checked={showTotalKit} onChange={e => setShowTotalKit(e.target.checked)} className="rounded border-slate-300 text-brand-plum focus:ring-brand-plum" />
              <span>Total do kit</span>
            </label>
          </div>

          <p className="font-semibold text-slate-700 mt-6 mb-3 text-sm">Usar agrupamento:</p>
          <label className="flex items-center space-x-2 text-sm text-slate-600">
            <input type="checkbox" checked={groupProductCode} onChange={e => setGroupProductCode(e.target.checked)} className="rounded border-slate-300 text-brand-plum focus:ring-brand-plum" />
            <span>Código do produto</span>
          </label>
        </div>

        <DialogFooter className="flex justify-between items-center sm:justify-between">
          <div className="flex gap-2 text-slate-500">
            <FileText className="w-5 h-5 text-red-500" />
            <span className="text-xs self-center font-medium">Formato: PDF</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleGeneratePdf} className="bg-brand-plum hover:bg-brand-rose text-white">Gerar PDF</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
