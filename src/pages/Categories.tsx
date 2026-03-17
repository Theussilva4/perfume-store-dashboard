import { useState } from "react";
import { categorias as categoriasIniciais, Categoria } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, FolderOpen } from "lucide-react";
import { toast } from "sonner";

const Categories = () => {
  const [lista, setLista] = useState<Categoria[]>(categoriasIniciais);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<Categoria | null>(null);
  const [nome, setNome] = useState("");

  const abrirNova = () => { setEditando(null); setNome(""); setDialogOpen(true); };
  const abrirEdicao = (c: Categoria) => { setEditando(c); setNome(c.nome); setDialogOpen(true); };

  const handleSalvar = () => {
    if (!nome.trim()) { toast.error("Preencha o nome."); return; }
    if (editando) {
      setLista((prev) => prev.map((c) => (c.id === editando.id ? { ...c, nome } : c)));
      toast.success("Categoria atualizada!");
    } else {
      setLista((prev) => [...prev, { id: String(Date.now()), nome, quantidadeProdutos: 0 }]);
      toast.success("Categoria criada!");
    }
    setDialogOpen(false);
  };

  const handleRemover = (id: string) => {
    setLista((prev) => prev.filter((c) => c.id !== id));
    toast.success("Categoria removida!");
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl md:text-3xl font-semibold text-primary">Categorias</h2>
          <p className="text-sm text-muted-foreground mt-1">{lista.length} categorias</p>
        </div>
        <Button onClick={abrirNova}><Plus className="h-4 w-4 mr-2" /> Nova Categoria</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {lista.map((cat) => (
          <div key={cat.id} className="bg-card rounded-lg border border-border p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FolderOpen className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm text-foreground truncate">{cat.nome}</h3>
              <p className="text-xs text-muted-foreground">{cat.quantidadeProdutos} produtos</p>
            </div>
            <div className="flex gap-1">
              <button onClick={() => abrirEdicao(cat)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => handleRemover(cat.id)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">{editando ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Nome da Categoria</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Perfumes Importados" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSalvar}>{editando ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Categories;
