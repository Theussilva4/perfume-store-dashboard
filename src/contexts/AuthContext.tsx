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

  // ✅ Recupera usuário ao recarregar a página
  useEffect(() => {
  const userStorage = localStorage.getItem("auth_user");

  if (userStorage) {
    setUsuario(JSON.parse(userStorage));
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
  };

  const sair = () => {
    setUsuario(null);
    localStorage.removeItem("auth_user");
    localStorage.removeItem("token");
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