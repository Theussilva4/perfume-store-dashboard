import { createContext, useContext, useState, ReactNode } from "react";

export interface Branch {
  id: string;
  name: string;
  label: string;
}

export const branches: Branch[] = [
  { id: "matriz", name: "Matriz", label: "Matriz" },
  { id: "filial1", name: "Filial 1", label: "Filial 1" },
];

type BranchFilter = "todas" | string;

interface BranchContextType {
  selectedBranch: BranchFilter;
  setSelectedBranch: (b: BranchFilter) => void;
  branchLabel: string;
}

const BranchContext = createContext<BranchContextType | null>(null);

export const BranchProvider = ({ children }: { children: ReactNode }) => {
  const [selectedBranch, setSelectedBranch] = useState<BranchFilter>("todas");

  const branchLabel =
    selectedBranch === "todas"
      ? "Todas as Unidades"
      : branches.find((b) => b.id === selectedBranch)?.label || selectedBranch;

  return (
    <BranchContext.Provider value={{ selectedBranch, setSelectedBranch, branchLabel }}>
      {children}
    </BranchContext.Provider>
  );
};

export const useBranch = () => {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error("useBranch must be used within BranchProvider");
  return ctx;
};
