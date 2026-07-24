export interface Produto {
  codproduto: number;
  descricao: string;
  resumo: string;
  marca: string;
  codcategoria: number;
  precoCusto: number;
  precoVenda: number;
  estoque: number;
  estoqueMinimo: number;
  estoquePorFilial: {
    matriz: number;
    filial1: number;
  };
  ativo: boolean;
  codigoBarras?: string;
  volume?: number;
  margem?: number;
  precoPromocional?: number;
}

export interface categoria {
  codcategoria: number;
  categoria: string;
  margem_padrao?: number;
}

export interface Marca {
  codmarca: number;
  marca: string;
}

export interface Cliente {
  codcliente: number;
  nome: string;
  cpf_cnpj?: string;
  telefone?: string;
  whatsapp?: string;
  email?: string;
  endereco?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  observacoes?: string;
  data_cadastro?: string;
  ativo?: "S" | "N";
}
export interface Vendedor {
  codvendedor: number;
  nome: string;
  cpf: string;
  data_cadastro: string;
  ativo: string
}

export interface Pedido{
 	numpedido:	number,
 	codcliente:	number,
 	codusur_criou:	number,
 	codusur_vendedor:	number,
 	data_pedido:	string
 	valor_total:	number,
 	status:	string
 	codfilial:	number,

}

export interface PedidoItem{
   	coditem:	number,
   	numpedido:	number,
   	codproduto:	number,
   	quantidade:	number,
   	preco_unitario:	number,
   	valor_total:	number,
}


