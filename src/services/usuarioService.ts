import api from "./api";

export interface Usuario {
  codusur: number;
  nome: string;
  login: string;
  email?: string;
  telefone?: string;
  cpf?: string;
  tipo_usuario?: string;
  ativo: string;
  codfilial?: number;
  codvendedor?: number;
  data_nascimento?: string;
  ultimo_login?: string;
}

export const getUsuarios = async (): Promise<Usuario[]> => {
  const response = await api.get("/usuario");
  return response.data.dados || response.data;
};

export const createUsuario = async (dados: Partial<Usuario> & { senha?: string }): Promise<Usuario> => {
  const response = await api.post("/usuario", dados);
  return response.data.dados || response.data;
};

export const updateUsuario = async (id: number, dados: Partial<Usuario> & { senha?: string }): Promise<Usuario> => {
  const response = await api.put(`/usuario/${id}`, dados);
  return response.data.dados || response.data;
};
