import { useState, useEffect } from "react";
import { getMarcas, createMarca, updateMarca, deleteMarca } from "@/services/marcaService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Tag, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface MarcaAPI {
  codmarca: number;
  marca: string;
}

const Brands = () => {
  const [lista, setLista] = useState<MarcaAPI[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<MarcaAPI | null>(null);
  const [nome, setNome] = useState("");

  const carregar = async () => {
    try {
      setCarregando(true);
      const dados = await getMarcas();
      setLista(Array.isArray(dados) ? dados : []);
    } catch {
      toast.error("Erro ao carregar marcas.");
      setLista([]);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  const abrirNova = () => { setEditando(null); setNome(""); setDialogOpen(true); };
  const abrirEdicao = (m: MarcaAPI) => { setEditando(m); setNome(m.marca); setDialogOpen(true); };

  const handleSalvar = async () => {
    if (!nome.trim()) { toast.error("Preencha o nome da marca."); return; }
    try {
      if (editando) {
        await updateMarca(editando.codmarca, { marca: nome });
        toast.success("Marca atualizada!");
      } else {
        await createMarca({ marca: nome });
        toast.success("Marca criada!");
      }
      setDialogOpen(false);
      carregar();
    } catch {
      toast.error("Erro ao salvar marca.");
    }
  };

  const handleRemover = async (id: number) => {
    try {
      await deleteMarca(id);
      toast.success("Marca removida!");
      carregar();
    } catch {
      toast.error("Erro ao remover marca.");
    }
  };

  if (carregando) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl md:text-3xl font-semibold text-primary">Marcas</h2>
          <p className="text-sm text-muted-foreground mt-1">{lista.length} marcas</p>
        </div>
        <Button onClick={abrirNova}><Plus className="h-4 w-4 mr-2" /> Nova Marca</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {lista.map((m) => (
          <div key={m.codmarca} className="bg-card rounded-lg border border-border p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Tag className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm text-foreground truncate">{m.marca}</h3>
            </div>
            <div className="flex gap-1">
              <button onClick={() => abrirEdicao(m)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => handleRemover(m.codmarca)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent 
          className="max-w-sm"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="font-display text-xl">{editando ? "Editar Marca" : "Nova Marca"}</DialogTitle>
            <DialogDescription>Informe o nome da marca.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da Marca</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Dolce & Gabbana" />
            </div>
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

export default Brands;
