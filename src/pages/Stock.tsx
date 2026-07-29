import { useState, useEffect } from "react";
import { useBranch } from "@/contexts/BranchContext";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, AlertTriangle, Package } from "lucide-react";
import { getEstoque } from "@/services/estoqueService";
import { getProdutos } from "@/services/produtosService";

const Stock = () => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [mostrarInativos, setMostrarInativos] = useState(false);
  const { filialSelecionada, rotuloFilial } = useBranch();
  
  const [produtosAPI, setProdutosAPI] = useState<any[]>([]);
  const [estoquesAPI, setEstoquesAPI] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setLoading(true);
    try {
      const [prod, est] = await Promise.all([getProdutos(), getEstoque()]);
      setProdutosAPI(Array.isArray(prod) ? prod : []);
      setEstoquesAPI(Array.isArray(est) ? est : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  // Função auxiliar para obter estoque do produto baseado na filial selecionada
  const obterEstoque = (codproduto: number) => {
    const estoquesDoProduto = estoquesAPI.filter(e => e.codproduto === codproduto);
    if (filialSelecionada === "todas") {
      return estoquesDoProduto.reduce((acc, curr) => acc + curr.quantidade, 0);
    }
    const estoqueFilial = estoquesDoProduto.find(e => String(e.codfilial) === String(filialSelecionada));
    return estoqueFilial ? estoqueFilial.quantidade : 0;
  };
  
  const obterEstoquePorFilial = (codproduto: number, codfilial: number) => {
    const estoque = estoquesAPI.find(e => e.codproduto === codproduto && e.codfilial === codfilial);
    return estoque ? estoque.quantidade : 0;
  };

  const listaFormatada = produtosAPI.map(p => ({
    ...p,
    estoqueAtual: obterEstoque(p.codproduto),
    estoqueMatriz: obterEstoquePorFilial(p.codproduto, 1),
    estoqueFilial1: obterEstoquePorFilial(p.codproduto, 2)
  }));

  const filtrados = listaFormatada.filter((p) => {
    if (!mostrarInativos && p.ativo !== "S") return false;
    
    const matchSearch = (p.descricao || "").toLowerCase().includes(search.toLowerCase());
    const estoque = p.estoqueAtual;
    const minimo = p.estoque_minimo || 0;
    if (filter === "low") return matchSearch && estoque <= minimo && estoque > 0;
    if (filter === "out") return matchSearch && estoque <= 0;
    return matchSearch;
  });

  const contagemBaixo = listaFormatada.filter((p) => {
    if (!mostrarInativos && p.ativo !== "S") return false;
    return p.estoqueAtual <= (p.estoque_minimo || 0) && p.estoqueAtual > 0;
  }).length;
  
  const contagemZerado = listaFormatada.filter((p) => {
    if (!mostrarInativos && p.ativo !== "S") return false;
    return p.estoqueAtual <= 0;
  }).length;

  const totalProdutosCount = listaFormatada.filter((p) => mostrarInativos ? true : p.ativo === "S").length;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h2 className="font-display text-2xl md:text-3xl font-semibold text-primary">Controle de Estoque</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {rotuloFilial} • {totalProdutosCount} produtos • {contagemBaixo} estoque baixo • {contagemZerado} sem estoque
        </p>
      </div>

      {(contagemBaixo > 0 || contagemZerado > 0) && (
        <div className="flex gap-3 flex-wrap">
          {contagemBaixo > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-md text-sm">
              <AlertTriangle className="h-4 w-4" />
              {contagemBaixo} produto(s) com estoque baixo
            </div>
          )}
          {contagemZerado > 0 && (
            <div className="flex items-center gap-2 bg-destructive/10 text-destructive px-4 py-2 rounded-md text-sm">
              <AlertTriangle className="h-4 w-4" />
              {contagemZerado} produto(s) sem estoque
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
        <button
          onClick={() => setMostrarInativos(!mostrarInativos)}
          className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors ${
            mostrarInativos 
              ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90" 
              : "bg-background text-foreground border-input hover:bg-accent hover:text-accent-foreground"
          }`}
        >
          {mostrarInativos ? "Ocultar Inativos" : "Todos os Produtos"}
        </button>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {/* VISÃO MOBILE */}
        <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
          {loading ? (
            <div className="text-center py-4 text-muted-foreground">Carregando estoque...</div>
          ) : filtrados.map((p) => {
            const estoque = p.estoqueAtual;
            const minimo = p.estoque_minimo || 0;
            const estaBaixo = estoque <= minimo && estoque > 0;
            const estaZerado = estoque === 0;
            const estaNegativo = estoque < 0;
            return (
              <div key={p.codproduto} className="bg-background rounded-lg border border-border p-4 shadow-sm flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-foreground">{p.descricao}</div>
                    <div className="text-xs text-muted-foreground">Cód: {p.codproduto} • {p.marca || "-"} • {p.mscategoria?.categoria || "-"}</div>
                  </div>
                  {estaNegativo ? (
                    <Badge className="bg-red-600 hover:bg-red-700 text-white font-bold text-[10px]">Negativo ({estoque})</Badge>
                  ) : estaZerado ? (
                    <Badge variant="destructive" className="text-[10px]">Sem Estoque</Badge>
                  ) : estaBaixo ? (
                    <Badge className="bg-amber-100 text-amber-700 text-[10px]">Baixo</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">Normal</Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t border-border mt-2">
                  {filialSelecionada === "todas" ? (
                    <>
                      <div>
                        <span className="text-xs text-muted-foreground block">Matriz</span>
                        <span className="font-medium">{p.estoqueMatriz}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Filial 1</span>
                        <span className="font-medium">{p.estoqueFilial1}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Total</span>
                        <span className="font-semibold text-primary">{estoque}</span>
                      </div>
                    </>
                  ) : (
                    <div>
                      <span className="text-xs text-muted-foreground block">Estoque Atual</span>
                      <span className="font-medium text-primary">{estoque}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-xs text-muted-foreground block">Estoque Mínimo</span>
                    <span className="font-medium text-muted-foreground">{minimo}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* VISÃO DESKTOP */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Produto</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Categoria</th>
                {filialSelecionada === "todas" ? (
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
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-muted-foreground">Carregando estoque...</td>
                </tr>
              ) : filtrados.map((p) => {
                const estoque = p.estoqueAtual;
                const minimo = p.estoque_minimo || 0;
                const estaBaixo = estoque <= minimo && estoque > 0;
                const estaZerado = estoque === 0;
                const estaNegativo = estoque < 0;
                return (
                  <tr key={p.codproduto} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{p.descricao}</div>
                      <div className="text-xs text-muted-foreground">Cód: {p.codproduto} • {p.marca || "-"}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{p.mscategoria?.categoria || "-"}</td>
                    {filialSelecionada === "todas" ? (
                      <>
                        <td className="px-4 py-3 text-center font-medium">{p.estoqueMatriz}</td>
                        <td className="px-4 py-3 text-center font-medium">{p.estoqueFilial1}</td>
                        <td className={`px-4 py-3 text-center font-semibold ${estaNegativo ? 'text-red-600' : 'text-primary'}`}>{estoque}</td>
                      </>
                    ) : (
                      <td className={`px-4 py-3 text-center font-medium ${estaNegativo ? 'text-red-600' : ''}`}>{estoque}</td>
                    )}
                    <td className="px-4 py-3 text-center text-muted-foreground">{minimo}</td>
                    <td className="px-4 py-3 text-center">
                      {estaNegativo ? (
                        <Badge className="bg-red-600 hover:bg-red-700 text-white font-bold text-[10px]">Negativo</Badge>
                      ) : estaZerado ? (
                        <Badge variant="destructive" className="text-[10px]">Sem Estoque</Badge>
                      ) : estaBaixo ? (
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

      {!loading && filtrados.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum produto encontrado no estoque.</p>
        </div>
      )}
    </div>
  );
};

export default Stock;
