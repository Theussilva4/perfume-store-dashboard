import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import api from "@/services/api";

interface Usuario {
  nome: string;
  login: string;
  email: string;
  cargo: "admin" | "vendedor";
  codvendedor?: number;
  codfilial?: number;
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
  const TEMPO_EXPIRACAO_SESSAO = 24 * 60 * 60 * 1000;

  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    const userStorage = localStorage.getItem("auth_user");
    const expiryDate = localStorage.getItem("auth_expiry");

    if (userStorage && expiryDate) {
      if (Date.now() > Number(expiryDate)) {
        localStorage.removeItem("auth_user");
        localStorage.removeItem("token");
        localStorage.removeItem("auth_expiry");
        return null;
      } else {
        return JSON.parse(userStorage);
      }
    }
    return null;
  });

  const carregarConfiguracoes = async () => {
    try {
      const { data } = await api.get("/configuracoes");
      if (data) {
        if (data.nome_loja) localStorage.setItem("storeName", data.nome_loja);
        if (data.telefone_loja) localStorage.setItem("phone", data.telefone_loja);
        if (data.chave_pix) localStorage.setItem("pixKey", data.chave_pix);
        if (data.endereco_loja) localStorage.setItem("address", data.endereco_loja);
        if (data.instagram_loja) localStorage.setItem("instagram", data.instagram_loja);
        if (data.facebook_loja) localStorage.setItem("facebook", data.facebook_loja);
        
        localStorage.setItem("fastClientMode", String(data.cadastro_rapido_cliente !== false));
        localStorage.setItem("allowOutOfStockOrders", String(data.venda_sem_estoque !== false));
        localStorage.setItem("askProductSupplier", String(data.exigir_fornecedor !== false));
        localStorage.setItem("allowBuyFromAnySupplier", String(data.venda_qualquer_fornecedor !== false));
        localStorage.setItem("allowProductsWithoutPrice", String(data.venda_sem_preco === true));
      }
    } catch (error) {
      console.error("Erro ao carregar configurações globais:", error);
    }
  };

  useEffect(() => {
    // Se o usuário já estiver logado quando a página carregar, a gente atualiza as configurações
    if (usuario) {
      carregarConfiguracoes();
    }
  }, []);

  const entrar = async (token: string, userData: any) => {
    localStorage.setItem("token", token);

    const user: Usuario = {
      nome: userData.nome,
      login: userData.email,
      email: userData.email,
      cargo: userData.tipo === "ADMIN" ? "admin" : "vendedor",
      codvendedor: userData.codvendedor,
    };

    setUsuario(user);
    localStorage.setItem("auth_user", JSON.stringify(user));
    // Marcamos no relógio que hrs a sessão expira daqui pra frente (Data Atual + 1 Dia)
    localStorage.setItem("auth_expiry", String(Date.now() + TEMPO_EXPIRACAO_SESSAO));

    // Carregar configurações da empresa e salvar no localStorage
    await carregarConfiguracoes();
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