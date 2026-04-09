import api from "./api";

export async function getFormasPagamento() {
  const res = await api.get("/planopagamento");
  return res.data;
}
