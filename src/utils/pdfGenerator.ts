import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const gerarEspelhoPedido = (pedido: any) => {
  const doc = new jsPDF();

  // Configurações iniciais
  const marginX = 14;
  let posY = 20;

  // Cabeçalho da Empresa (Substitua pelos dados reais depois)
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("SISTEMA DE GESTÃO - ESPELHO DO PEDIDO", marginX, posY);
  
  posY += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Filial: ${pedido.nomeFilial || 'Não informada'}`, marginX, posY);
  
  posY += 5;
  const dataFormatada = new Date(pedido.data || new Date()).toLocaleDateString("pt-BR");
  doc.text(`Data de Emissão: ${dataFormatada}`, marginX, posY);
  
  // Linha separadora
  posY += 5;
  doc.setLineWidth(0.5);
  doc.line(marginX, posY, 195, posY);

  // Informações do Pedido e Cliente
  posY += 8;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`Pedido Nº: ${pedido.numero || pedido.id}`, marginX, posY);
  
  posY += 6;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Cliente: ${pedido.nomeCliente || 'Não informado'}`, marginX, posY);
  
  posY += 5;
  doc.text(`Telefone: ${pedido.telefoneCliente || 'Não informado'}`, marginX, posY);
  
  posY += 5;
  doc.text(`Forma de Pagamento: ${pedido.nomeFormaPagamento || 'Não informada'}`, marginX, posY);

  posY += 8;

  // Tabela de Itens
  const tableColumn = ["Cód.", "Descrição do Produto", "Qtd", "Vlr Unit (R$)", "Total (R$)"];
  const tableRows: any[] = [];

  const itens = pedido.itens || pedido.mspedido_item || [];

  itens.forEach((item: any) => {
    const qtd = Number(item.quantidade || 1);
    const preco = Number(item.preco || item.preco_unitario || 0);
    const totalItem = qtd * preco;

    const rowData = [
      item.produtoId || item.codproduto || "-",
      item.nomeProduto || item.Produto?.descricao || "-",
      qtd.toString(),
      preco.toLocaleString("pt-BR", { minimumFractionDigits: 2 }),
      totalItem.toLocaleString("pt-BR", { minimumFractionDigits: 2 })
    ];
    tableRows.push(rowData);
  });

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: posY,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [41, 128, 185] }, // Azul
    columnStyles: {
      0: { cellWidth: 20 },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' },
    }
  });

  // Totais
  // @ts-ignore
  const finalY = doc.lastAutoTable.finalY + 10;
  
  const subtotal = Number(pedido.subtotal || 0);
  const desconto = Number(pedido.desconto || 0);
  const total = Number(pedido.total || pedido.valor_total || 0);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Subtotal:`, 140, finalY);
  doc.text(`R$ ${subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 195, finalY, { align: "right" });

  doc.text(`Desconto:`, 140, finalY + 6);
  doc.text(`R$ ${desconto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 195, finalY + 6, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(`Total Final:`, 140, finalY + 14);
  doc.text(`R$ ${total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 195, finalY + 14, { align: "right" });

  // Download do arquivo
  doc.save(`pedido_${pedido.numero || pedido.id}.pdf`);
};
