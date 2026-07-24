import api from "./api";

export const getFornecedores = async () => {
  const response = await api.get("/fornecedores");
  return response.data;
};

export const createFornecedor = async (data) => {
  const response = await api.post("/fornecedores", data);
  return response.data;
};

export const updateFornecedor = async (uuid, data) => {
  const response = await api.put(`/fornecedores/${uuid}`, data);
  return response.data;
};

export const deleteFornecedor = async (uuid) => {
  const response = await api.delete(`/fornecedores/${uuid}`);
  return response.data;
};
