const { jsPDF } = require("jspdf");
require("jspdf-autotable");
const fs = require("fs");

const doc = new jsPDF();
doc.setFontSize(16);
doc.text("Acerto Financeiro", 10, 20);

doc.autoTable({
    startY: 30,
    head: [['Nome da Revendedora', 'Venda', 'Comissão', 'Empresa']],
    body: [
        ['Izabella Silva', 'R$ 2378,60', 'R$ 237,86', 'R$ 1308,23']
    ]
});

doc.addPage();
// Pagina 2 - Detalhe
doc.setFontSize(10);
doc.text("EMISSÃO: 12/07/2026", 10, 10);
doc.text("DATA DE TROCA: ___/___/___", 80, 10);
doc.text("PEDIDO: A38B0EF6", 150, 10);

doc.setFontSize(12);
doc.text("Nome: 2525 - IZABELLA SILVA DOS SANTOS", 10, 20);
doc.setFontSize(10);
doc.text("RG: ___________________", 10, 28);
doc.text("CPF: 02882737106", 80, 28);
doc.text("Tel: 67992638374", 150, 28);
doc.text("Endereço: Rua Maracaju", 10, 36);
doc.text("Bairro: Centro", 10, 44);
doc.text("Cidade: Campo Grande - MS", 80, 44);
doc.text("CEP: 79002214", 150, 44);

doc.autoTable({
    startY: 60,
    head: [['QUANT', 'PRODUTO', 'D', 'V', 'P. UNIT (R$)', 'TOTAL (R$)']],
    body: [
        ['6', 'TOP-FIT-06 - Top fit', '', '6', '150,00', '900,00'],
        ['1', 'SUT-BAS-02 - Sutiã', '', '1', '69,90', '69,90']
    ]
});

fs.writeFileSync("test.pdf", doc.output());
console.log("PDF gerado com sucesso: test.pdf");
