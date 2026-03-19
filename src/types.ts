// types.ts (crie esse arquivo ou coloque no topo do seu componente)
// src/types.ts
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
}
export interface categoria {
  codcategoria: number;
  categoria: string;
}