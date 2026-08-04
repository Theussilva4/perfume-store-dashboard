import axios from "axios";

const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.hostname.startsWith("192.168.");

const api = axios.create({
  baseURL: isLocalhost ? "/api" : "https://deassisdev-api-site-matheus.bwb8as.easypanel.host/api",
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
