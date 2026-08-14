import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import api from "@/services/api";

export interface Filial {
  id: string;
  nome: string;
  rotulo: string;
}

type FiltroFilial = "todas" | string;

interface BranchContextType {
  filialSelecionada: FiltroFilial;
  setFilialSelecionada: (b: FiltroFilial) => void;
  rotuloFilial: string;
  filiais: Filial[];
}

const BranchContext = createContext<BranchContextType | null>(null);

export const BranchProvider = ({ children }: { children: ReactNode }) => {
  const [filiais, setFiliais] = useState<Filial[]>([]);
  const [filialSelecionada, setFilialSelecionada] = useState<FiltroFilial>(() => {
    try {
      const userStr = localStorage.getItem("auth_user");
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.codfilial) return String(user.codfilial);
      }
    } catch (e) {
      console.error(e);
    }
    return "1";
  });

  useEffect(() => {
    api.get("/filial").then(res => {
      if (res.data && Array.isArray(res.data)) {
        setFiliais(res.data.map((f: any) => ({
          id: String(f.codfilial),
          nome: f.filial,
          rotulo: f.filial
        })));
      }
    }).catch(console.error);
  }, []);

  const rotuloFilial =
    filialSelecionada === "todas"
      ? "Todas as Unidades"
      : filiais.find((b) => b.id === filialSelecionada)?.rotulo || "Desconhecida";

  return (
    <BranchContext.Provider value={{ filialSelecionada, setFilialSelecionada, rotuloFilial, filiais }}>
      {children}
    </BranchContext.Provider>
  );
};

export const useBranch = () => {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error("useBranch must be used within a BranchProvider");
  }
  return context;
};
