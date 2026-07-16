import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { createClient } from "@/lib/supabase/client";

export async function generateAcertoPDF(acerto: any) {
  const supabase = createClient();
  const doc = new jsPDF();

  // ---------------------------------------------------------
  // PÁGINA 1: RESUMO DO ACERTO
  // ---------------------------------------------------------
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Resumo de Acerto Financeiro", 14, 22);

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Data do Acerto: ${new Date(acerto.created_at).toLocaleDateString("pt-BR")}`, 14, 32);
  doc.text(`Promotor: ${acerto.profiles?.nome || 'Desconhecido'}`, 14, 38);
  doc.text(`Período: ${acerto.period || 'Não especificado'}`, 14, 44);

  const { data: allReturns } = await supabase.from('inventory_transactions').select('product_id, quantity, color, size, notes').like('notes', '%Devolu%').like('notes', '%Acerto%');

  const kitDetails = [];
  
  if (acerto.details && acerto.details.length > 0) {
      const { data: prods } = await supabase.from('products').select('id, price, category_id');
      const { data: cats } = await supabase.from('categories').select('id, name');
      
      const catMap = new Map();
      if (cats) cats.forEach(c => catMap.set(c.id, c.name.toLowerCase()));

      const productsMap = new Map();
      if (prods) {
          prods.forEach(p => {
              const catName = p.category_id ? catMap.get(p.category_id) : '';
              productsMap.set(p.id, { price: p.price, isRoupa: catName && catName.includes('roupa') });
          });
      }

      for (const detail of acerto.details) {
          if (!detail.id) continue;
          
          const kitId = detail.id;
          const { data: kitData } = await supabase.from('promoter_kits')
              .select('*, resellers(*), items:promoter_kit_items(*)')
              .eq('id', kitId)
              .single();
              
          if (kitData) {
              let soldNormal = 0;
              let soldRoupas = 0;
              
              if (kitData.items) {
                  kitData.items.forEach((item: any) => {
                      let returnedQty = 0;
                      if (allReturns) {
                          const itemReturns = allReturns.filter((r: any) => r.notes.includes(`[Kit: ${kitId}]`) && r.product_id === item.product_id && r.color === item.color && r.size === item.size);
                          itemReturns.forEach((r: any) => returnedQty += r.quantity);
                      }
                      
                      const soldQty = item.quantity - returnedQty;
                      const p = productsMap.get(item.product_id);
                      if (p && soldQty > 0) {
                          if (p.isRoupa) soldRoupas += (soldQty * p.price);
                          else soldNormal += (soldQty * p.price);
                      }
                  });
              }

              const actualSold = soldNormal + soldRoupas;
              const percentSold = kitData.total_price > 0 ? (actualSold / kitData.total_price) * 100 : 0;
              
              let cp = 0;
              if (percentSold >= 100) cp = 40;
              else if (percentSold >= 70) cp = 35;
              else if (percentSold >= 30) cp = 30;
              
              const revComm = (soldNormal * (cp / 100)) + (soldRoupas * 0.25);
              
              kitDetails.push({
                  kit: kitData,
                  actualSold,
                  revComm,
                  cp,
                  items: kitData.items,
                  reseller: kitData.resellers
              });
          }
      }
  }

  const tableData = kitDetails.map(k => [
      k.reseller?.name || 'Desconhecido',
      `R$ ${k.actualSold.toFixed(2)}`,
      `R$ ${k.revComm.toFixed(2)} (${k.cp}%)`,
      `R$ ${(k.actualSold - k.revComm).toFixed(2)}`
  ]);

  autoTable(doc, {
      startY: 55,
      head: [['Revendedora', 'Venda Bruta', 'Comissão Rev.', 'Repasse Promotor']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [75, 23, 76] }
  });

  const finalY = (doc as any).lastAutoTable.finalY || 60;

  doc.setFont("helvetica", "bold");
  doc.text(`Total Faturado: R$ ${(acerto.total_paid + acerto.total_commission).toFixed(2)}`, 14, finalY + 15);
  doc.text(`Comissão Promotor: R$ ${acerto.total_commission.toFixed(2)}`, 14, finalY + 22);
  doc.text(`Valor Pago à Empresa: R$ ${acerto.total_paid.toFixed(2)}`, 14, finalY + 29);

  let currentY = finalY + 29;
  const installmentInfo = acerto.details?.find((d: any) => d.isInstallment);
  if (installmentInfo) {
      currentY += 7;
      doc.setFont("helvetica", "normal");
      doc.text(`- Pago no Ato: R$ ${installmentInfo.paidNow.toFixed(2)}`, 14, currentY);
      
      currentY += 7;
      doc.setFont("helvetica", "bold");
      const dueStr = installmentInfo.installmentDueDate ? new Date(installmentInfo.installmentDueDate + "T12:00:00Z").toLocaleDateString('pt-BR') : "";
      doc.text(`- Restante (Parcela): R$ ${installmentInfo.remainingAmount.toFixed(2)} (Vencimento: ${dueStr})`, 14, currentY);
      
      if (installmentInfo.installmentCommission > 0) {
          currentY += 7;
          doc.setFont("helvetica", "normal");
          doc.text(`(Comissão Promotor Retida na Parcela: R$ ${installmentInfo.installmentCommission.toFixed(2)})`, 14, currentY);
      }
  }

  // ---------------------------------------------------------
  // PÁGINAS SUBSEQUENTES
  // ---------------------------------------------------------
  const { data: allProds } = await supabase.from('products').select('id, name, sku, price');
  const prodInfoMap = new Map();
  if (allProds) {
      allProds.forEach(p => prodInfoMap.set(p.id, p));
  }

  for (const kitInfo of kitDetails) {
      doc.addPage();
      const k = kitInfo.kit;
      const r = kitInfo.reseller;
      
      const emissao = k.created_at ? new Date(k.created_at).toLocaleDateString("pt-BR") : "___/___/___";
      
      let cobranca = "___/___/___";
      if (k.created_at) {
          const d = new Date(k.created_at);
          d.setDate(d.getDate() + 45);
          cobranca = d.toLocaleDateString("pt-BR");
      }
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      
      doc.text(`EMISSÃO: ${emissao}`, 14, 20);
      doc.text(`DATA DE TROCA: ___/___/___`, 80, 20);
      doc.text(`PEDIDO: ${k.id.substring(0,8).toUpperCase()}`, 150, 20);
      
      doc.text(`Nome: ${r?.id ? r.id.substring(0,4).toUpperCase() : ''} - ${(r?.name || 'DESCONHECIDO').toUpperCase()}`, 14, 28);
      
      doc.setFont("helvetica", "normal");
      doc.text(`RG: ___________________`, 14, 36);
      doc.text(`CPF: ${r?.cpf || 'Não informado'}`, 80, 36);
      doc.text(`Tel: ${r?.phone || 'Não informado'}`, 150, 36);
      
      doc.text(`Endereço: ${r?.address || 'Não informado'}`, 14, 44);
      doc.text(`Bairro: ${r?.neighborhood || 'Não informado'}`, 14, 52);
      doc.text(`Cidade: ${r?.city || 'Não informado'}`, 80, 52);
      doc.text(`CEP: ${r?.zipcode || 'Não informado'}`, 150, 52);
      
      doc.text(`Ano/Semana: _____`, 14, 60);
      doc.text(`1º Ped.: ___/___`, 80, 60);
      doc.text(`Ult. Venda: ___/___`, 150, 60);
      
      doc.setFont("helvetica", "bold");
      doc.text(`Praça: ${r?.city || ''} - ${acerto.period || ''}`, 14, 68);
      doc.text(`Vendedor: ${acerto.profiles?.nome || 'Desconhecido'}`, 130, 68);
      
      let totalPcs = 0;
      let totalItems = 0;
      
      const combinedItems = new Map();
      if (k.items) {
          k.items.forEach((item: any) => {
              const key = `${item.product_id}_${item.size || ''}_${item.color || ''}`;
              if (combinedItems.has(key)) {
                  combinedItems.get(key).quantity += item.quantity;
              } else {
                  combinedItems.set(key, {
                      product_id: item.product_id,
                      quantity: item.quantity,
                      returned: 0,
                      size: item.size,
                      color: item.color
                  });
              }
          });
      }
      
      if (allReturns) {
          const kitReturns = allReturns.filter((ret: any) => ret.notes.includes(`[Kit: ${k.id}]`));
          kitReturns.forEach((ret: any) => {
              const key = `${ret.product_id}_${ret.size || ''}_${ret.color || ''}`;
              if (combinedItems.has(key)) {
                  combinedItems.get(key).returned += ret.quantity;
              } else {
                  combinedItems.set(key, {
                      product_id: ret.product_id,
                      quantity: 0,
                      returned: ret.quantity,
                      size: ret.size,
                      color: ret.color
                  });
              }
          });
      }
      
      const itemRows = Array.from(combinedItems.values()).map((item: any) => {
          const p = prodInfoMap.get(item.product_id);
          const sizeColor = (item.size || item.color) ? ` (${item.size || ''}${item.size && item.color ? ' | ' : ''}${item.color || ''})` : '';
          const name = p ? `${p.sku || ''} - ${p.name}${sizeColor}` : 'Produto Desconhecido';
          const price = p ? Number(p.price) : 0;
          const origQuant = item.quantity;
          const soldQuant = item.quantity - item.returned;
          const lineTotal = soldQuant * price;
          
          totalPcs += origQuant;
          totalItems += 1;
          
          return [
              origQuant.toString(),
              name,
              item.returned > 0 ? item.returned.toString() : '',
              soldQuant > 0 ? soldQuant.toString() : '',
              price.toFixed(2),
              lineTotal.toFixed(2)
          ];
      });
      
      autoTable(doc, {
          startY: 75,
          head: [['QUANT', 'PRODUTO', 'D', 'V', 'P. UNIT (R$)', 'TOTAL (R$)']],
          body: itemRows,
          theme: 'grid',
          styles: { fontSize: 8 },
          headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] }
      });
      
      const tableEndY = (doc as any).lastAutoTable.finalY || 80;
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(`QUANT. PEÇAS: ${totalPcs}`, 14, tableEndY + 7);
      doc.text(`ITENS: ${totalItems}`, 70, tableEndY + 7);
      doc.text(`TOTAL:`, 150, tableEndY + 7);
      doc.text(`${kitInfo.actualSold.toFixed(2)}`, 175, tableEndY + 7);
      
      doc.line(14, tableEndY + 10, 196, tableEndY + 10);
      
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("Explicativo de comissão", 14, tableEndY + 15);
      doc.text("Venda        Comissão", 14, tableEndY + 20);
      doc.text("-30%          0%", 14, tableEndY + 25);
      doc.text("+30%         30%", 14, tableEndY + 30);
      doc.text("+70%         35%", 14, tableEndY + 35);
      doc.text("100%         40%", 14, tableEndY + 40);
      doc.text("Roupas      25%", 14, tableEndY + 45);
      
      doc.text("*Não aceitamos devolução de mercadorias após 7 dias do vencimento;", 14, tableEndY + 55);
      doc.text("*Após o vencimento multa de 5% + 0,33% ao dia;", 14, tableEndY + 59);
      doc.text("*1º Kit é valido mínimo de venda de R$ 250,00 para ter comissão;", 14, tableEndY + 63);
      doc.text("*Comissão calculada sobre o valor total da mercadoria.", 14, tableEndY + 67);
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`VALOR DO KIT : R$ ${k.total_price.toFixed(2)}`, 100, tableEndY + 20);
      doc.text(`COMISSÃO : R$ ${kitInfo.revComm.toFixed(2)} - ${kitInfo.cp}%`, 100, tableEndY + 30);
      doc.text(`A PAGAR : R$ ${(kitInfo.actualSold - kitInfo.revComm).toFixed(2)}`, 100, tableEndY + 40);
      doc.text(`DATA DE COBRANÇA: ${cobranca}`, 100, tableEndY + 50);
      
      doc.rect(160, tableEndY + 15, 30, 15);
      
      doc.line(120, tableEndY + 90, 196, tableEndY + 90);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("ASSINATURA", 145, tableEndY + 95);
  }

  doc.save(`Acerto_${acerto.profiles?.nome || 'Promotor'}_${new Date(acerto.created_at).toLocaleDateString("pt-BR").replace(/\//g, "-")}.pdf`);
}
