import { useState, useEffect } from "react";
import { getCategorias, createCategoria, updateCategoria, deleteCategoria } from "@/services/categoriaService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, FolderOpen, Percent, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CategoriaAPI {
  codcategoria: number;
  categoria: string;
  margem_padrao?: number;
}

const Categories = () => {
  const [lista, setLista] = useState<CategoriaAPI[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<CategoriaAPI | null>(null);
  const [nome, setNome] = useState("");
  const [margemPadrao, setMargemPadrao] = useState<number>(50);

  const carregar = async () => {
    try {
      setCarregando(true);
      const dados = await getCategorias();
      setLista(Array.isArray(dados) ? dados : []);
    } catch {
      toast.error("Erro ao carregar categorias.");
      setLista([]);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  const abrirNova = () => { setEditando(null); setNome(""); setMargemPadrao(50); setDialogOpen(true); };
  const abrirEdicao = (c: CategoriaAPI) => { setEditando(c); setNome(c.categoria); setMargemPadrao(c.margem_padrao ?? 50); setDialogOpen(true); };

  const handleSalvar = async () => {
    if (!nome.trim()) { toast.error("Preencha o nome."); return; }
    try {
      if (editando) {
        await updateCategoria(editando.codcategoria, { categoria: nome, margem_padrao: margemPadrao });
        toast.success("Categoria atualizada!");
      } else {
        await createCategoria({ categoria: nome, margem_padrao: margemPadrao });
        toast.success("Categoria criada!");
      }
      setDialogOpen(false);
      carregar();
    } catch {
      toast.error("Erro ao salvar categoria.");
    }
  };

  const handleRemover = async (id: number) => {
    try {
      await deleteCategoria(id);
      toast.success("Categoria removida!");
      carregar();
    } catch {
      toast.error("Erro ao remover categoria.");
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
          <h2 className="font-display text-2xl md:text-3xl font-semibold text-primary">Categorias</h2>
          <p className="text-sm text-muted-foreground mt-1">{lista.length} categorias</p>
        </div>
        <Button onClick={abrirNova}><Plus className="h-4 w-4 mr-2" /> Nova Categoria</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {lista.map((cat) => (
          <div key={cat.codcategoria} className="bg-card rounded-lg border border-border p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FolderOpen className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm text-foreground truncate">{cat.categoria}</h3>
              <div className="flex items-center gap-2">
                {cat.margem_padrao != null && (
                  <span className="text-xs text-primary font-medium flex items-center gap-0.5">
                    <Percent className="h-3 w-3" />{cat.margem_padrao}% margem
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => abrirEdicao(cat)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => handleRemover(cat.codcategoria)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
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
            <DialogDescription>Defina o nome e a margem padrão de lucro.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da Categoria</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Perfumes Importados" />
            </div>
            <div className="space-y-2">
              <Label>Margem Padrão (%)</Label>
              <Input type="number" min={0} max={500} value={margemPadrao} onChange={(e) => setMargemPadrao(Number(e.target.value))} placeholder="Ex: 80" />
              <p className="text-xs text-muted-foreground">Usada como sugestão ao cadastrar produtos e registrar compras desta categoria.</p>
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

export default Categories;
