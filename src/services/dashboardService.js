import api from "./api";

export const getDashboardMetrics = async () => {
  const response = await api.get("/dashboard");
  return response.data;
};
