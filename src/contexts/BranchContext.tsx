import { createContext, useContext, useState, ReactNode } from "react";

export interface Filial {
  id: string;
  nome: string;
  rotulo: string;
}

export const filiais: Filial[] = [
  { id: "matriz", nome: "Matriz", rotulo: "Matriz" },
  { id: "filial1", nome: "Filial 1", rotulo: "Filial 1" },
];

type FiltroFilial = "todas" | string;

interface BranchContextType {
  filialSelecionada: FiltroFilial;
  setFilialSelecionada: (b: FiltroFilial) => void;
  rotuloFilial: string;
}

const BranchContext = createContext<BranchContextType | null>(null);

export const BranchProvider = ({ children }: { children: ReactNode }) => {
  const [filialSelecionada, setFilialSelecionada] = useState<FiltroFilial>("todas");

  const rotuloFilial =
    filialSelecionada === "todas"
      ? "Todas as Unidades"
      : filiais.find((b) => b.id === filialSelecionada)?.rotulo || filialSelecionada;

  return (
    <BranchContext.Provider value={{ filialSelecionada, setFilialSelecionada, rotuloFilial }}>
      {children}
    </BranchContext.Provider>
  );
};

export const useBranch = () => {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error("useBranch must be used within BranchProvider");
  return ctx;
};
