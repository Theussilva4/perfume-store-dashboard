import api from "./api";

export async function getCliente() {
  const res = await api.get("/cliente");
  return res.data;
}

export async function createCliente(dados) {
  const res = await api.post("/cliente", dados);
  return res.data;
}

export async function updateCliente(id, dados) {
  const res = await api.patch(`/cliente/${id}`, dados);
  return res.data;
}

export async function deleteCliente(id) {
  const res = await api.delete(`/cliente/${id}`);
  return res.data;
}

export async function alterarStatusCliente(id, ativo) {
  const res = await api.patch(`/cliente/${id}/ativo`, { ativo });
  return res.data;
}
