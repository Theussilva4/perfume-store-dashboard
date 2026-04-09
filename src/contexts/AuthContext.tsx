import { createContext, useContext, useState, ReactNode, useEffect } from "react";

interface Usuario {
  nome: string;
  login: string;
  email: string;
  cargo: "admin" | "vendedor";
}

interface AuthContextType {
  usuario: Usuario | null;
  estaAutenticado: boolean;
  entrar: (token: string, user: any) => void;
  sair: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  // Tempo de validade do login (24 horas = 86400000ms)
  const TEMPO_EXPIRACAO_SESSAO = 24 * 60 * 60 * 1000;

  // ✅ Recupera usuário ao recarregar a página validando o "prazo de validade"
  useEffect(() => {
    const userStorage = localStorage.getItem("auth_user");
    const expiryDate = localStorage.getItem("auth_expiry");

    // Verifica se existe o timer e se o tempo atual já ultrapassou o limite
    if (userStorage && expiryDate) {
      if (Date.now() > Number(expiryDate)) {
        // Se a sessão expirou, limpamos o cache e exigimos novo login
        localStorage.removeItem("auth_user");
        localStorage.removeItem("token");
        localStorage.removeItem("auth_expiry");
        setUsuario(null);
      } else {
        // Se a sessão está em dia, loga silenciosamente 
        setUsuario(JSON.parse(userStorage));
      }
    }
  }, []);

  const entrar = (token: string, userData: any) => {
    localStorage.setItem("token", token);

    const user: Usuario = {
      nome: userData.nome,
      login: userData.email,
      email: userData.email,
      cargo: userData.tipo === "ADMIN" ? "admin" : "vendedor",
    };

    setUsuario(user);
    localStorage.setItem("auth_user", JSON.stringify(user));
    // Marcamos no relógio que hrs a sessão expira daqui pra frente (Data Atual + 1 Dia)
    localStorage.setItem("auth_expiry", String(Date.now() + TEMPO_EXPIRACAO_SESSAO));
  };

  const sair = () => {
    setUsuario(null);
    localStorage.removeItem("auth_user");
    localStorage.removeItem("token");
    localStorage.removeItem("auth_expiry");
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        entrar,
        sair,
        estaAutenticado: !!usuario,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};