import { useState, useEffect } from "react";

import { getProdutos, updateProduto, createProduto } from "@/services/produtosService";
import { getCategorias, updateCategoria, createCategoria } from "@/services/categoriaService";
import { Produto, categoria } from "@/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Pencil, Trash2, Package, TrendingUp, Percent } from "lucide-react";
import { toast } from "sonner";

const produtoVazio: Omit<Produto, "codproduto"> = {
  descricao: "", codcategoria: 0, resumo: "", marca: "",
  precoCusto: 0, precoVenda: 0, estoque: 0,
  estoquePorFilial: { matriz: 0, filial1: 0 },
  estoqueMinimo: 5,
  ativo: true,
  codigoBarras: "",
  volume: undefined,
  margem: undefined,
  precoPromocional: undefined,
};

function mapearProduto(p: any): Produto {
  return {
    codproduto: p.codproduto,
    descricao: p.descricao,
    resumo: p.resumo || "",
    marca: p.marca || "",
    codcategoria: Number(p.codcategoria),
    precoCusto: Number(p.preco_normal || 0),
    precoVenda: Number(p.preco_promocao || p.preco_normal || 0),
    estoque: Number(p.msestoque?.[0]?.quantidade || 0),
    estoqueMinimo: 5,
    estoquePorFilial: { matriz: 1, filial1: 5 },
    ativo: p.ativo === "S",
    codigoBarras: p.codigo_barras ? String(p.codigo_barras) : "",
    volume: p.volume_ml ? Number(p.volume_ml) : undefined,
    margem: undefined,
    precoPromocional: p.preco_promocao ? Number(p.preco_promocao) : undefined,
  };
}

const Products = () => {
  const [listaProdutos, setListaProdutos] = useState<Produto[]>([]);
  const [search, setSearch] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editandoProduto, setEditandoProduto] = useState<Produto | null>(null);
  const [form, setForm] = useState<Omit<Produto, "codproduto">>(produtoVazio);
  const [categorias, setCategorias] = useState<categoria[]>([]);

  const filtrados = listaProdutos.filter((p) => {
    const matchSearch =
      p.descricao?.toLowerCase().includes(search.toLowerCase()) ||
      p.marca?.toLowerCase().includes(search.toLowerCase());
    const matchCat =
      filtroCategoria === "all" || p.codcategoria === Number(filtroCategoria);
    return matchSearch && matchCat;
  });

  async function carregarCategorias() {
    const data = await getCategorias();
    setCategorias(data);
  }

  useEffect(() => {
    async function init() {
      await Promise.all([carregarProdutos(), carregarCategorias()]);
    }
    init();
  }, []);

  async function carregarProdutos() {
    try {
      const data = await getProdutos();
      setListaProdutos(data.map(mapearProduto));
    } catch (error) {
      console.error(error);
      toast.error("Erro ao buscar produtos");
    }
  }

  const abrirNovo = () => {
    setEditandoProduto(null);
    setForm(produtoVazio);
    setDialogOpen(true);
  };

  const abrirEdicao = (p: Produto) => {
    setEditandoProduto(p);
    setForm({ ...p });
    setDialogOpen(true);
  };

  // Cálculos de precificação
  const margem = form.precoCusto > 0 ? ((form.precoVenda - form.precoCusto) / form.precoCusto) * 100 : 0;
  const markup = form.precoCusto > 0 ? form.precoVenda / form.precoCusto : 0;
  const lucroUnitario = form.precoVenda - form.precoCusto;

  const handleSalvar = async () => {
    try {
      const corpoRequisicao = {
        descricao: form.descricao,
        marca: form.marca,
        codcategoria: form.codcategoria,
        resumo: form.resumo,
        preco_normal: form.precoCusto,
        preco_promocao: form.precoVenda,
        ativo: form.ativo ? "S" : "N",
        codigo_barras: form.codigoBarras || null,
        volume_ml: form.volume || null,
      };

      if (editandoProduto) {
        await updateProduto(editandoProduto.codproduto, corpoRequisicao);
        toast.success("Produto atualizado!");
      } else {
        await createProduto(corpoRequisicao);
        toast.success("Produto criado!");
      }

      await carregarProdutos();
      setDialogOpen(false);
      setEditandoProduto(null);
    } catch (error) {
      toast.error("Erro ao salvar produto");
    }
  };

  const handleRemover = (codproduto: number) => {
    setListaProdutos((prev) => prev.filter((p) => p.codproduto !== codproduto));
    toast.success("Produto removido!");
  };

  const alternarAtivo = (codproduto: number) => {
    setListaProdutos((prev) =>
      prev.map((p) =>
        p.codproduto === codproduto ? { ...p, ativo: !p.ativo } : p
      )
    );
  };

  // Pré-preencher margem com a da categoria
  const handleCategoriaChange = (codcategoria: number) => {
    const cat = categorias.find((c) => c.codcategoria === codcategoria);
    const margemCat = (cat as any)?.margemPadrao ?? 50;
    const novoPrecoVenda = form.precoCusto > 0 ? form.precoCusto * (1 + margemCat / 100) : form.precoVenda;
    setForm({ ...form, codcategoria, margem: margemCat, precoVenda: Number(novoPrecoVenda.toFixed(2)) });
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl md:text-3xl font-semibold text-primary">Produtos</h2>
          <p className="text-sm text-muted-foreground mt-1">{listaProdutos.length} produtos cadastrados</p>
        </div>
        <Button onClick={abrirNovo}>
          <Plus className="h-4 w-4 mr-2" /> Novo Produto
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por descrição ou marca..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {categorias.map((c) => (
              <SelectItem key={c.codcategoria} value={String(c.codcategoria)}>
                {c.categoria}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtrados.map((produto) => {
          const categoriaEncontrada = categorias.find(
            (c) => c.codcategoria === Number(produto.codcategoria)
          );
          const pMargem = produto.precoCusto > 0 ? ((produto.precoVenda - produto.precoCusto) / produto.precoCusto) * 100 : 0;
          const pMarkup = produto.precoCusto > 0 ? produto.precoVenda / produto.precoCusto : 0;
          const pLucro = produto.precoVenda - produto.precoCusto;

          return (
            <div
              key={produto.codproduto}
              className={`bg-card rounded-lg border border-border p-5 flex flex-col gap-3 transition-opacity ${!produto.ativo ? "opacity-50" : ""}`}
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div className="flex gap-1">
                  <button onClick={() => abrirEdicao(produto)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleRemover(produto.codproduto)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-sm text-foreground">{produto.descricao}</h3>
                <p className="text-xs text-muted-foreground">Código: {produto.codproduto}</p>
                <p className="text-xs text-muted-foreground">Marca: {produto.marca}</p>
                <p className="text-xs text-muted-foreground">Categoria: {categoriaEncontrada?.categoria || "Sem Categoria"}</p>
                {produto.volume && <p className="text-xs text-muted-foreground">Volume: {produto.volume}ml</p>}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="text-[10px]">{produto.codcategoria}</Badge>
                {produto.estoque <= produto.estoqueMinimo && (
                  <Badge variant="destructive" className="text-[10px]">Estoque Baixo</Badge>
                )}
              </div>

              {/* Precificação */}
              <div className="bg-muted/30 rounded-md p-2 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1"><Percent className="h-3 w-3" /> Margem</span>
                  <span className={`font-medium ${pMargem >= 50 ? "text-primary" : "text-amber-600"}`}>{pMargem.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Markup</span>
                  <span className="font-medium text-foreground">{pMarkup.toFixed(2)}x</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Lucro</span>
                  <span className="font-medium text-primary">R$ {pLucro.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="flex items-end justify-between mt-auto pt-2 border-t border-border">
                <div>
                  <p className="text-lg font-semibold text-foreground">
                    R$ {produto.precoVenda.toLocaleString("pt-BR")}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Custo: R$ {produto.precoCusto.toLocaleString("pt-BR")}
                  </p>
                  {produto.precoPromocional != null && produto.precoPromocional > 0 && (
                    <p className="text-[10px] text-primary">
                      Promo: R$ {produto.precoPromocional.toLocaleString("pt-BR")}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{produto.estoque}</p>
                  <p className="text-[10px] text-muted-foreground">em estoque</p>
                </div>
              </div>

              <button
                onClick={() => alternarAtivo(produto.codproduto)}
                className={`text-xs py-1 rounded-md border transition-colors ${produto.ativo
                  ? "border-primary/20 text-primary hover:bg-primary/5"
                  : "border-destructive/20 text-destructive hover:bg-destructive/5"
                }`}
              >
                {produto.ativo ? "Ativo" : "Inativo"}
              </button>
            </div>
          );
        })}
      </div>

      {filtrados.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum produto encontrado.</p>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editandoProduto ? "Editar Produto" : "Novo Produto"}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do produto e precificação.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            {/* Dados básicos */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Nome</Label>
                <Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Marca</Label>
                <Input value={form.marca} onChange={(e) => setForm({ ...form, marca: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={String(form.codcategoria)}
                  onValueChange={(v) => handleCategoriaChange(Number(v))}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {categorias.map((c) => (
                      <SelectItem key={c.codcategoria} value={String(c.codcategoria)}>
                        {c.categoria}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Código de Barras</Label>
                <Input value={form.codigoBarras || ""} onChange={(e) => setForm({ ...form, codigoBarras: e.target.value })} placeholder="EAN" />
              </div>
              <div className="space-y-2">
                <Label>Volume (ml)</Label>
                <Input type="number" value={form.volume || ""} onChange={(e) => setForm({ ...form, volume: e.target.value ? Number(e.target.value) : undefined })} placeholder="Ex: 100" />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Descrição</Label>
                <Textarea value={form.resumo} onChange={(e) => setForm({ ...form, resumo: e.target.value })} rows={2} />
              </div>
            </div>

            {/* Precificação */}
            <div className="border-t border-border pt-4">
              <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Precificação
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Preço de Custo (R$)</Label>
                  <Input type="number" value={form.precoCusto} onChange={(e) => setForm({ ...form, precoCusto: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>Preço de Venda (R$)</Label>
                  <Input type="number" value={form.precoVenda} onChange={(e) => setForm({ ...form, precoVenda: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>Preço Promocional (R$)</Label>
                  <Input type="number" value={form.precoPromocional || ""} onChange={(e) => setForm({ ...form, precoPromocional: e.target.value ? Number(e.target.value) : undefined })} placeholder="Opcional" />
                </div>
              </div>

              {/* Métricas calculadas */}
              {form.precoCusto > 0 && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mt-3 grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Margem</p>
                    <p className={`text-lg font-bold ${margem >= 50 ? "text-primary" : "text-amber-600"}`}>{margem.toFixed(1)}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Markup</p>
                    <p className="text-lg font-bold text-foreground">{markup.toFixed(2)}x</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Lucro Unit.</p>
                    <p className="text-lg font-bold text-primary">R$ {lucroUnitario.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Estoque */}
            <div className="border-t border-border pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Estoque Atual</Label>
                  <Input type="number" value={form.estoque} onChange={(e) => setForm({ ...form, estoque: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>Estoque Mínimo</Label>
                  <Input type="number" value={form.estoqueMinimo} onChange={(e) => setForm({ ...form, estoqueMinimo: Number(e.target.value) })} />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSalvar}>{editandoProduto ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Products;
