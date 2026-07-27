import { useState, useEffect } from "react";
import { getSaidas, createSaida } from "@/services/estoqueService";
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
import { Plus, ArrowUpFromLine } from "lucide-react";
import { toast } from "sonner";

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
  const [loading, setLoading] = useState(false);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ produtoId: "", quantidade: 0, motivo: "", observacoes: "", filial: "" });

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setLoading(true);
    try {
      const [saidasAPI, produtosAPI, filiaisAPI] = await Promise.all([
        getSaidas(),
        getProdutos(),
        getFilial()
      ]);
      setSaidas(Array.isArray(saidasAPI) ? saidasAPI : []);
      setProdutos(Array.isArray(produtosAPI) ? produtosAPI : []);
      setFiliais(Array.isArray(filiaisAPI) ? filiaisAPI : []);
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
                <div className="text-right">
                  <span className="text-xs text-muted-foreground block">Motivo</span>
                  <Badge variant="secondary" className="text-[10px]">
                    {e.origem ? rotulosMotivo[e.origem.toUpperCase()] || e.origem : "—"}
                  </Badge>
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
          className="w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Nova Saída de Estoque</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
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
              <Select value={form.produtoId} onValueChange={(v) => setForm({ ...form, produtoId: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione um produto" /></SelectTrigger>
                <SelectContent>
                  {produtos.map((p) => (
                    <SelectItem key={p.codproduto} value={String(p.codproduto)}>
                      {p.descricao} 
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantidade</Label>
                <Input type="number" min={1} value={form.quantidade} onChange={(e) => setForm({ ...form, quantidade: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Motivo</Label>
                <Select value={form.motivo} onValueChange={(v) => setForm({ ...form, motivo: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERDA">Perda</SelectItem>
                    <SelectItem value="DEFEITO">Defeito</SelectItem>
                    <SelectItem value="AJUSTE">Ajuste Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Observação</Label>
              <Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSalvar}>Registrar Saída</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StockExit;
