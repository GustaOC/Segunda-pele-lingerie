import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generateAcertoPDF = (
    reseller: any,
    promoterName: string,
    kit: any,
    kitItems: any[],
    financialSummary: {
        totalKitValue: number;
        totalSoldValue: number;
        percentSold: number;
        commissionNormal: number;
        commissionRoupas: number;
        totalCommission: number;
        fineAmount: number;
        finalAmountToPay: number;
        daysLate: number;
        isInstallment?: boolean;
        paidNow?: number;
        installmentDueDate?: string;
    }
) => {
    const doc = new jsPDF();
    
    const emissionDate = new Date().toLocaleDateString('pt-BR');
    const transferDate = new Date(kit?.created_at || Date.now()).toLocaleDateString('pt-BR');
    
    const tDate = new Date(kit?.created_at || Date.now());
    tDate.setDate(tDate.getDate() + 45); // Assuming 45 days is the charge date
    const chargeDate = tDate.toLocaleDateString('pt-BR');

    // HELPER to format money
    const formatMoney = (val: number) => {
        if (typeof val !== 'number' || isNaN(val)) return '0,00';
        return val.toFixed(2).replace('.', ',');
    };

    // HEADER - Row 1
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    
    doc.text(`EMISSÃO: ${emissionDate}`, 14, 20);
    doc.text(`DATA DE TROCA: ___/___/_____`, 90, 20);
    doc.text(`PEDIDO: ${(kit.id || '').substring(0,8).toUpperCase()}`, 160, 20);
    
    // Header - Row 2
    doc.text(`Nome: ${reseller?.id?.substring(0,4) || ''} - ${reseller?.name?.toUpperCase() || 'DESCONHECIDO'}`, 14, 30);
    
    // Header - Row 3
    doc.setFont("helvetica", "normal");
    doc.text(`RG...................: ____________________`, 14, 36);
    doc.text(`CPF: ${reseller?.cpf || '____________________'}`, 90, 36);
    doc.text(`Tel: ${reseller?.phone || '____________________'}`, 150, 36);
    
    // Header - Row 4
    doc.text(`Endereço: ${reseller?.address || '_____________________________________________'}`, 14, 42);
    
    // Header - Row 5
    doc.text(`Bairro......: ${reseller?.neighborhood || '_________________'}`, 14, 48);
    doc.text(`Cidade......: ${reseller?.city || '_________________'}`, 90, 48);
    doc.text(`CEP: ____________________`, 150, 48);
    
    // Header - Row 6
    doc.text(`Ano/Semana: ${kit.period || '________'}`, 14, 54);
    doc.text(`1º Ped......: ___/___`, 90, 54);
    doc.text(`Ult. Venda: ___/___`, 140, 54);
    
    // Header - Row 7
    doc.setFont("helvetica", "bold");
    doc.text(`Praça: ${reseller?.city || '_________________'} - ${transferDate} à ${chargeDate}`, 14, 60);
    doc.text(`Vendedor: ${(promoterName || 'PROMOTOR(A)').toUpperCase()}`, 120, 60);
    
    // ==========================================
    // TABLE: ITEMS
    // Columns: QUANT | PRODUTO | D | V | P. UNIT (R$) | TOTAL (R$)
    // ==========================================
    
    const itemsData = kitItems.map((item) => {
        const dStr = item.returned > 0 ? item.returned.toString() : "";
        const vStr = item.sold > 0 ? item.sold.toString() : "";
        
        return [
            item.quantity.toString(),
            `${item.sku} - ${item.product_name} (${item.size} ${item.color})`,
            dStr,
            vStr,
            formatMoney(item.price),
            formatMoney(item.sold * item.price)
        ];
    });

    autoTable(doc, {
        startY: 65,
        head: [['QUANT', 'PRODUTO', 'D', 'V', 'P. UNIT (R$)', 'TOTAL (R$)']],
        body: itemsData,
        theme: 'plain', // as requested in image, it's very plain
        styles: { 
            fontSize: 8, 
            cellPadding: 2, 
            lineColor: [200, 200, 200], 
            lineWidth: 0.1,
            textColor: [0, 0, 0]
        },
        headStyles: { 
            fillColor: [240, 240, 240], 
            textColor: [0, 0, 0], 
            fontStyle: 'bold',
            halign: 'center'
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 20 },
            1: { halign: 'left' },
            2: { halign: 'center', cellWidth: 15 },
            3: { halign: 'center', cellWidth: 15 },
            4: { halign: 'right', cellWidth: 25 },
            5: { halign: 'right', cellWidth: 25 },
        },
    });
    
    const finalY = (doc as any).lastAutoTable.finalY || 65;
    
    // Summary Row right below table
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    
    const totalPecas = kitItems.reduce((acc, item) => acc + item.quantity, 0);
    
    doc.setFillColor(240, 240, 240);
    doc.rect(14, finalY, 182, 6, "F");
    doc.text(`QUANT. PEÇAS: ${totalPecas}`, 16, finalY + 4);
    doc.text(`ITENS: ${kitItems.length}`, 60, finalY + 4);
    doc.text(`TOTAL:`, 140, finalY + 4);
    doc.text(formatMoney(financialSummary.totalSoldValue), 175, finalY + 4, { align: 'right' });
    
    // ==========================================
    // FOOTER
    // ==========================================
    
    const footerY = finalY + 15;
    
    // Left Side: Rules
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    
    doc.text("Explicativo de comissão", 14, footerY);
    doc.text("Venda        Comissão", 14, footerY + 5);
    doc.text("-30%         0%", 14, footerY + 10);
    doc.text("+30%         30%", 14, footerY + 15);
    doc.text("+70%         35%", 14, footerY + 20);
    doc.text("100%         40%", 14, footerY + 25);
    doc.text("Roupas       25%", 14, footerY + 30);
    
    doc.text("*Não aceitamos devolução de mercadorias após 7 dias do", 14, footerY + 40);
    doc.text("vencimento;", 14, footerY + 44);
    doc.text("*Após o vencimento multa de 5% + 0,33% ao dia;", 14, footerY + 48);
    doc.text("*1º Kit é valido mínimo de venda de R$ 250,00 para ter comissão;", 14, footerY + 52);
    doc.text("*Comissão calculada sobre o valor total da mercadoria.", 14, footerY + 56);
    
    // Right Side: Financial Box
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    
    doc.text(`VALOR DO KIT : R$ ${formatMoney(financialSummary.totalKitValue)}`, 100, footerY);
    
    // Commision text like "COMISSÃO : R$ 0,00 - 0%" or percentage
    let commPctStr = "";
    if (financialSummary.totalKitValue > 0) {
       // Just a rough display of effective commission %
       const effPct = (financialSummary.totalCommission / financialSummary.totalSoldValue) * 100 || 0;
       commPctStr = ` - ${effPct.toFixed(0)}%`;
    }
    
    doc.text(`COMISSÃO : R$ ${formatMoney(financialSummary.totalCommission)}${commPctStr}`, 100, footerY + 10);
    
    doc.text(`A PAGAR : R$ ${formatMoney(financialSummary.finalAmountToPay)}`, 100, footerY + 20);
    
    if (financialSummary.isInstallment) {
        doc.setFont("helvetica", "normal");
        const remaining = financialSummary.finalAmountToPay - (financialSummary.paidNow || 0);
        doc.text(`- PAGO NO ATO : R$ ${formatMoney(financialSummary.paidNow || 0)}`, 100, footerY + 25);
        doc.setFont("helvetica", "bold");
        doc.text(`- RESTANTE : R$ ${formatMoney(remaining)}`, 100, footerY + 30);
        
        let dueStr = financialSummary.installmentDueDate 
            ? new Date(financialSummary.installmentDueDate + "T12:00:00Z").toLocaleDateString("pt-BR") 
            : chargeDateStr;
        doc.text(`VENC. RESTANTE: ${dueStr}`, 100, footerY + 35);
    } else {
        doc.text(`DATA DE COBRANÇA: ${chargeDateStr}`, 100, footerY + 30);
    }
    
    // Empty Box for annotations
    doc.setLineWidth(0.3);
    doc.rect(155, footerY + (financialSummary.isInstallment ? 20 : 5), 40, 12);
    
    // Signature Line
    doc.setLineWidth(0.2);
    doc.line(130, footerY + 60, 190, footerY + 60);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("ASSINATURA", 160, footerY + 64, { align: "center" });

    // Download the PDF
    const safeName = (reseller?.name || 'reseller').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    doc.save(`acerto_${safeName}_${kit.id.substring(0,6)}.pdf`);
};
