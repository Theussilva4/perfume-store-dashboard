import api from "./api";

export interface Vendedor {
  codvendedor: number;
  uuid?: string;
  nome: string;
  cpf: string | null;
  ativo: string;
  codfilial?: number;
  telefone?: string;
  email?: string;
  comissao_padrao?: number;
  meta_vendas?: number;
  data_nascimento?: string;
  endereco?: string;
  cidade?: string;
  uf?: string;
  data_criacao?: string;
  created_at?: string;
  updated_at?: string;
}

export const getVendedores = async (): Promise<Vendedor[]> => {
  const response = await api.get("/vendedor");
  return response.data;
};

export const createVendedor = async (vendedor: Partial<Vendedor>): Promise<Vendedor> => {
  const response = await api.post("/vendedor", vendedor);
  return response.data;
};

export const updateVendedor = async (id: number, vendedor: Partial<Vendedor>): Promise<Vendedor> => {
  const response = await api.patch(`/vendedor/${id}`, vendedor);
  return response.data;
};

export const updateVendedorStatus = async (id: number, ativo: string): Promise<Vendedor> => {
  const response = await api.patch(`/vendedor/${id}/ativo`, { ativo });
  return response.data;
};
