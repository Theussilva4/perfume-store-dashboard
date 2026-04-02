import api from "./api";

export async function getFilial() {
  const res = await api.get("/filial");
  return res.data;
}

export async function updateFilial(id, dados) {
  const res = await api.patch(`/filial/${id}`, dados);
  return res.data;
}

export async function createFilial(dados) {
  const res = await api.post("/filial", dados);
  return res.data;
}