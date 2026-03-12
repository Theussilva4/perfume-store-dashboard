import { useState } from "react";
import { products, getProductStock, branchLabels } from "@/data/mockData";
import { useBranch } from "@/contexts/BranchContext";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, AlertTriangle, Package } from "lucide-react";

const Stock = () => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const { selectedBranch, branchLabel } = useBranch();

  const getStock = (p: typeof products[0]) => getProductStock(p, selectedBranch);

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const stock = getStock(p);
    if (filter === "low") return matchSearch && stock <= p.minStock && stock > 0;
    if (filter === "out") return matchSearch && stock === 0;
    return matchSearch;
  });

  const lowCount = products.filter((p) => { const s = getStock(p); return s <= p.minStock && s > 0; }).length;
  const outCount = products.filter((p) => getStock(p) === 0).length;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h2 className="font-display text-2xl md:text-3xl font-semibold text-primary">Controle de Estoque</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {branchLabel} • {products.length} produtos • {lowCount} estoque baixo • {outCount} sem estoque
        </p>
      </div>

      {(lowCount > 0 || outCount > 0) && (
        <div className="flex gap-3 flex-wrap">
          {lowCount > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-md text-sm">
              <AlertTriangle className="h-4 w-4" />
              {lowCount} produto(s) com estoque baixo
            </div>
          )}
          {outCount > 0 && (
            <div className="flex items-center gap-2 bg-destructive/10 text-destructive px-4 py-2 rounded-md text-sm">
              <AlertTriangle className="h-4 w-4" />
              {outCount} produto(s) sem estoque
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar produto..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="low">Estoque Baixo</SelectItem>
            <SelectItem value="out">Sem Estoque</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Produto</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Categoria</th>
                {selectedBranch === "todas" ? (
                  <>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Matriz</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Filial 1</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Total</th>
                  </>
                ) : (
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Atual</th>
                )}
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Mínimo</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const stock = getStock(p);
                const isLow = stock <= p.minStock && stock > 0;
                const isOut = stock === 0;
                return (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.brand}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{p.category}</td>
                    {selectedBranch === "todas" ? (
                      <>
                        <td className="px-4 py-3 text-center font-medium">{p.branchStock.matriz}</td>
                        <td className="px-4 py-3 text-center font-medium">{p.branchStock.filial1}</td>
                        <td className="px-4 py-3 text-center font-semibold text-primary">{p.stock}</td>
                      </>
                    ) : (
                      <td className="px-4 py-3 text-center font-medium">{stock}</td>
                    )}
                    <td className="px-4 py-3 text-center text-muted-foreground">{p.minStock}</td>
                    <td className="px-4 py-3 text-center">
                      {isOut ? (
                        <Badge variant="destructive" className="text-[10px]">Sem Estoque</Badge>
                      ) : isLow ? (
                        <Badge className="bg-amber-100 text-amber-700 text-[10px]">Baixo</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">Normal</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum produto encontrado.</p>
        </div>
      )}
    </div>
  );
};

export default Stock;
