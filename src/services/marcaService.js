import api from "./api";

export async function getMarcas() {
  const res = await api.get("/marcas");
  return res.data;
}

export async function createMarca(dados) {
  const res = await api.post("/marcas", dados);
  return res.data;
}

export async function updateMarca(id, dados) {
  const res = await api.patch(`/marcas/${id}`, dados);
  return res.data;
}

export async function deleteMarca(id) {
  const res = await api.delete(`/marcas/${id}`);
  return res.data;
}
