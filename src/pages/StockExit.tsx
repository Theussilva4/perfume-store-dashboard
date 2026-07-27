import { useState } from "react";
import { movimentacoesEstoque, produtos, rotulosFilial } from "@/data/mockData";
import { useBranch, filiais } from "@/contexts/BranchContext";
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
};

const StockExit = () => {
  const { filialSelecionada, rotuloFilial } = useBranch();
  const saidas = movimentacoesEstoque.filter((m) => m.tipo === "saida" && (filialSelecionada === "todas" || m.filial === filialSelecionada));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ produtoId: "", quantidade: 0, motivo: "", observacoes: "", filial: "matriz" });

  const handleSalvar = () => {
    if (!form.produtoId || form.quantidade <= 0 || !form.motivo || !form.filial) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    toast.success(`Saída registrada na ${rotulosFilial[form.filial]}! Estoque atualizado.`);
    setDialogOpen(false);
    setForm({ produtoId: "", quantidade: 0, motivo: "", observacoes: "", filial: "matriz" });
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
        <div className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Data</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Produto</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Qtd</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Motivo</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Unidade</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Obs</th>
              </tr>
            </thead>
            <tbody>
              {saidas.map((e) => (
                <tr key={e.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3 text-muted-foreground">{new Date(e.data).toLocaleDateString("pt-BR")}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{e.nomeProduto}</td>
                  <td className="px-4 py-3 text-center text-destructive font-medium">-{e.quantidade}</td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className="text-[10px]">
                      {e.motivo ? rotulosMotivo[e.motivo] || e.motivo : "—"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="outline" className="text-[10px]">{rotulosFilial[e.filial]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{e.observacoes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {saidas.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <ArrowUpFromLine className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Nenhuma saída registrada.</p>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent 
          className="w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto"
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
            <DialogTitle className="font-display text-xl">Nova Saída de Estoque</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Unidade de origem</Label>
              <Select value={form.filial} onValueChange={(v) => setForm({ ...form, filial: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {filiais.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.rotulo}</SelectItem>
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
                    <SelectItem key={p.id} value={p.id}>{p.nome} ({p.estoquePorFilial[form.filial as keyof typeof p.estoquePorFilial] ?? 0} un.)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantidade</Label>
                <Input type="number" value={form.quantidade} onChange={(e) => setForm({ ...form, quantidade: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Motivo</Label>
                <Select value={form.motivo} onValueChange={(v) => setForm({ ...form, motivo: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="venda">Venda</SelectItem>
                    <SelectItem value="perda">Perda</SelectItem>
                    <SelectItem value="defeito">Defeito</SelectItem>
                    <SelectItem value="ajuste">Ajuste Manual</SelectItem>
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
