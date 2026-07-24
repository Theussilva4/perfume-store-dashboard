import axios from "axios";

// Em produção, ele usa a URL da nuvem. Localmente, continua usando /api (proxy)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
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