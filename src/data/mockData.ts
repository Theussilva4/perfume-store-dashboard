export interface EstoqueFilial {
  matriz: number;
  filial1: number;
}

export interface Produto {
  id: string;
  nome: string;
  categoria: string;
  descricao: string;
  marca: string;
  precoCusto: number;
  precoVenda: number;
  estoque: number;
  estoquePorFilial: EstoqueFilial;
  estoqueMinimo: number;
  imagem?: string;
  ativo: boolean;
}

export interface Categoria {
  id: string;
  nome: string;
  quantidadeProdutos: number;
}

export interface ItemPedido {
  produtoId: string;
  nomeProduto: string;
  quantidade: number;
  preco: number;
}

export interface Pedido {
  id: string;
  numero: number;
  nomeCliente: string;
  telefoneCliente: string;
  enderecoCliente?: string;
  itens: ItemPedido[];
  total: number;
  formaPagamento: "pix" | "dinheiro" | "cartao" | "pendente";
  status: "aguardando" | "pago" | "separando" | "entregue" | "cancelado";
  data: string;
  observacoes?: string;
  filial: string;
}

export interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  quantidadePedidos: number;
  totalGasto: number;
}

export interface MovimentacaoEstoque {
  id: string;
  produtoId: string;
  nomeProduto: string;
  tipo: "entrada" | "saida";
  quantidade: number;
  motivo?: string;
  fornecedor?: string;
  custo?: number;
  data: string;
  observacoes?: string;
  filial: string;
}

export const categorias: Categoria[] = [
  { id: "1", nome: "Perfumes Importados", quantidadeProdutos: 12 },
  { id: "2", nome: "Perfumes Nacionais", quantidadeProdutos: 8 },
  { id: "3", nome: "Bolsas", quantidadeProdutos: 5 },
  { id: "4", nome: "Relógios", quantidadeProdutos: 4 },
  { id: "5", nome: "Óculos", quantidadeProdutos: 3 },
  { id: "6", nome: "Acessórios", quantidadeProdutos: 7 },
];

export const produtos: Produto[] = [
  { id: "1", nome: "Baccarat Rouge 540", categoria: "Perfumes Importados", descricao: "Fragrância oriental floral", marca: "Maison Francis Kurkdjian", precoCusto: 280, precoVenda: 500, estoque: 12, estoquePorFilial: { matriz: 8, filial1: 4 }, estoqueMinimo: 5, ativo: true },
  { id: "2", nome: "Bleu de Chanel", categoria: "Perfumes Importados", descricao: "Fragrância amadeirada aromática", marca: "Chanel", precoCusto: 220, precoVenda: 400, estoque: 8, estoquePorFilial: { matriz: 5, filial1: 3 }, estoqueMinimo: 5, ativo: true },
  { id: "3", nome: "Santal 33", categoria: "Perfumes Importados", descricao: "Fragrância amadeirada", marca: "Le Labo", precoCusto: 350, precoVenda: 600, estoque: 3, estoquePorFilial: { matriz: 2, filial1: 1 }, estoqueMinimo: 5, ativo: true },
  { id: "4", nome: "Aventus Creed", categoria: "Perfumes Importados", descricao: "Fragrância frutada", marca: "Creed", precoCusto: 400, precoVenda: 800, estoque: 5, estoquePorFilial: { matriz: 3, filial1: 2 }, estoqueMinimo: 3, ativo: true },
  { id: "5", nome: "Light Blue D&G", categoria: "Perfumes Importados", descricao: "Fragrância cítrica", marca: "Dolce & Gabbana", precoCusto: 150, precoVenda: 300, estoque: 15, estoquePorFilial: { matriz: 10, filial1: 5 }, estoqueMinimo: 5, ativo: true },
  { id: "6", nome: "Oud Wood", categoria: "Perfumes Importados", descricao: "Fragrância oud", marca: "Tom Ford", precoCusto: 380, precoVenda: 700, estoque: 2, estoquePorFilial: { matriz: 2, filial1: 0 }, estoqueMinimo: 3, ativo: true },
  { id: "7", nome: "Flowerbomb", categoria: "Perfumes Importados", descricao: "Fragrância floral oriental", marca: "Viktor & Rolf", precoCusto: 200, precoVenda: 380, estoque: 5, estoquePorFilial: { matriz: 3, filial1: 2 }, estoqueMinimo: 5, ativo: true },
  { id: "8", nome: "Noir de Noir", categoria: "Perfumes Importados", descricao: "Fragrância oriental", marca: "Tom Ford", precoCusto: 420, precoVenda: 850, estoque: 1, estoquePorFilial: { matriz: 1, filial1: 0 }, estoqueMinimo: 3, ativo: true },
  { id: "9", nome: "Malbec", categoria: "Perfumes Nacionais", descricao: "Fragrância amadeirada", marca: "O Boticário", precoCusto: 60, precoVenda: 130, estoque: 20, estoquePorFilial: { matriz: 12, filial1: 8 }, estoqueMinimo: 10, ativo: true },
  { id: "10", nome: "Egeo", categoria: "Perfumes Nacionais", descricao: "Fragrância fresca", marca: "O Boticário", precoCusto: 50, precoVenda: 110, estoque: 18, estoquePorFilial: { matriz: 10, filial1: 8 }, estoqueMinimo: 10, ativo: true },
  { id: "11", nome: "Bolsa Elegance Preta", categoria: "Bolsas", descricao: "Bolsa de couro sintético", marca: "TassiAchando", precoCusto: 45, precoVenda: 120, estoque: 7, estoquePorFilial: { matriz: 4, filial1: 3 }, estoqueMinimo: 3, ativo: true },
  { id: "12", nome: "Relógio Classic Gold", categoria: "Relógios", descricao: "Relógio analógico dourado", marca: "TassiAchando", precoCusto: 80, precoVenda: 200, estoque: 4, estoquePorFilial: { matriz: 3, filial1: 1 }, estoqueMinimo: 2, ativo: true },
];

export const pedidos: Pedido[] = [
  { id: "1", numero: 1001, nomeCliente: "Maria Silva", telefoneCliente: "(11) 99999-1111", itens: [{ produtoId: "1", nomeProduto: "Baccarat Rouge 540", quantidade: 1, preco: 500 }], total: 500, formaPagamento: "pix", status: "entregue", data: "2026-03-11", filial: "matriz" },
  { id: "2", numero: 1002, nomeCliente: "João Santos", telefoneCliente: "(11) 99999-2222", itens: [{ produtoId: "2", nomeProduto: "Bleu de Chanel", quantidade: 1, preco: 400 }, { produtoId: "5", nomeProduto: "Light Blue D&G", quantidade: 1, preco: 300 }], total: 700, formaPagamento: "cartao", status: "pago", data: "2026-03-11", filial: "matriz" },
  { id: "3", numero: 1003, nomeCliente: "Ana Oliveira", telefoneCliente: "(11) 99999-3333", itens: [{ produtoId: "4", nomeProduto: "Aventus Creed", quantidade: 1, preco: 800 }], total: 800, formaPagamento: "pendente", status: "aguardando", data: "2026-03-10", filial: "filial1" },
  { id: "4", numero: 1004, nomeCliente: "Carlos Pereira", telefoneCliente: "(11) 99999-4444", enderecoCliente: "Rua das Flores, 123", itens: [{ produtoId: "9", nomeProduto: "Malbec", quantidade: 2, preco: 130 }], total: 260, formaPagamento: "dinheiro", status: "separando", data: "2026-03-10", filial: "filial1" },
  { id: "5", numero: 1005, nomeCliente: "Lucia Ferreira", telefoneCliente: "(11) 99999-5555", itens: [{ produtoId: "11", nomeProduto: "Bolsa Elegance Preta", quantidade: 1, preco: 120 }, { produtoId: "7", nomeProduto: "Flowerbomb", quantidade: 1, preco: 380 }], total: 500, formaPagamento: "pix", status: "entregue", data: "2026-03-09", filial: "matriz" },
  { id: "6", numero: 1006, nomeCliente: "Pedro Lima", telefoneCliente: "(11) 99999-6666", itens: [{ produtoId: "3", nomeProduto: "Santal 33", quantidade: 1, preco: 600 }], total: 600, formaPagamento: "pix", status: "pago", data: "2026-03-09", filial: "filial1" },
  { id: "7", numero: 1007, nomeCliente: "Fernanda Costa", telefoneCliente: "(11) 99999-7777", itens: [{ produtoId: "12", nomeProduto: "Relógio Classic Gold", quantidade: 1, preco: 200 }], total: 200, formaPagamento: "cartao", status: "cancelado", data: "2026-03-08", filial: "matriz" },
];

export const clientes: Cliente[] = [
  { id: "1", nome: "Maria Silva", telefone: "(11) 99999-1111", quantidadePedidos: 5, totalGasto: 2800 },
  { id: "2", nome: "João Santos", telefone: "(11) 99999-2222", quantidadePedidos: 3, totalGasto: 1900 },
  { id: "3", nome: "Ana Oliveira", telefone: "(11) 99999-3333", quantidadePedidos: 2, totalGasto: 1600 },
  { id: "4", nome: "Carlos Pereira", telefone: "(11) 99999-4444", quantidadePedidos: 4, totalGasto: 1040 },
  { id: "5", nome: "Lucia Ferreira", telefone: "(11) 99999-5555", quantidadePedidos: 6, totalGasto: 3200 },
  { id: "6", nome: "Pedro Lima", telefone: "(11) 99999-6666", quantidadePedidos: 1, totalGasto: 600 },
  { id: "7", nome: "Fernanda Costa", telefone: "(11) 99999-7777", quantidadePedidos: 2, totalGasto: 400 },
];

export const movimentacoesEstoque: MovimentacaoEstoque[] = [
  { id: "1", produtoId: "1", nomeProduto: "Baccarat Rouge 540", tipo: "entrada", quantidade: 10, fornecedor: "Importadora Luxe", custo: 2800, data: "2026-03-01", observacoes: "Reposição mensal", filial: "matriz" },
  { id: "2", produtoId: "2", nomeProduto: "Bleu de Chanel", tipo: "entrada", quantidade: 5, fornecedor: "Importadora Luxe", custo: 1100, data: "2026-03-01", filial: "filial1" },
  { id: "3", produtoId: "1", nomeProduto: "Baccarat Rouge 540", tipo: "saida", quantidade: 1, motivo: "venda", data: "2026-03-11", filial: "matriz" },
  { id: "4", produtoId: "6", nomeProduto: "Oud Wood", tipo: "saida", quantidade: 1, motivo: "perda", data: "2026-03-08", observacoes: "Frasco quebrado", filial: "matriz" },
  { id: "5", produtoId: "9", nomeProduto: "Malbec", tipo: "entrada", quantidade: 20, fornecedor: "O Boticário Distribuidor", custo: 1200, data: "2026-03-05", filial: "filial1" },
];

export const rotulosFormaPagamento: Record<string, string> = {
  pix: "PIX",
  dinheiro: "Dinheiro",
  cartao: "Cartão",
  pendente: "Pendente",
};

export const rotulosStatus: Record<string, string> = {
  aguardando: "Aguardando Pagamento",
  pago: "Pago",
  separando: "Separando",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

export const coresStatus: Record<string, string> = {
  aguardando: "text-amber-600 bg-amber-50",
  pago: "text-primary bg-primary/10",
  separando: "text-blue-600 bg-blue-50",
  entregue: "text-success bg-success/10",
  cancelado: "text-destructive bg-destructive/10",
};

export const rotulosFilial: Record<string, string> = {
  matriz: "Matriz",
  filial1: "Filial 1",
};

/** Obter estoque de um produto para uma filial */
export function obterEstoqueProduto(p: Produto, filial: string): number {
  if (filial === "todas") return p.estoque;
  return p.estoquePorFilial[filial as keyof EstoqueFilial] ?? 0;
}
