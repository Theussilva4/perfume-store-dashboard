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


getEstoque,updateEstoque,createEstoque