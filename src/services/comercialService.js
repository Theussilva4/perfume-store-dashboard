import api from "./api";

// Configurações
export const getConfiguracao = async () => {
  const res = await api.get("/comercial/configuracao");
  return res.data;
};

export const updateConfiguracao = async (data) => {
  const res = await api.put("/comercial/configuracao", data);
  return res.data;
};

// Tabela de Preços
export const listarTabela = async () => {
  const res = await api.get("/comercial/tabela");
  return res.data;
};

export const getHistorico = async (codproduto) => {
  const res = await api.get(`/comercial/historico/${codproduto}`);
  return res.data;
};

export const definirPreco = async (codproduto, data) => {
  const res = await api.post(`/comercial/definir/${codproduto}`, data);
  return res.data;
};

// Motor
export const simularPreco = async (codproduto) => {
  const res = await api.get(`/comercial/simular/${codproduto}`);
  return res.data;
};

// Promoções
export const listarPromocoes = async () => {
  const res = await api.get("/comercial/promocoes");
  return res.data;
};

export const criarPromocao = async (data) => {
  const res = await api.post("/comercial/promocoes", data);
  return res.data;
};

export const updatePromocao = async (codpromocao, data) => {
  const res = await api.put(`/comercial/promocoes/${codpromocao}`, data);
  return res.data;
};

export const deletarPromocao = async (codpromocao) => {
  const res = await api.delete(`/comercial/promocoes/${codpromocao}`);
  return res.data;
};
