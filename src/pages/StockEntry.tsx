import { useState } from "react";
import { movimentacoesEstoque, produtos } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ArrowDownToLine } from "lucide-react";
import { toast } from "sonner";

const StockEntry = () => {
  const entradas = movimentacoesEstoque.filter((m) => m.tipo === "entrada");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ produtoId: "", quantidade: 0, fornecedor: "", custo: 0, observacoes: "" });

  const handleSalvar = () => {
    if (!form.produtoId || form.quantidade <= 0) {
      toast.error("Selecione um produto e quantidade válida.");
      return;
    }
    toast.success("Entrada registrada! Estoque atualizado.");
    setDialogOpen(false);
    setForm({ produtoId: "", quantidade: 0, fornecedor: "", custo: 0, observacoes: "" });
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl md:text-3xl font-semibold text-primary">Entradas de Estoque</h2>
          <p className="text-sm text-muted-foreground mt-1">Registre a chegada de mercadorias</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-2" /> Nova Entrada</Button>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Data</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Produto</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Qtd</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fornecedor</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Custo Total</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Obs</th>
              </tr>
            </thead>
            <tbody>
              {entradas.map((e) => (
                <tr key={e.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3 text-muted-foreground">{new Date(e.data).toLocaleDateString("pt-BR")}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{e.nomeProduto}</td>
                  <td className="px-4 py-3 text-center text-primary font-medium">+{e.quantidade}</td>
                  <td className="px-4 py-3 text-muted-foreground">{e.fornecedor || "—"}</td>
                  <td className="px-4 py-3 text-right">{e.custo ? `R$ ${e.custo.toLocaleString("pt-BR")}` : "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{e.observacoes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {entradas.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <ArrowDownToLine className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Nenhuma entrada registrada.</p>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Nova Entrada de Estoque</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Produto</Label>
              <Select value={form.produtoId} onValueChange={(v) => setForm({ ...form, produtoId: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione um produto" /></SelectTrigger>
                <SelectContent>
                  {produtos.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantidade</Label>
                <Input type="number" value={form.quantidade} onChange={(e) => setForm({ ...form, quantidade: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Custo Total (R$)</Label>
                <Input type="number" value={form.custo} onChange={(e) => setForm({ ...form, custo: Number(e.target.value) })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Fornecedor</Label>
              <Input value={form.fornecedor} onChange={(e) => setForm({ ...form, fornecedor: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Observação</Label>
              <Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSalvar}>Registrar Entrada</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StockEntry;
