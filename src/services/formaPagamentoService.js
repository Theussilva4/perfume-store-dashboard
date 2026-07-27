import api from "./api";

export async function getFormasPagamento() {
  const res = await api.get("/planopagamento");
  return res.data;
}

export async function criarFormaPagamento(data) {
  const res = await api.post("/planopagamento", data);
  return res.data;
}

export async function atualizarFormaPagamento(id, data) {
  const res = await api.put(`/planopagamento/${id}`, data);
  return res.data;
}

export async function alterarStatusFormaPagamento(id, ativo) {
  const res = await api.patch(`/planopagamento/${id}/ativo`, { ativo });
  return res.data;
}
