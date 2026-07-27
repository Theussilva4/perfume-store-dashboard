import { useState, useEffect } from "react";

import { getProdutos, updateProduto, createProduto, alterarStatusProduto } from "@/services/produtosService";
import { getCategorias, updateCategoria, createCategoria } from "@/services/categoriaService";
import { Produto, categoria } from "@/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Pencil, Trash2, Package, TrendingUp, Percent, ScanBarcode } from "lucide-react";
import { toast } from "sonner";
import { BarcodeScannerModal } from "@/components/BarcodeScannerModal";

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
    precoCusto: Number(p.custo || p.preco_normal || 0),
    precoVenda: Number(p.preco_promocao || p.preco_normal || 0),
    estoque: Number(p.msestoque?.[0]?.quantidade || 0),
    estoqueMinimo: Number(p.estoque_minimo || 5),
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
  const [scannerOpen, setScannerOpen] = useState(false);
  const [mostrarInativos, setMostrarInativos] = useState(false);

  const filtrados = listaProdutos.filter((p) => {
    const matchSearch =
      p.descricao?.toLowerCase().includes(search.toLowerCase()) ||
      p.marca?.toLowerCase().includes(search.toLowerCase());
    const matchCat =
      filtroCategoria === "all" || p.codcategoria === Number(filtroCategoria);
    const matchAtivo = mostrarInativos || p.ativo;
    return matchSearch && matchCat && matchAtivo;
  });

  async function carregarCategorias() {
    try {
      const data = await getCategorias();
      setCategorias(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setCategorias([]);
    }
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
      const lista = Array.isArray(data) ? data : [];
      setListaProdutos(lista.map(mapearProduto));
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
        estoque_minimo: form.estoqueMinimo,
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

  const atualizarStatusAtivo = async (produto: Produto, isAtivo: boolean) => {
    try {
      await alterarStatusProduto(produto.codproduto, isAtivo ? "S" : "N");
      setListaProdutos((prev) =>
        prev.map((p) =>
          p.codproduto === produto.codproduto ? { ...p, ativo: isAtivo } : p
        )
      );
      toast.success(isAtivo ? "Produto ativado com sucesso!" : "Produto inativado com sucesso!");
    } catch (error) {
      toast.error("Erro ao alterar status do produto");
    }
  };

  const handleRemover = (produto: Produto) => {
    if (window.confirm("Deseja inativar este produto? Ele não será excluído definitivamente.")) {
      atualizarStatusAtivo(produto, false);
    }
  };

  const alternarAtivo = (produto: Produto) => {
    atualizarStatusAtivo(produto, !produto.ativo);
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
        <Button 
          variant="outline" 
          onClick={() => setMostrarInativos(!mostrarInativos)}
          className={`w-full sm:w-auto ${mostrarInativos ? "bg-muted" : ""}`}
        >
          {mostrarInativos ? "Ocultar Inativos" : "Mostrar Inativos"}
        </Button>
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
                  <button onClick={() => handleRemover(produto)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
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

              <div className="flex items-end justify-between mt-auto pt-2 border-t border-border">
                <div className="text-left">
                  <p className="text-[10px] text-muted-foreground mt-2">Preços no menu Comercial</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{produto.estoque}</p>
                  <p className="text-[10px] text-muted-foreground">em estoque</p>
                </div>
              </div>

              <button
                onClick={() => alternarAtivo(produto)}
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
        <DialogContent 
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => {
            e.preventDefault();
            if (window.confirm("Você tem um formulário em andamento. Deseja realmente fechar sem salvar?")) {
              setDialogOpen(false);
            }
          }}
          onEscapeKeyDown={(e) => {
            e.preventDefault();
            if (window.confirm("Você tem um formulário em andamento. Deseja realmente fechar sem salvar?")) {
              setDialogOpen(false);
            }
          }}
        >
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editandoProduto ? "Editar Produto" : "Novo Produto"}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do produto e precificação.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            <Tabs defaultValue="geral" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="geral">Geral</TabsTrigger>
                <TabsTrigger value="estoque">Estoque</TabsTrigger>
              </TabsList>
              
              <TabsContent value="geral" className="space-y-4 mt-4">
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
                    <div className="flex gap-2">
                      <Input value={form.codigoBarras || ""} onChange={(e) => setForm({ ...form, codigoBarras: e.target.value })} placeholder="EAN" />
                      <Button type="button" variant="outline" className="px-3" onClick={() => setScannerOpen(true)} title="Ler Código de Barras">
                        <ScanBarcode className="h-4 w-4" />
                      </Button>
                    </div>
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
              </TabsContent>



              <TabsContent value="estoque" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Estoque Atual (Exibição)</Label>
                    <Input type="number" value={form.estoque} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Estoque Mínimo</Label>
                    <Input type="number" value={form.estoqueMinimo} onChange={(e) => setForm({ ...form, estoqueMinimo: Number(e.target.value) })} />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSalvar}>{editandoProduto ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <BarcodeScannerModal 
        open={scannerOpen} 
        onOpenChange={setScannerOpen} 
        onScan={(text) => {
          setForm({ ...form, codigoBarras: text });
          toast.success("Código lido com sucesso!");
        }} 
      />
    </div>
  );
};

export default Products;
