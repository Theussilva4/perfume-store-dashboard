import { useState, useMemo } from "react";
import { compras as comprasIniciais, produtos, categorias, Compra } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ShoppingCart, TrendingUp, Calculator, Receipt } from "lucide-react";
import { toast } from "sonner";

const compraVazia = {
  produtoId: "",
  fornecedor: "",
  notaFiscal: "",
  dataCompra: new Date().toISOString().split("T")[0],
  quantidade: 1,
  custoUnitario: 0,
  desconto: 0,
  frete: 0,
  outrosCustos: 0,
  filial: "matriz",
  observacoes: "",
};

const StockEntry = () => {
  const [listaCompras, setListaCompras] = useState<Compra[]>(comprasIniciais);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(compraVazia);

  const produtoSelecionado = useMemo(
    () => produtos.find((p) => p.id === form.produtoId),
    [form.produtoId]
  );

  const categoriaProduto = useMemo(
    () => categorias.find((c) => c.nome === produtoSelecionado?.categoria),
    [produtoSelecionado]
  );

  const custoTotal = form.custoUnitario * form.quantidade;
  const custoRealUnitario =
    form.quantidade > 0
      ? (custoTotal + form.frete + form.outrosCustos - form.desconto) / form.quantidade
      : 0;

  const margemCategoria = categoriaProduto?.margemPadrao ?? 50;
  const precoSugerido = custoRealUnitario * (1 + margemCategoria / 100);
  const markup = custoRealUnitario > 0 ? precoSugerido / custoRealUnitario : 0;

  const handleSalvar = () => {
    if (!form.produtoId || form.quantidade <= 0 || form.custoUnitario <= 0) {
      toast.error("Preencha produto, quantidade e custo unitário.");
      return;
    }
    if (!form.fornecedor.trim()) {
      toast.error("Informe o fornecedor.");
      return;
    }

    const novaCompra: Compra = {
      id: String(Date.now()),
      produtoId: form.produtoId,
      nomeProduto: produtoSelecionado?.nome || "",
      categoria: produtoSelecionado?.categoria || "",
      marca: produtoSelecionado?.marca || "",
      codigoBarras: produtoSelecionado?.codigoBarras,
      volume: produtoSelecionado?.volume,
      fornecedor: form.fornecedor,
      notaFiscal: form.notaFiscal,
      dataCompra: form.dataCompra,
      quantidade: form.quantidade,
      custoUnitario: form.custoUnitario,
      custoTotal,
      desconto: form.desconto,
      frete: form.frete,
      outrosCustos: form.outrosCustos,
      custoRealUnitario,
      precoSugerido,
      filial: form.filial,
      observacoes: form.observacoes,
    };

    setListaCompras((prev) => [novaCompra, ...prev]);
    toast.success("Compra registrada! Estoque atualizado.");
    setDialogOpen(false);
    setForm(compraVazia);
  };

  const totalInvestido = listaCompras.reduce((acc, c) => acc + c.custoTotal, 0);
  const totalItens = listaCompras.reduce((acc, c) => acc + c.quantidade, 0);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl md:text-3xl font-semibold text-primary">Compras</h2>
          <p className="text-sm text-muted-foreground mt-1">Controle de compras e custo real dos produtos</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Nova Compra
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-lg border border-border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
            <Receipt className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total de Compras</p>
            <p className="text-lg font-semibold text-foreground">{listaCompras.length}</p>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
            <ShoppingCart className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Itens Comprados</p>
            <p className="text-lg font-semibold text-foreground">{totalItens}</p>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Investido</p>
            <p className="text-lg font-semibold text-foreground">R$ {totalInvestido.toLocaleString("pt-BR")}</p>
          </div>
        </div>
      </div>

      {/* Tabela de compras */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Data</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">NF</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Produto</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Qtd</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Custo Unit.</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Frete</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Desc.</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Custo Real</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fornecedor</th>
              </tr>
            </thead>
            <tbody>
              {listaCompras.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3 text-muted-foreground">{new Date(c.dataCompra).toLocaleDateString("pt-BR")}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{c.notaFiscal || "—"}</td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-foreground">{c.nomeProduto}</p>
                      <p className="text-xs text-muted-foreground">{c.marca}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-primary font-medium">+{c.quantidade}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">R$ {c.custoUnitario.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{c.frete > 0 ? `R$ ${c.frete.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{c.desconto > 0 ? `R$ ${c.desconto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-semibold text-foreground">R$ {c.custoRealUnitario.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.fornecedor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {listaCompras.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Nenhuma compra registrada.</p>
        </div>
      )}

      {/* Dialog Nova Compra */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Nova Compra</DialogTitle>
            <DialogDescription>Registre a compra com todos os custos para calcular o custo real.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            {/* Produto */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-primary" /> Produto
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-2">
                  <Label>Produto</Label>
                  <Select value={form.produtoId} onValueChange={(v) => setForm({ ...form, produtoId: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione um produto" /></SelectTrigger>
                    <SelectContent>
                      {produtos.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.nome} — {p.marca}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {produtoSelecionado && (
                  <div className="col-span-2 bg-muted/30 rounded-md p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div><span className="text-muted-foreground">Categoria:</span> <span className="font-medium text-foreground">{produtoSelecionado.categoria}</span></div>
                    <div><span className="text-muted-foreground">Marca:</span> <span className="font-medium text-foreground">{produtoSelecionado.marca}</span></div>
                    <div><span className="text-muted-foreground">Cód. Barras:</span> <span className="font-medium text-foreground">{produtoSelecionado.codigoBarras || "—"}</span></div>
                    <div><span className="text-muted-foreground">Volume:</span> <span className="font-medium text-foreground">{produtoSelecionado.volume ? `${produtoSelecionado.volume}ml` : "—"}</span></div>
                  </div>
                )}
              </div>
            </div>

            {/* Nota Fiscal */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Receipt className="h-4 w-4 text-primary" /> Nota Fiscal
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Fornecedor</Label>
                  <Input value={form.fornecedor} onChange={(e) => setForm({ ...form, fornecedor: e.target.value })} placeholder="Nome do fornecedor" />
                </div>
                <div className="space-y-2">
                  <Label>Nº da NF</Label>
                  <Input value={form.notaFiscal} onChange={(e) => setForm({ ...form, notaFiscal: e.target.value })} placeholder="Ex: NF-001" />
                </div>
                <div className="space-y-2">
                  <Label>Data da Compra</Label>
                  <Input type="date" value={form.dataCompra} onChange={(e) => setForm({ ...form, dataCompra: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Valores */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Calculator className="h-4 w-4 text-primary" /> Valores
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Quantidade</Label>
                  <Input type="number" min={1} value={form.quantidade} onChange={(e) => setForm({ ...form, quantidade: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>Custo Unitário (R$)</Label>
                  <Input type="number" min={0} step={0.01} value={form.custoUnitario} onChange={(e) => setForm({ ...form, custoUnitario: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>Custo Total (R$)</Label>
                  <Input type="number" value={custoTotal.toFixed(2)} disabled className="bg-muted/50" />
                </div>
                <div className="space-y-2">
                  <Label>Desconto da NF (R$)</Label>
                  <Input type="number" min={0} step={0.01} value={form.desconto} onChange={(e) => setForm({ ...form, desconto: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>Frete (R$)</Label>
                  <Input type="number" min={0} step={0.01} value={form.frete} onChange={(e) => setForm({ ...form, frete: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>Outros Custos (R$)</Label>
                  <Input type="number" min={0} step={0.01} value={form.outrosCustos} onChange={(e) => setForm({ ...form, outrosCustos: Number(e.target.value) })} />
                </div>
              </div>
            </div>

            {/* Resultado — Custo Real */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-medium text-primary flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Resultado do Cálculo
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Custo Real Unit.</p>
                  <p className="text-xl font-bold text-foreground">R$ {custoRealUnitario.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Margem ({margemCategoria}%)</p>
                  <p className="text-xl font-bold text-primary">R$ {precoSugerido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                  <p className="text-[10px] text-muted-foreground">preço sugerido</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Markup</p>
                  <p className="text-xl font-bold text-foreground">{markup.toFixed(2)}x</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Lucro Unit. Estimado</p>
                  <p className="text-xl font-bold text-accent-foreground">R$ {(precoSugerido - custoRealUnitario).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Fórmula: (Custo Total + Frete + Outros Custos − Desconto) ÷ Quantidade
              </p>
            </div>

            {/* Filial + Obs */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Filial Destino</Label>
                <Select value={form.filial} onValueChange={(v) => setForm({ ...form, filial: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="matriz">Matriz</SelectItem>
                    <SelectItem value="filial1">Filial 1</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Observação</Label>
                <Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} rows={2} placeholder="Opcional..." />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSalvar}>Registrar Compra</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StockEntry;
