import api from "./api"; // 👈 ESSA LINHA É OBRIGATÓRIA

export const loginRequest = async (login, password) => {
  const response = await api.post("/login", {
    login,
    password,
  });

  return response.data;
};