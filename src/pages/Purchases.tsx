import { useState, useEffect, useRef } from "react";
import { ShoppingCart, Plus, Search, Eye, ClipboardList } from "lucide-react";
import { getCompras, createCompra } from "@/services/compraService";
import { getFornecedores } from "@/services/fornecedorService";
import { getProdutos } from "@/services/produtosService";
import { getFilial } from "@/services/filialService";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBranch } from "@/contexts/BranchContext";

const Purchases = () => {
  const [listaCompras, setListaCompras] = useState<any[]>([]);
  const [listaFornecedores, setListaFornecedores] = useState<any[]>([]);
  const [listaProdutos, setListaProdutos] = useState<any[]>([]);
  const [listaFiliais, setListaFiliais] = useState<any[]>([]);
  
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogDetalhesOpen, setDialogDetalhesOpen] = useState(false);
  const [compraSelecionada, setCompraSelecionada] = useState<any | null>(null);
  const { filialSelecionada, rotuloFilial } = useBranch();
  
  // States para nova compra
  const [fornecedorBusca, setFornecedorBusca] = useState("");
  const [fornecedorUuid, setFornecedorUuid] = useState("");
  const [fornecedorNome, setFornecedorNome] = useState("");
  const [dialogFornecedorOpen, setDialogFornecedorOpen] = useState(false);
  
  const [filialDestino, setFilialDestino] = useState("");
  const [statusCompra, setStatusCompra] = useState("CONCLUIDA");
  
  const [produtoBusca, setProdutoBusca] = useState("");
  const [produtoSelecionadoId, setProdutoSelecionadoId] = useState("");
  const [qtdSelecionada, setQtdSelecionada] = useState(1);
  const [custoSelecionado, setCustoSelecionado] = useState(0);
  const [dialogProdutoOpen, setDialogProdutoOpen] = useState(false);
  
  const [itensCompra, setItensCompra] = useState<any[]>([]);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setLoading(true);
    try {
      const [comprasAPI, fornecedoresAPI, produtosAPI, filiaisAPI] = await Promise.all([
        getCompras(),
        getFornecedores(),
        getProdutos(),
        getFilial()
      ]);
      setListaCompras(Array.isArray(comprasAPI) ? comprasAPI : []);
      setListaFornecedores(Array.isArray(fornecedoresAPI) ? fornecedoresAPI : []);
      setListaProdutos(Array.isArray(produtosAPI) ? produtosAPI : []);
      setListaFiliais(Array.isArray(filiaisAPI) ? filiaisAPI : []);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }

  const limpar = (v: string) => v.replace(/\D/g, "");

  const comprasFiltradas = listaCompras.filter(c => {
    // filtro de filial
    const matchFilial = filialSelecionada === "todas" || 
      String(c.codfilial) === String(filialSelecionada) ||
      String(c.filial?.codfilial) === String(filialSelecionada);
      
    // filtro de texto
    const fornecedor = (c.fornecedor?.nome || "").toLowerCase();
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

  const handleCriarCompra = async () => {
    if (!fornecedorUuid) return toast.error("Selecione um fornecedor");
    if (!filialDestino || filialDestino === "todas") return toast.error("Selecione uma filial de destino");
    if (itensCompra.length === 0) return toast.error("Adicione itens à compra");
    
    try {
      const payload = {
        fornecedor_uuid: fornecedorUuid,
        codfilial: parseInt(filialDestino),
        status: statusCompra,
        itens: itensCompra.map(i => ({
          codproduto: i.codproduto,
          quantidade: i.quantidade,
          custo_unitario: i.custo_unitario
        }))
      };
      
      await createCompra(payload);
      toast.success("Compra registrada com sucesso!");
      
      // Limpar form
      setFornecedorUuid("");
      setFornecedorNome("");
      setFilialDestino("");
      setItensCompra([]);
      setDialogOpen(false);
      carregarDados();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao registrar compra");
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
        <div className="overflow-x-auto">
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
                  <td className="px-4 py-3">{new Date(compra.created_at).toLocaleDateString("pt-BR")}</td>
                  <td className="px-4 py-3">{compra.fornecedor?.nome || 'N/A'}</td>
                  <td className="px-4 py-3 text-right font-medium">R$ {Number(compra.valor_total || 0).toLocaleString("pt-BR")}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="outline" className={compra.status === 'CONCLUIDA' ? 'text-green-600 border-green-600' : ''}>
                      {compra.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => {
                        setCompraSelecionada(compra);
                        setDialogDetalhesOpen(true);
                      }}
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

            <div className="space-y-2">
              <Label>Fornecedor</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogFornecedorOpen(true)}>
                  Buscar
                </Button>
                <Input value={fornecedorNome} readOnly placeholder="Nenhum fornecedor selecionado" className="flex-1" />
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-3">Itens da Compra</p>
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end mb-4">
                <div className="md:col-span-4">
                  <Label>Produto</Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button type="button" variant="outline" onClick={() => setDialogProdutoOpen(true)}>
                      ...
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
                <div className="md:col-span-3">
                  <Label>Custo Unit.</Label>
                  <Input type="number" value={custoSelecionado} onChange={e => setCustoSelecionado(Number(e.target.value))} min={0} />
                </div>
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
                      <span className="w-28 text-right">R$ {item.custo_unitario.toLocaleString('pt-BR')}</span>
                      <span className="w-28 text-right font-medium">R$ {(item.quantidade * item.custo_unitario).toLocaleString('pt-BR')}</span>
                      <button onClick={() => removerItem(item.codproduto)} className="text-red-500 hover:text-red-700 ml-3">
                        Remover
                      </button>
                    </div>
                  ))}
                  <div className="border-t pt-2 flex justify-between font-bold">
                    <span>Total da Compra</span>
                    <span className="text-primary">
                      R$ {itensCompra.reduce((s, i) => s + (i.quantidade * i.custo_unitario), 0).toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCriarCompra}>Registrar Compra</Button>
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
          <Input 
            placeholder="Buscar..." 
            value={produtoBusca} 
            onChange={e => setProdutoBusca(e.target.value)} 
          />
          <div className="max-h-60 overflow-y-auto space-y-2 mt-2">
            {listaProdutos
              .filter(p => p.descricao?.toLowerCase().includes(produtoBusca.toLowerCase()) || String(p.codproduto).includes(produtoBusca))
              .map(p => (
                <div 
                  key={p.codproduto} 
                  className="p-2 border rounded cursor-pointer hover:bg-muted"
                  onClick={() => {
                    setProdutoSelecionadoId(String(p.codproduto));
                    setCustoSelecionado(Number(p.custo_unitario) || 0);
                    setDialogProdutoOpen(false);
                  }}
                >
                  <div className="font-medium">{p.descricao}</div>
                  <div className="text-xs text-muted-foreground">Código: {p.codproduto} | Custo: R$ {p.custo_unitario}</div>
                </div>
            ))}
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
                <p className="text-sm font-semibold">Fornecedor: <span className="font-normal text-muted-foreground">{compraSelecionada.fornecedor?.nome}</span></p>
                <p className="text-sm font-semibold">Status: <span className="font-normal text-muted-foreground">{compraSelecionada.status}</span></p>
                <p className="text-sm font-semibold">Filial: <span className="font-normal text-muted-foreground">{compraSelecionada.filial?.filial || compraSelecionada.codfilial}</span></p>
                <p className="text-sm font-semibold">Data: <span className="font-normal text-muted-foreground">{new Date(compraSelecionada.created_at).toLocaleString('pt-BR')}</span></p>
              </div>
              <div>
                <h4 className="font-medium border-b pb-1 mb-2">Itens</h4>
                <ul className="space-y-2 max-h-[250px] overflow-y-auto">
                  {(compraSelecionada.itens || []).map((item: any, idx: number) => (
                    <li key={idx} className="flex justify-between text-sm">
                      <span>{item.quantidade}x {item.produto?.descricao || `Produto ID: ${item.codproduto}`}</span>
                      <span className="font-medium text-muted-foreground">R$ {(item.quantidade * item.custo_unitario).toLocaleString("pt-BR")}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex justify-between items-center border-t pt-3">
                <span className="font-semibold text-lg">Total</span>
                <span className="font-bold text-lg text-primary">R$ {Number(compraSelecionada.valor_total || 0).toLocaleString("pt-BR")}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Purchases;
