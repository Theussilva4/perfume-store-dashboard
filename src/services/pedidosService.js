import api from "./api";

export async function getPedidos() {
  const res = await api.get("/pedidos");
  return res.data;
}

export async function createPedido(dados) {
  const res = await api.post("/pedidos", dados);
  return res.data;
}

export async function updatePedido(id, dados) {
  const res = await api.put(`/pedidos/${id}`, dados);
  return res.data;
}

export async function alterarStatusPedido(id, status) {
  const res = await api.patch(`/pedidos/${id}/status`, { status });
  return res.data;
}

export async function deletePedido(id) {
  const res = await api.delete(`/pedidos/${id}`);
  return res.data;
}
