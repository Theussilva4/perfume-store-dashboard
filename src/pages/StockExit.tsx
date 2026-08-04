import { useState, useEffect } from "react";
import { getSaidas, createSaida, getEstoque, cancelarSaida } from "@/services/estoqueService";
import { getProdutos } from "@/services/produtosService";
import { getFilial } from "@/services/filialService";
import { useBranch } from "@/contexts/BranchContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, ArrowUpFromLine, ShoppingCart, Calculator, Store, FileText, Camera, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { BarcodeScannerModal } from "@/components/BarcodeScannerModal";

const rotulosMotivo: Record<string, string> = {
  venda: "Venda",
  perda: "Perda",
  defeito: "Defeito",
  ajuste: "Ajuste Manual",
  VENDA: "Venda",
  AJUSTE: "Ajuste Manual",
  PERDA: "Perda",
  DEFEITO: "Defeito"
};

const StockExit = () => {
  const { filialSelecionada, rotuloFilial } = useBranch();
  
  const [saidas, setSaidas] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [filiais, setFiliais] = useState<any[]>([]);
  const [listaEstoques, setListaEstoques] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogProdutoOpen, setDialogProdutoOpen] = useState(false);
  const [dialogCancelarOpen, setDialogCancelarOpen] = useState(false);
  const [produtoBusca, setProdutoBusca] = useState("");
  const [motivoCancelamento, setMotivoCancelamento] = useState("");
  const [saidaSelecionadaId, setSaidaSelecionadaId] = useState<number | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [form, setForm] = useState({ produtoId: "", quantidade: 0, motivo: "", observacoes: "", filial: "" });

  const produtoSelecionado = produtos.find((p) => String(p.codproduto) === form.produtoId);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setLoading(true);
    try {
      const [saidasAPI, produtosAPI, filiaisAPI, estoquesAPI] = await Promise.all([
        getSaidas(),
        getProdutos(),
        getFilial(),
        getEstoque()
      ]);
      setSaidas(Array.isArray(saidasAPI) ? saidasAPI : []);
      setProdutos(Array.isArray(produtosAPI) ? produtosAPI : []);
      setFiliais(Array.isArray(filiaisAPI) ? filiaisAPI : []);
      setListaEstoques(Array.isArray(estoquesAPI) ? estoquesAPI : []);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar dados de estoque");
    } finally {
      setLoading(false);
    }
  }

  const saidasFiltradas = saidas.filter((m) => {
    return filialSelecionada === "todas" || String(m.codfilial) === String(filialSelecionada);
  });

  const getRotuloFilial = (codfilial: number) => {
    const f = filiais.find(f => f.codfilial === codfilial);
    return f ? f.filial : `Filial ${codfilial}`;
  };

  const handleSalvar = async () => {
    if (!form.produtoId || form.quantidade <= 0 || !form.motivo || !form.filial) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    // Calcular estoque total do produto na filial selecionada
    const estoquesDoProduto = listaEstoques.filter(e => String(e.codproduto) === String(form.produtoId));
    const estFilial = estoquesDoProduto.find(e => String(e.codfilial) === String(form.filial));
    const estoqueTotal = estFilial ? estFilial.quantidade : 0;

    if (estoqueTotal - form.quantidade < 0) {
      toast.error(`Estoque insuficiente na filial. Você possui apenas ${estoqueTotal} unidades.`);
      return;
    }
    
    try {
      await createSaida({
        codproduto: Number(form.produtoId),
        codfilial: Number(form.filial),
        quantidade: form.quantidade,
        origem: form.motivo
      });
      
      toast.success("Saída registrada! Estoque atualizado.");
      setDialogOpen(false);
      setForm({ produtoId: "", quantidade: 0, motivo: "", observacoes: "", filial: "" });
      carregarDados();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao registrar saída de estoque");
    }
  };

  const handleCancelarClick = (id: number) => {
    setSaidaSelecionadaId(id);
    setMotivoCancelamento("");
    setDialogCancelarOpen(true);
  };

  const handleConfirmarCancelamento = async () => {
    if (!saidaSelecionadaId) return;
    if (motivoCancelamento.trim().length < 15) {
      toast.error("O motivo do cancelamento deve ter pelo menos 15 caracteres.");
      return;
    }

    setIsCanceling(true);
    try {
      await cancelarSaida(saidaSelecionadaId, motivoCancelamento);
      toast.success("Saída cancelada e estoque estornado!");
      setDialogCancelarOpen(false);
      carregarDados();
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.erro || error.response?.data?.error || "Erro ao cancelar saída";
      toast.error(msg);
    } finally {
      setIsCanceling(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl md:text-3xl font-semibold text-primary">Saídas de Estoque</h2>
          <p className="text-sm text-muted-foreground mt-1">{rotuloFilial} • Registre saídas por perda, defeito ou ajuste</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-2" /> Nova Saída</Button>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {/* VISÃO MOBILE */}
        <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
          {saidasFiltradas.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">Nenhuma saída registrada.</div>
          ) : saidasFiltradas.map((e) => (
            <div key={e.id} className="bg-background rounded-lg border border-border p-4 shadow-sm flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium text-foreground">{e.produto?.descricao || `Cód: ${e.codproduto}`}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    <Badge variant="outline" className="text-[10px]">{getRotuloFilial(e.codfilial)}</Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">{new Date(e.data_mov || e.created_at).toLocaleDateString("pt-BR")}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t border-border mt-1 items-center">
                <div>
                  <span className="text-xs text-muted-foreground block">Quantidade</span>
                  <span className="font-medium text-destructive">-{e.quantidade}</span>
                </div>
                <div className="flex justify-between items-center text-right">
                  <div className="flex-1">
                    <span className="text-xs text-muted-foreground block">Motivo</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {e.origem ? rotulosMotivo[e.origem.toUpperCase()] || e.origem : "—"}
                    </Badge>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0 ml-2"
                    onClick={() => handleCancelarClick(e.id)}
                    disabled={isCanceling}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* VISÃO DESKTOP */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Data</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Produto</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Qtd</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Motivo</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Unidade</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {saidasFiltradas.map((e) => (
                <tr key={e.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3 text-muted-foreground">{new Date(e.data_mov || e.created_at).toLocaleDateString("pt-BR")}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{e.produto?.descricao || `Cód: ${e.codproduto}`}</td>
                  <td className="px-4 py-3 text-center text-destructive font-medium">-{e.quantidade}</td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className="text-[10px]">
                      {e.origem ? rotulosMotivo[e.origem.toUpperCase()] || e.origem : "—"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="outline" className="text-[10px]">{getRotuloFilial(e.codfilial)}</Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                      onClick={() => handleCancelarClick(e.id)}
                      disabled={isCanceling}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && saidasFiltradas.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <ArrowUpFromLine className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Nenhuma saída registrada.</p>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent 
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Nova Saída de Estoque</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            {/* Produto e Filial */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-primary" /> Produto e Origem
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Unidade de origem</Label>
                  <Select value={form.filial} onValueChange={(v) => setForm({ ...form, filial: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione a filial" /></SelectTrigger>
                    <SelectContent>
                      {filiais.map((b) => (
                        <SelectItem key={b.codfilial} value={String(b.codfilial)}>{b.filial}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Produto</Label>
                  <Button type="button" variant="outline" onClick={() => setDialogProdutoOpen(true)} className="w-full justify-between">
                    {produtoSelecionado ? produtoSelecionado.descricao : "Selecionar Produto..."}
                    <Search className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
                {produtoSelecionado && (
                  <div className="col-span-2 bg-muted/30 rounded-md p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div><span className="text-muted-foreground">Categoria:</span> <span className="font-medium text-foreground">{produtoSelecionado.categoria || "—"}</span></div>
                    <div><span className="text-muted-foreground">Marca:</span> <span className="font-medium text-foreground">{produtoSelecionado.marca || "—"}</span></div>
                    <div><span className="text-muted-foreground">Cód. Barras:</span> <span className="font-medium text-foreground">{produtoSelecionado.codigo_barras || "—"}</span></div>
                    <div><span className="text-muted-foreground">Volume:</span> <span className="font-medium text-foreground">{produtoSelecionado.volume ? `${produtoSelecionado.volume}ml` : "—"}</span></div>
                  </div>
                )}
              </div>
            </div>

            {/* Informações da Saída */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Detalhes da Saída
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Quantidade</Label>
                  <Input type="number" min={1} value={form.quantidade} onChange={(e) => setForm({ ...form, quantidade: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>Motivo</Label>
                  <Select value={form.motivo} onValueChange={(v) => setForm({ ...form, motivo: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione o motivo" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERDA">Perda</SelectItem>
                      <SelectItem value="DEFEITO">Defeito</SelectItem>
                      <SelectItem value="AJUSTE">Ajuste Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Observação</Label>
                  <Textarea placeholder="Descreva o motivo desta saída..." value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} rows={2} />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSalvar}>Registrar Saída</Button>
          </DialogFooter>
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
              {produtos
                .filter(p => {
                  return p.descricao?.toLowerCase().includes(produtoBusca.toLowerCase()) || 
                         String(p.codproduto).includes(produtoBusca) || 
                         (p.codigo_barras && String(p.codigo_barras).toLowerCase().includes(produtoBusca.toLowerCase()))
                })
                .map((p) => {
                // Calcular estoque total do produto na filial selecionada
                const estoquesDoProduto = listaEstoques.filter(e => String(e.codproduto) === String(p.codproduto));
                let estoqueTotal = 0;
                if (form.filial) {
                  const estFilial = estoquesDoProduto.find(e => String(e.codfilial) === String(form.filial));
                  estoqueTotal = estFilial ? estFilial.quantidade : 0;
                } else {
                  estoqueTotal = estoquesDoProduto.reduce((acc, curr) => acc + curr.quantidade, 0);
                }

                return (
                  <div 
                    key={p.codproduto} 
                    className="p-3 border rounded cursor-pointer hover:bg-muted"
                    onClick={() => {
                      setForm({ ...form, produtoId: String(p.codproduto) });
                      setDialogProdutoOpen(false);
                    }}
                  >
                    <div className="font-medium">{p.descricao}</div>
                    <div className="flex justify-between items-center mt-1">
                      <div className="text-xs text-muted-foreground">Cód: {p.codproduto} | Cód. Barras: {p.codigo_barras || 'N/A'}</div>
                      <Badge variant="outline" className={estoqueTotal <= 0 ? 'text-red-600 border-red-600 bg-red-50 font-bold' : 'text-muted-foreground'}>
                        Estoque {form.filial ? 'na Filial' : 'Total'}: {estoqueTotal}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG CANCELAR SAÍDA */}
      <Dialog open={dialogCancelarOpen} onOpenChange={setDialogCancelarOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Saída</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Você está prestes a cancelar esta saída. Isso devolverá a quantidade correspondente ao estoque.
            </p>
            <div className="space-y-2">
              <Label>Motivo do Cancelamento/Estorno</Label>
              <Textarea 
                placeholder="Ex: Produto lançado na filial errada, quantidade informada com erro..." 
                value={motivoCancelamento} 
                onChange={e => setMotivoCancelamento(e.target.value)} 
                rows={3}
              />
              <p className="text-xs text-muted-foreground text-right">Mínimo de 15 caracteres</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogCancelarOpen(false)} disabled={isCanceling}>
              Voltar
            </Button>
            <Button variant="destructive" onClick={handleConfirmarCancelamento} disabled={isCanceling}>
              {isCanceling ? "Cancelando..." : "Confirmar Estorno"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BarcodeScannerModal 
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={(code) => {
          setProdutoBusca(code);
          setScannerOpen(false);
        }}
      />
    </div>
  );
};

export default StockExit;

