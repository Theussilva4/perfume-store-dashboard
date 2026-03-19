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
  margemPadrao?: number;
}
