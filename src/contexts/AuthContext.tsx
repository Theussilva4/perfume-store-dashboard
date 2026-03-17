import { createContext, useContext, useState, ReactNode } from "react";

interface Usuario {
  nome: string;
  email: string;
  cargo: "admin" | "vendedor";
}

interface AuthContextType {
  usuario: Usuario | null;
  entrar: (email: string, senha: string) => boolean;
  sair: () => void;
  estaAutenticado: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    const saved = localStorage.getItem("auth_user");
    return saved ? JSON.parse(saved) : null;
  });

  const entrar = (email: string, senha: string) => {
    if (email && senha.length >= 4) {
      const u: Usuario = { nome: "Administrador", email, cargo: "admin" };
      setUsuario(u);
      localStorage.setItem("auth_user", JSON.stringify(u));
      return true;
    }
    return false;
  };

  const sair = () => {
    setUsuario(null);
    localStorage.removeItem("auth_user");
  };

  return (
    <AuthContext.Provider value={{ usuario, entrar, sair, estaAutenticado: !!usuario }}>
      {children}
    </AuthContext.Provider>
  );
};
