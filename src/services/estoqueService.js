import api from "./api";

export async function getEstoque() {
  const res = await api.get("/estoque");
  return res.data;
}

export async function updateEstoque(id, dados) {
  const res = await api.patch(`/estoque/${id}`, dados);
  return res.data;
}

export async function createEstoque(dados) {
  const res = await api.post("/estoque", dados);
  return res.data;
}

export async function getSaidas() {
  const res = await api.get("/estoque/saidas");
  return res.data;
}

export async function createSaida(dados) {
  const res = await api.post("/estoque/saidas", dados);
  return res.data;
}

export async function createEntrada(dados) {
  const res = await api.post("/estoque/entradas", dados);
  return res.data;
}

export async function getEntradas() {
  const res = await api.get("/estoque/entradas");
  return res.data;
}

export async function cancelarSaida(id) {
  const res = await api.post(`/estoque/saidas/${id}/cancelar`);
  return res.data;
}

export async function getExtratoEstoque(produtoId, dataInicial, dataFinal) {
  let params = new URLSearchParams();
  if (dataInicial) params.append("dataInicial", dataInicial);
  if (dataFinal) params.append("dataFinal", dataFinal);
  
  const query = params.toString() ? `?${params.toString()}` : "";
  const res = await api.get(`/estoque/produto/${produtoId}/extrato${query}`);
  return res.data;
}

// Trigger Vite HMR
