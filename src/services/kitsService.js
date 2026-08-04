import api from "./api";

export async function getKits() {
  const response = await api.get("/kits");
  return response.data;
}

export async function createKit(kit) {
  const response = await api.post("/kits", kit);
  return response.data;
}

export async function updateKit(id, kit) {
  const response = await api.put(`/kits/${id}`, kit);
  return response.data;
}

export async function deleteKit(id) {
  const response = await api.delete(`/kits/${id}`);
  return response.data;
}
