import axios from "axios";

// O Vite agora cuida do proxy local de /api -> http://localhost:3001
const api = axios.create({
  baseURL: "/api",
});

// 🔐 Interceptor - envia token automaticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("auth_user");
      localStorage.removeItem("auth_expiry");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;