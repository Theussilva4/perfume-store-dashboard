import { useState, useEffect } from "react";

import { getProdutos, updateProduto, createProduto, alterarStatusProduto } from "@/services/produtosService";
import { getCategorias, updateCategoria, createCategoria } from "@/services/categoriaService";
import { getFornecedores } from "@/services/fornecedorService";
import { Produto, categoria } from "@/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Pencil, Trash2, Package, TrendingUp, Percent, ScanBarcode, ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { BarcodeScannerModal } from "@/components/BarcodeScannerModal";

const produtoVazio: Omit<Produto, "codproduto"> = {
  descricao: "", codcategoria: 0, codfornecedor: undefined, resumo: "", marca: "",
  precoCusto: 0, precoVenda: 0, estoque: 0,
  estoquePorFilial: { matriz: 0, filial1: 0 },
  estoqueMinimo: 5,
  ativo: true,
  codigoBarras: "",
  volume: undefined,
  margem: undefined,
  precoPromocional: undefined,
  imagemUrl: undefined,
  imagemPublicId: undefined,
};

function mapearProduto(p: any): Produto {
  return {
    codproduto: p.codproduto,
    descricao: p.descricao,
    resumo: p.resumo || "",
    marca: p.marca || "",
    codcategoria: Number(p.codcategoria),
    codfornecedor: p.codfornecedor ? Number(p.codfornecedor) : undefined,
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
    imagemUrl: p.imagem_url || undefined,
    imagemPublicId: p.imagem_public_id || undefined,
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
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [mostrarInativos, setMostrarInativos] = useState(false);

  const [imagemFile, setImagemFile] = useState<File | null>(null);
  const [imagemPreview, setImagemPreview] = useState<string | null>(null);
  const [removerImagem, setRemoverImagem] = useState(false);

  const askProductSupplier = localStorage.getItem("askProductSupplier") !== "false";

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

  async function carregarFornecedores() {
    try {
      const data = await getFornecedores();
      setFornecedores(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setFornecedores([]);
    }
  }

  useEffect(() => {
    async function init() {
      const promises = [carregarProdutos(), carregarCategorias()];
      if (askProductSupplier) promises.push(carregarFornecedores());
      await Promise.all(promises);
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
    setImagemFile(null);
    setImagemPreview(null);
    setRemoverImagem(false);
    setDialogOpen(true);
  };

  const abrirEdicao = (p: Produto) => {
    setEditandoProduto(p);
    setForm({ ...p });
    setImagemFile(null);
    setImagemPreview(p.imagemUrl || null);
    setRemoverImagem(false);
    setDialogOpen(true);
  };

  // Cálculos de precificação
  const margem = form.precoCusto > 0 ? ((form.precoVenda - form.precoCusto) / form.precoCusto) * 100 : 0;
  const markup = form.precoCusto > 0 ? form.precoVenda / form.precoCusto : 0;
  const lucroUnitario = form.precoVenda - form.precoCusto;

  const handleSalvar = async () => {
    try {
      const formData = new FormData();
      formData.append("descricao", form.descricao);
      if (form.marca) formData.append("marca", form.marca);
      formData.append("codcategoria", String(form.codcategoria));
      if (form.resumo) formData.append("resumo", form.resumo);
      if (form.estoqueMinimo !== undefined) formData.append("estoque_minimo", String(form.estoqueMinimo));
      if (form.codfornecedor) formData.append("codfornecedor", String(form.codfornecedor));
      formData.append("ativo", form.ativo ? "S" : "N");
      if (form.codigoBarras) formData.append("codigo_barras", form.codigoBarras);
      if (form.volume) formData.append("volume_ml", String(form.volume));
      
      if (imagemFile) {
        formData.append("imagem", imagemFile);
      }
      if (removerImagem) {
        formData.append("remover_imagem", "true");
      }

      if (editandoProduto) {
        await updateProduto(editandoProduto.codproduto, formData);
        toast.success("Produto atualizado!");
      } else {
        await createProduto(formData);
        toast.success("Produto criado!");
      }

      await carregarProdutos();
      setDialogOpen(false);
      setEditandoProduto(null);
    } catch (error: any) {
      toast.error(error.response?.data?.erro || "Erro ao salvar produto");
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

      {/* VISÃO MOBILE (CARDS) */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {filtrados.map((produto) => {
          const categoriaEncontrada = categorias.find(
            (c) => c.codcategoria === Number(produto.codcategoria)
          );

          return (
            <div
              key={produto.codproduto}
              className={`bg-card rounded-lg border border-border p-5 flex flex-col gap-3 transition-opacity ${!produto.ativo ? "opacity-50" : ""}`}
            >
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-md bg-muted/50 overflow-hidden flex items-center justify-center border border-border">
                  {produto.imagemUrl ? (
                    <img 
                      src={produto.imagemUrl.replace('/upload/', '/upload/w_100,h_100,c_fill/')} 
                      alt={produto.descricao}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="h-6 w-6 text-muted-foreground/50" />
                  )}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => abrirEdicao(produto)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleRemover(produto)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="h-4 w-4" />
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

      {/* VISÃO DESKTOP (TABELA) */}
      <div className="hidden md:block bg-card rounded-lg border border-border overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Código</th>
              <th className="px-4 py-3 font-medium">Produto</th>
              <th className="px-4 py-3 font-medium">Marca</th>
              <th className="px-4 py-3 font-medium">Categoria</th>
              <th className="px-4 py-3 font-medium text-right">Estoque</th>
              <th className="px-4 py-3 font-medium text-center">Status</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtrados.map((produto) => {
              const categoriaEncontrada = categorias.find(
                (c) => c.codcategoria === Number(produto.codcategoria)
              );
              return (
                <tr key={produto.codproduto} className={`hover:bg-muted/30 transition-colors ${!produto.ativo ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-3 text-muted-foreground">{produto.codproduto}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-muted/50 overflow-hidden flex-shrink-0 flex items-center justify-center border border-border">
                        {produto.imagemUrl ? (
                          <img 
                            src={produto.imagemUrl.replace('/upload/', '/upload/w_80,h_80,c_fill/')} 
                            alt={produto.descricao}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="h-5 w-5 text-muted-foreground/50" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{produto.descricao}</div>
                        {produto.volume && <div className="text-xs text-muted-foreground">{produto.volume}ml</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{produto.marca || "-"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{categoriaEncontrada?.categoria || "Sem Categoria"}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-medium">{produto.estoque}</span>
                    {produto.estoque <= produto.estoqueMinimo && (
                      <Badge variant="destructive" className="ml-2 text-[10px]">Baixo</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => alternarAtivo(produto)}
                      className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${produto.ativo
                        ? "border-primary/20 text-primary hover:bg-primary/5"
                        : "border-destructive/20 text-destructive hover:bg-destructive/5"
                      }`}
                    >
                      {produto.ativo ? "Ativo" : "Inativo"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => abrirEdicao(produto)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Editar">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleRemover(produto)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Inativar">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
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
                  {/* Foto do Produto */}
                  <div className="col-span-2 flex items-center gap-4 p-4 border rounded-lg bg-muted/20">
                    <div className="w-20 h-20 rounded-md bg-muted flex items-center justify-center overflow-hidden border border-border relative group">
                      {imagemPreview ? (
                        <>
                          <img src={imagemPreview} alt="Preview" className="w-full h-full object-cover" />
                          <button 
                            type="button" 
                            className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => {
                              setImagemFile(null);
                              setImagemPreview(null);
                              setRemoverImagem(true);
                            }}
                          >
                            <X className="h-6 w-6" />
                          </button>
                        </>
                      ) : (
                        <Package className="h-8 w-8 text-muted-foreground/50" />
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="cursor-pointer">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium">
                          <ImagePlus className="h-4 w-4" />
                          {imagemPreview ? "Trocar Foto" : "Adicionar Foto"}
                        </div>
                        <input 
                          type="file" 
                          accept="image/jpeg,image/png,image/webp" 
                          className="hidden" 
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              const file = e.target.files[0];
                              if (file.size > 5 * 1024 * 1024) {
                                toast.error("A imagem deve ter no máximo 5MB");
                                return;
                              }
                              setImagemFile(file);
                              setImagemPreview(URL.createObjectURL(file));
                              setRemoverImagem(false);
                            }
                          }}
                        />
                      </Label>
                      <span className="text-xs text-muted-foreground">Recomendado: 1:1 (Quadrada). Máx: 5MB.</span>
                    </div>
                  </div>

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
                  {askProductSupplier && (
                    <div className="space-y-2">
                      <Label>Fornecedor (Opcional)</Label>
                      <Select
                        value={form.codfornecedor ? String(form.codfornecedor) : "0"}
                        onValueChange={(v) => setForm({ ...form, codfornecedor: v === "0" ? undefined : Number(v) })}
                      >
                        <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Nenhum</SelectItem>
                          {fornecedores.map((f) => (
                            <SelectItem key={f.codfornecedor || f.uuid} value={String(f.codfornecedor)}>
                              {f.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
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
