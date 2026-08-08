import { useState, useEffect, useRef } from "react";
import { ShoppingCart, Plus, Search, Eye, ClipboardList, Trash2, Camera, RefreshCw } from "lucide-react";
import { getCompras, createCompra, getCompraById, cancelarCompra } from "@/services/compraService";
import { getFornecedores } from "@/services/fornecedorService";
import { getProdutos } from "@/services/produtosService";
import { getFilial } from "@/services/filialService";
import { getEstoque, createEntrada } from "@/services/estoqueService";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBranch } from "@/contexts/BranchContext";
import { BarcodeScannerModal } from "@/components/BarcodeScannerModal";

const Purchases = () => {
  const [listaCompras, setListaCompras] = useState<any[]>([]);
  const [listaFornecedores, setListaFornecedores] = useState<any[]>([]);
  const [listaProdutos, setListaProdutos] = useState<any[]>([]);
  const [listaFiliais, setListaFiliais] = useState<any[]>([]);
  const [listaEstoques, setListaEstoques] = useState<any[]>([]);
  
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogDetalhesOpen, setDialogDetalhesOpen] = useState(false);
  const [dialogCancelarOpen, setDialogCancelarOpen] = useState(false);
  const [motivoCancelamento, setMotivoCancelamento] = useState("");
  const [compraSelecionada, setCompraSelecionada] = useState<any | null>(null);
  const { filialSelecionada, rotuloFilial } = useBranch();
  
  // States para nova compra
  const [tipoEntrada, setTipoEntrada] = useState<"COMPRA" | "AJUSTE">("COMPRA");
  const [fornecedorBusca, setFornecedorBusca] = useState("");
  const [fornecedorUuid, setFornecedorUuid] = useState("");
  const [fornecedorCod, setFornecedorCod] = useState("");
  const [fornecedorNome, setFornecedorNome] = useState("");
  const [dialogFornecedorOpen, setDialogFornecedorOpen] = useState(false);
  
  const [filialDestino, setFilialDestino] = useState("");
  const [statusCompra, setStatusCompra] = useState("CONCLUIDA");
  
  const [produtoBusca, setProdutoBusca] = useState("");
  const [produtoSelecionadoId, setProdutoSelecionadoId] = useState("");
  const [qtdSelecionada, setQtdSelecionada] = useState(1);
  const [custoSelecionado, setCustoSelecionado] = useState(0);
  const [dialogProdutoOpen, setDialogProdutoOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  
  const [itensCompra, setItensCompra] = useState<any[]>([]);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setLoading(true);
    try {
      const [comprasAPI, fornecedoresAPI, produtosAPI, filiaisAPI, estoquesAPI] = await Promise.all([
        getCompras(),
        getFornecedores(),
        getProdutos(),
        getFilial(),
        getEstoque()
      ]);
      setListaCompras(Array.isArray(comprasAPI) ? comprasAPI : []);
      setListaFornecedores(Array.isArray(fornecedoresAPI) ? fornecedoresAPI : []);
      setListaProdutos(Array.isArray(produtosAPI) ? produtosAPI : []);
      setListaFiliais(Array.isArray(filiaisAPI) ? filiaisAPI : []);
      setListaEstoques(Array.isArray(estoquesAPI) ? estoquesAPI : []);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }

  async function recarregarProdutos() {
    try {
      toast.info("Atualizando produtos...", { duration: 1500 });
      const [produtosRaw, estRaw] = await Promise.all([getProdutos(), getEstoque()]);
      const safeEstoque = Array.isArray(estRaw) ? estRaw : [];
      const prodsList = Array.isArray(produtosRaw) ? produtosRaw.map((p: any) => ({
        ...p,
        precoVenda: p.preco_normal || p.custo,
        estoque: safeEstoque.filter((e: any) => String(e.codproduto) === String(p.codproduto)).reduce((acc: number, item: any) => acc + Number(item.quantidade), 0)
      })) : [];
      setListaProdutos(prodsList);
      toast.success("Produtos atualizados!");
    } catch (e) {
      toast.error("Erro ao recarregar produtos");
    }
  }

  const limpar = (v: string) => v.replace(/\D/g, "");

  const comprasFiltradas = listaCompras.filter(c => {
    // filtro de filial
    const matchFilial = filialSelecionada === "todas" || 
      String(c.codfilial) === String(filialSelecionada) ||
      String(c.msfilial?.codfilial) === String(filialSelecionada);
      
    // filtro de texto
    const fornecedor = (c.msfornecedor?.nome || "").toLowerCase();
    const termo = search.toLowerCase();
    const matchSearch = fornecedor.includes(termo) || String(c.codigo_compra || "").includes(termo);
    
    return matchFilial && matchSearch;
  });

  const adicionarItem = () => {
    const produto = listaProdutos.find(p => String(p.codproduto) === produtoSelecionadoId);
    if (!produto) return;
    
    const existente = itensCompra.find(i => i.codproduto === String(produto.codproduto));
    if (existente) {
      setItensCompra(prev => prev.map(i => 
        i.codproduto === String(produto.codproduto) 
          ? { ...i, quantidade: i.quantidade + qtdSelecionada, custo_unitario: custoSelecionado } 
          : i
      ));
    } else {
      setItensCompra(prev => [...prev, {
        codproduto: String(produto.codproduto),
        nomeProduto: produto.descricao,
        quantidade: qtdSelecionada,
        custo_unitario: custoSelecionado
      }]);
    }
    
    setProdutoBusca("");
    setProdutoSelecionadoId("");
    setQtdSelecionada(1);
    setCustoSelecionado(0);
  };

  const removerItem = (id: string) => {
    setItensCompra(prev => prev.filter(i => i.codproduto !== id));
  };

  const handleScanProduto = (decodedText: string) => {
    setProdutoBusca(decodedText);
    toast.success("Código lido: " + decodedText);
  };

  const handleSalvarCompra = async () => {
    if (tipoEntrada === "COMPRA" && !fornecedorUuid) return toast.error("Selecione um fornecedor");
    if (!filialDestino || filialDestino === "todas") return toast.error("Selecione uma filial de destino");
    if (itensCompra.length === 0) return toast.error("Adicione itens");
    
    setIsSubmitting(true);
    try {
      if (tipoEntrada === "COMPRA") {
        const payload = {
          codfornecedor: parseInt(fornecedorCod),
          codfilial: parseInt(filialDestino),
          status: statusCompra,
          itens: itensCompra.map(i => ({
            codproduto: parseInt(i.codproduto),
            quantidade: Number(i.quantidade),
            custo_unitario: Number(i.custo_unitario)
          }))
        };
        await createCompra(payload);
        toast.success("Compra registrada com sucesso!");
      } else {
        for (const item of itensCompra) {
          await createEntrada({
            codproduto: parseInt(item.codproduto),
            codfilial: parseInt(filialDestino),
            quantidade: Number(item.quantidade),
            origem: "AJUSTE"
          });
        }
        toast.success("Ajuste de estoque registrado com sucesso!");
      }
      
      // Limpar form
      setFornecedorUuid("");
      setFornecedorCod("");
      setFornecedorNome("");
      setFilialDestino("");
      setItensCompra([]);
      setDialogOpen(false);
      carregarDados();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao registrar compra");
    } finally {
      setIsSubmitting(false);
    }
  };

  const abrirDetalhes = async (compra: any) => {
    try {
      const detalhes = await getCompraById(compra.uuid);
      setCompraSelecionada(detalhes);
      setDialogDetalhesOpen(true);
    } catch (error) {
      toast.error("Erro ao buscar detalhes da compra");
    }
  };

  const handleCancelarCompra = async () => {
    if (motivoCancelamento.trim().length < 15) {
      return toast.error("O motivo do cancelamento deve ter pelo menos 15 caracteres.");
    }

    setIsSubmitting(true);
    try {
      await cancelarCompra(compraSelecionada.uuid, motivoCancelamento);
      toast.success("Compra cancelada e estoque estornado com sucesso!");
      setDialogCancelarOpen(false);
      setMotivoCancelamento("");
      setDialogDetalhesOpen(false);
      carregarDados();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.error || "Erro ao cancelar a compra");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl md:text-3xl font-semibold text-primary">Compras e Entrada</h2>
          <p className="text-sm text-muted-foreground mt-1">{rotuloFilial} • {comprasFiltradas.length} compras</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Nova Compra
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por fornecedor ou código..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="pl-10" 
          />
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {/* VISUALIZAÇÃO MOBILE (CARDS) */}
        <div className="grid grid-cols-1 gap-4 md:hidden p-4 bg-transparent">
          {comprasFiltradas.map((compra, i) => (
            <div key={compra.uuid || `compra-m-${i}`} className="bg-background border border-border rounded-lg p-4 space-y-3 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-foreground text-sm">Código #{compra.codigo_compra}</h4>
                  <p className="text-base font-medium text-foreground mt-1">{compra.msfornecedor?.nome || 'N/A'}</p>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground mt-1">📅 {new Date(compra.created_at || compra.data_compra).toLocaleDateString("pt-BR")}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-primary">R$ {Number(compra.valor_total || 0).toLocaleString("pt-BR")}</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <Badge variant="outline" className={
                  compra.status === 'FINALIZADA' || compra.status === 'CONCLUIDA' ? 'text-green-600 border-green-600 bg-green-50' : 
                  compra.status === 'CANCELADA' ? 'text-red-600 border-red-600 bg-red-50' : ''
                }>
                  {compra.status}
                </Badge>
                
                <button
                  onClick={() => abrirDetalhes(compra)}
                  className="p-2 rounded-md border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex items-center justify-center"
                >
                  <Eye className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* VISUALIZAÇÃO DESKTOP (TABELA) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Código</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Data</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fornecedor</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {comprasFiltradas.map((compra, i) => (
                <tr key={compra.uuid || `compra-${i}`} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{compra.codigo_compra}</td>
                  <td className="px-4 py-3">{new Date(compra.created_at || compra.data_compra).toLocaleDateString("pt-BR")}</td>
                  <td className="px-4 py-3">{compra.msfornecedor?.nome || 'N/A'}</td>
                  <td className="px-4 py-3 text-right font-medium">R$ {Number(compra.valor_total || 0).toLocaleString("pt-BR")}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="outline" className={
                      compra.status === 'FINALIZADA' || compra.status === 'CONCLUIDA' ? 'text-green-600 border-green-600 bg-green-50' : 
                      compra.status === 'CANCELADA' ? 'text-red-600 border-red-600 bg-red-50' : ''
                    }>
                      {compra.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => abrirDetalhes(compra)}
                      className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="Ver Detalhes"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {comprasFiltradas.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Nenhuma compra encontrada.</p>
        </div>
      )}

      {/* DIALOG DE NOVA COMPRA */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent 
          className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Registrar Compra / Entrada</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Tipo de Entrada</Label>
              <Select value={tipoEntrada} onValueChange={(v: "COMPRA" | "AJUSTE") => setTipoEntrada(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="COMPRA">Compra Comercial (de Fornecedor)</SelectItem>
                  <SelectItem value="AJUSTE">Ajuste Manual (Entrada avulsa)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Filial de Destino</Label>
                <Select value={filialDestino} onValueChange={setFilialDestino}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {listaFiliais.map((f, i) => (
                      <SelectItem key={i} value={String(f.codfilial)}>{f.filial}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={statusCompra} onValueChange={setStatusCompra}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDENTE">Pendente</SelectItem>
                    <SelectItem value="CONCLUIDA">Concluída (Gera Estoque)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {tipoEntrada === "COMPRA" && (
              <div className="space-y-2">
                <Label>Fornecedor</Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogFornecedorOpen(true)}>
                    Buscar
                  </Button>
                  <Input value={fornecedorNome} readOnly placeholder="Nenhum fornecedor selecionado" className="flex-1" />
                </div>
              </div>
            )}

            <div className="mt-4">
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-3">Itens da Compra</p>
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end mb-4">
                <div className="md:col-span-4">
                  <Label>Produto</Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button type="button" variant="outline" onClick={() => setDialogProdutoOpen(true)}>
                      ...
                    </Button>
                    <Button type="button" variant="outline" onClick={recarregarProdutos} title="Atualizar produtos" className="px-2">
                      <RefreshCw className="h-4 w-4 text-green-600" />
                    </Button>
                    <Input 
                      value={listaProdutos.find(p => String(p.codproduto) === produtoSelecionadoId)?.descricao || ""} 
                      readOnly 
                      placeholder="Produto"
                    />
                  </div>
                </div>
                <div className="md:col-span-3">
                  <Label>Qtd.</Label>
                  <Input type="number" value={qtdSelecionada} onChange={e => setQtdSelecionada(Number(e.target.value))} min={1} />
                </div>
                {tipoEntrada === "COMPRA" && (
                  <div className="md:col-span-3">
                    <Label>Custo Unit.</Label>
                    <Input type="number" step="0.01" value={custoSelecionado} onChange={e => setCustoSelecionado(Number(e.target.value))} min={0} />
                  </div>
                )}
                <div className="md:col-span-2">
                  <Button type="button" onClick={adicionarItem} disabled={!produtoSelecionadoId} className="w-full">
                    Add
                  </Button>
                </div>
              </div>

              {itensCompra.length > 0 && (
                <div className="bg-muted/30 rounded-md p-3 space-y-2">
                  {itensCompra.map((item, i) => (
                    <div key={i} className="flex justify-between items-center text-sm border-b pb-2 last:border-0 last:pb-0">
                      <span className="flex-1">{item.nomeProduto}</span>
                      <span className="w-20 text-center">{item.quantidade}x</span>
                      {tipoEntrada === "COMPRA" && (
                        <>
                          <span className="w-28 text-right">R$ {item.custo_unitario.toLocaleString('pt-BR')}</span>
                          <span className="w-28 text-right font-medium">R$ {(item.quantidade * item.custo_unitario).toLocaleString('pt-BR')}</span>
                        </>
                      )}
                      <button onClick={() => removerItem(item.codproduto)} className="text-red-500 hover:text-red-700 ml-3">
                        Remover
                      </button>
                    </div>
                  ))}
                  <div className="border-t pt-2 flex justify-between font-bold">
                    <span>{tipoEntrada === "COMPRA" ? "Total da Compra" : "Itens adicionados"}</span>
                    {tipoEntrada === "COMPRA" && (
                      <span className="text-primary">
                        R$ {itensCompra.reduce((s, i) => s + (i.quantidade * i.custo_unitario), 0).toLocaleString('pt-BR')}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSubmitting}>Cancelar</Button>
            <Button onClick={handleSalvarCompra} disabled={isSubmitting}>
              {isSubmitting ? "Registrando..." : (tipoEntrada === "COMPRA" ? "Registrar Compra" : "Registrar Ajuste")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG SELECIONAR FORNECEDOR */}
      <Dialog open={dialogFornecedorOpen} onOpenChange={setDialogFornecedorOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Selecionar Fornecedor</DialogTitle></DialogHeader>
          <Input 
            placeholder="Buscar..." 
            value={fornecedorBusca} 
            onChange={e => setFornecedorBusca(e.target.value)} 
          />
          <div className="max-h-60 overflow-y-auto space-y-2 mt-2">
            {listaFornecedores
              .filter(f => f.nome.toLowerCase().includes(fornecedorBusca.toLowerCase()))
              .map(f => (
                <div 
                  key={f.uuid} 
                  className="p-2 border rounded cursor-pointer hover:bg-muted"
                  onClick={() => {
                    setFornecedorUuid(f.uuid);
                    setFornecedorCod(f.codfornecedor);
                    setFornecedorNome(f.nome);
                    setDialogFornecedorOpen(false);
                  }}
                >
                  <div className="font-medium">{f.nome}</div>
                  <div className="text-xs text-muted-foreground">{f.cnpj}</div>
                </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG SELECIONAR PRODUTO */}
      <Dialog open={dialogProdutoOpen} onOpenChange={setDialogProdutoOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Selecionar Produto</DialogTitle></DialogHeader>
          <div className="flex gap-2">
            <Input 
              placeholder="Buscar por nome, código ou código de barras..." 
              value={produtoBusca} 
              onChange={e => setProdutoBusca(e.target.value)} 
              className="flex-1"
            />
            <Button onClick={() => setScannerOpen(true)} variant="outline" className="px-3">
              <Camera className="h-4 w-4" />
            </Button>
          </div>
            <div className="max-h-[60vh] overflow-y-auto space-y-2">
              {listaProdutos
                .filter(p => {
                  const allowBuyFromAnySupplier = localStorage.getItem("allowBuyFromAnySupplier") !== "false";
                  if (fornecedorCod && !allowBuyFromAnySupplier) {
                    if (p.codfornecedor !== Number(fornecedorCod)) return false;
                  }
                  return p.descricao?.toLowerCase().includes(produtoBusca.toLowerCase()) || 
                         String(p.codproduto).includes(produtoBusca) || 
                         (p.codigo_barras && String(p.codigo_barras).toLowerCase().includes(produtoBusca.toLowerCase()))
                })
                .map((p) => {
                // Calcular estoque total do produto
                const estoqueTotal = listaEstoques
                  .filter(e => String(e.codproduto) === String(p.codproduto))
                  .reduce((acc, curr) => acc + curr.quantidade, 0);

                return (
                  <div 
                    key={p.codproduto} 
                    className="p-3 border rounded cursor-pointer hover:bg-muted"
                    onClick={() => {
                      setProdutoSelecionadoId(String(p.codproduto));
                      setCustoSelecionado(Number(p.custo_unitario) || 0);
                      setDialogProdutoOpen(false);
                    }}
                  >
                    <div className="font-medium">{p.descricao}</div>
                    <div className="flex justify-between items-center mt-1">
                      <div className="text-xs text-muted-foreground">Cód: {p.codproduto} | Custo: R$ {Number(p.custo || p.preco_normal || 0).toLocaleString("pt-BR")}</div>
                      <Badge variant="outline" className={estoqueTotal < 0 ? 'text-red-600 border-red-600 bg-red-50 font-bold' : 'text-muted-foreground'}>
                        Estoque: {estoqueTotal}
                      </Badge>
                    </div>
                  </div>
                );
            })}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* DIALOG DETALHES COMPRA */}
      <Dialog open={dialogDetalhesOpen} onOpenChange={setDialogDetalhesOpen}>
        <DialogContent className="w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Detalhes da Compra #{compraSelecionada?.codigo_compra}</DialogTitle></DialogHeader>
          {compraSelecionada && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold">Fornecedor: <span className="font-normal text-muted-foreground">{compraSelecionada.msfornecedor?.nome}</span></p>
                <p className="text-sm font-semibold">Status: <span className="font-normal text-muted-foreground">{compraSelecionada.status}</span></p>
                <p className="text-sm font-semibold">Filial: <span className="font-normal text-muted-foreground">{compraSelecionada.msfilial?.filial || compraSelecionada.codfilial}</span></p>
                <p className="text-sm font-semibold">Data: <span className="font-normal text-muted-foreground">{new Date(compraSelecionada.data_compra || compraSelecionada.created_at).toLocaleString('pt-BR')}</span></p>
              </div>
              <div>
                <h4 className="font-medium border-b pb-1 mb-2">Itens da Compra</h4>
                <div className="overflow-x-auto max-h-[250px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-background">
                      <tr className="border-b text-left text-muted-foreground text-xs">
                        <th className="pb-2 font-medium pr-2">Cód</th>
                        <th className="pb-2 font-medium">Produto</th>
                        <th className="pb-2 font-medium text-right px-2">Qtd</th>
                        <th className="pb-2 font-medium text-right px-2">Custo Un.</th>
                        <th className="pb-2 font-medium text-right pl-2">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {(compraSelecionada.mscompra_item || []).map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-muted/30">
                          <td className="py-2 text-muted-foreground pr-2">{item.codproduto}</td>
                          <td className="py-2 font-medium">{item.msproduto?.descricao || "Desconhecido"}</td>
                          <td className="py-2 text-right px-2">{item.quantidade}</td>
                          <td className="py-2 text-right text-muted-foreground whitespace-nowrap px-2">
                            R$ {Number(item.custo_unitario).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2 text-right font-medium whitespace-nowrap pl-2">
                            R$ {(item.quantidade * item.custo_unitario).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="flex justify-between items-center border-t pt-3">
                <span className="font-semibold text-lg">Total</span>
                <span className="font-bold text-lg text-primary">R$ {Number(compraSelecionada.valor_total || 0).toLocaleString("pt-BR")}</span>
              </div>
              
              {compraSelecionada.status !== "CANCELADA" && (
                <div className="flex justify-end pt-4 border-t border-border mt-4">
                  <Button 
                    variant="destructive" 
                    onClick={() => {
                      setMotivoCancelamento("");
                      setDialogCancelarOpen(true);
                    }}
                    className="w-full sm:w-auto"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Cancelar Compra (Estornar)
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* DIALOG CANCELAR COMPRA */}
      <Dialog open={dialogCancelarOpen} onOpenChange={setDialogCancelarOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Cancelar Compra</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              ATENÇÃO: Esta ação irá estornar o estoque de todos os produtos recebidos nesta nota.
              Essa operação não pode ser desfeita.
            </p>
            <div className="space-y-2">
              <Label>Motivo do Cancelamento <span className="text-red-500">*</span></Label>
              <Input 
                placeholder="Descreva o motivo (mínimo 15 caracteres)..." 
                value={motivoCancelamento} 
                onChange={e => setMotivoCancelamento(e.target.value)} 
              />
              <p className="text-xs text-muted-foreground text-right">
                {motivoCancelamento.length}/15 caracteres mínimos
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogCancelarOpen(false)} disabled={isSubmitting}>Sair</Button>
            <Button variant="destructive" onClick={handleCancelarCompra} disabled={isSubmitting || motivoCancelamento.trim().length < 15}>
              {isSubmitting ? "Cancelando..." : "Confirmar Cancelamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* MODAL SCANNER */}
      <BarcodeScannerModal 
        open={scannerOpen} 
        onOpenChange={setScannerOpen} 
        onScan={handleScanProduto} 
      />
    </div>
  );
};

export default Purchases;

