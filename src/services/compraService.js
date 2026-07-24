import api from "./api";

export const getCompras = async () => {
  const response = await api.get("/compras");
  return response.data;
};

export const createCompra = async (data) => {
  const response = await api.post("/compras", data);
  return response.data;
};

export const getCompraById = async (uuid) => {
  const response = await api.get(`/compras/${uuid}`);
  return response.data;
};
