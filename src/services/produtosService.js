import api from "./api";

export async function getProdutos() {
  const res = await api.get("/produtos");
  return res.data;
}

export async function updateProduto(id, dados) {
  const res = await api.patch(`/produtos/${id}`, dados);
  return res.data;
}

export async function createProduto(dados) {
  const res = await api.post("/produtos", dados);
  return res.data;
}