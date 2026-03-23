import api from "./api";

export async function getCategorias() {
  const res = await api.get("/categorias");
  return res.data;
}

export async function createCategoria(dados) {
  const res = await api.post("/categorias", dados);
  return res.data;
}

export async function updateCategoria(id, dados) {
  const res = await api.patch(`/categorias/${id}`, dados);
  return res.data;
}

export async function deleteCategoria(id) {
  const res = await api.delete(`/categorias/${id}`);
  return res.data;
}
