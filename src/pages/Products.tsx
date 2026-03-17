import { useState } from "react";
import { produtos as produtosIniciais, categorias, Produto } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Pencil, Trash2, Package } from "lucide-react";
import { toast } from "sonner";

const produtoVazio: Omit<Produto, "id"> = {
  nome: "", categoria: "", descricao: "", marca: "",
  precoCusto: 0, precoVenda: 0, estoque: 0, estoquePorFilial: { matriz: 0, filial1: 0 }, estoqueMinimo: 5,
  ativo: true,
};

const Products = () => {
  const [listaProdutos, setListaProdutos] = useState<Produto[]>(produtosIniciais);
  const [search, setSearch] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editandoProduto, setEditandoProduto] = useState<Produto | null>(null);
  const [form, setForm] = useState<Omit<Produto, "id">>(produtoVazio);

  const filtrados = listaProdutos.filter((p) => {
    const matchSearch = p.nome.toLowerCase().includes(search.toLowerCase()) ||
      p.marca.toLowerCase().includes(search.toLowerCase());
    const matchCat = filtroCategoria === "all" || p.categoria === filtroCategoria;
    return matchSearch && matchCat;
  });

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

  const handleSalvar = () => {
    if (!form.nome || !form.categoria) {
      toast.error("Preencha nome e categoria.");
      return;
    }
    if (editandoProduto) {
      setListaProdutos((prev) =>
        prev.map((p) => (p.id === editandoProduto.id ? { ...form, id: editandoProduto.id } : p))
      );
      toast.success("Produto atualizado!");
    } else {
      const novoProduto: Produto = { ...form, id: String(Date.now()) };
      setListaProdutos((prev) => [...prev, novoProduto]);
      toast.success("Produto criado!");
    }
    setDialogOpen(false);
  };

  const handleRemover = (id: string) => {
    setListaProdutos((prev) => prev.filter((p) => p.id !== id));
    toast.success("Produto removido!");
  };

  const alternarAtivo = (id: string) => {
    setListaProdutos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ativo: !p.ativo } : p))
    );
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
          <Input placeholder="Buscar por nome ou marca..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {categorias.map((c) => (
              <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtrados.map((produto) => (
          <div
            key={produto.id}
            className={`bg-card rounded-lg border border-border p-5 flex flex-col gap-3 transition-opacity ${
              !produto.ativo ? "opacity-50" : ""
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div className="flex gap-1">
                <button onClick={() => abrirEdicao(produto)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => handleRemover(produto.id)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-sm text-foreground">{produto.nome}</h3>
              <p className="text-xs text-muted-foreground">{produto.marca}</p>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px]">{produto.categoria}</Badge>
              {produto.estoque <= produto.estoqueMinimo && (
                <Badge variant="destructive" className="text-[10px]">Estoque Baixo</Badge>
              )}
            </div>

            <div className="flex items-end justify-between mt-auto pt-2 border-t border-border">
              <div>
                <p className="text-lg font-semibold text-foreground">
                  R$ {produto.precoVenda.toLocaleString("pt-BR")}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Custo: R$ {produto.precoCusto.toLocaleString("pt-BR")}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">{produto.estoque}</p>
                <p className="text-[10px] text-muted-foreground">em estoque</p>
              </div>
            </div>

            <button
              onClick={() => alternarAtivo(produto.id)}
              className={`text-xs py-1 rounded-md border transition-colors ${
                produto.ativo
                  ? "border-primary/20 text-primary hover:bg-primary/5"
                  : "border-destructive/20 text-destructive hover:bg-destructive/5"
              }`}
            >
              {produto.ativo ? "Ativo" : "Inativo"}
            </button>
          </div>
        ))}
      </div>

      {filtrados.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum produto encontrado.</p>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editandoProduto ? "Editar Produto" : "Novo Produto"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Nome</Label>
                <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Marca</Label>
                <Input value={form.marca} onChange={(e) => setForm({ ...form, marca: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {categorias.map((c) => (
                      <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Descrição</Label>
                <Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} rows={2} />
              </div>
              <div className="space-y-2">
                <Label>Preço de Custo (R$)</Label>
                <Input type="number" value={form.precoCusto} onChange={(e) => setForm({ ...form, precoCusto: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Preço de Venda (R$)</Label>
                <Input type="number" value={form.precoVenda} onChange={(e) => setForm({ ...form, precoVenda: Number(e.target.value) })} />
              </div>
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
