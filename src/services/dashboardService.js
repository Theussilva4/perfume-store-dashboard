import api from "./api";

export const getDashboardMetrics = async (dataInicial, dataFinal) => {
  let url = "/dashboard";
  const params = new URLSearchParams();
  if (dataInicial) params.append("dataInicial", dataInicial);
  if (dataFinal) params.append("dataFinal", dataFinal);
  
  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  const { data } = await api.get(url);
  return data;
};
