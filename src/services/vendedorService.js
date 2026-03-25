import api from "./api";

export async function getVendedor() {
  const res = await api.get("/vendedor");
  return res.data;
}

export async function createVendedor(dados) {
  const res = await api.post("/vendedor", dados);
  return res.data;
}

export async function updateVendedor(id, dados) {
  const res = await api.patch(`/vendedor/${id}`, dados);
  return res.data;
}

export async function deleteVendedor(id) {
  const res = await api.delete(`/vendedor/${id}`);
  return res.data;
}
