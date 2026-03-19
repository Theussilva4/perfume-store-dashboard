// types.ts (crie esse arquivo ou coloque no topo do seu componente)
// src/types.ts
export interface Product {
  codproduto: number; // INT do banco
  descricao: string;
  marca: string;
  categoria: string;
  codigo_barras: string;
  volume_ml: number;
  preco_normal: number;
  preco_promocao: number;
  estoque: number;
  ativo: string;
  data_cadastro: string;
}