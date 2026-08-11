import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { caixaService } from "@/services/caixaService";
import { getFilial } from "@/services/filialService";
import api from "@/services/api";

const CaixasConfig = () => {
  const [caixas, setCaixas] = useState<any[]>([]);
  const [filiais, setFiliais] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<any>(null);
  
  const [nome, setNome] = useState("");
  const [codfilial, setCodfilial] = useState("");
  const [ativo, setAtivo] = useState(true);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [caixasData, filiaisData] = await Promise.all([
        caixaService.listarCaixas(undefined, true),
        getFilial()
      ]);
      setCaixas(Array.isArray(caixasData) ? caixasData : []);
      setFiliais(Array.isArray(filiaisData) ? filiaisData : (filiaisData?.data || []));
    } catch (error) {
      toast.error("Erro ao carregar caixas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const abrirNovo = () => {
    setEditando(null);
    setNome("");
    setCodfilial("");
    setAtivo(true);
    setDialogOpen(true);
  };

  const abrirEditar = (caixa: any) => {
    setEditando(caixa);
    setNome(caixa.nome);
    setCodfilial(String(caixa.codfilial));
    setAtivo(caixa.ativo);
    setDialogOpen(true);
  };

  const salvarCaixa = async () => {
    if (!nome.trim() || !codfilial) {
      toast.error("Preencha o nome e selecione a filial.");
      return;
    }

    try {
      if (editando) {
        await caixaService.editarCaixa(editando.codcaixa, {
          nome,
          codfilial: Number(codfilial),
          ativo
        });
        toast.success("Caixa atualizado!");
      } else {
        await caixaService.criarCaixa({
          nome,
          codfilial: Number(codfilial)
        });
        toast.success("Caixa criado!");
      }
      setDialogOpen(false);
      carregarDados();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Erro ao salvar caixa.");
    }
  };

  if (loading) return <div className="text-sm text-gray-500">Carregando caixas...</div>;

  return (
    <div className="mt-8 border-t border-border pt-8">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-display text-xl md:text-2xl font-semibold text-primary">Gerenciamento de Caixas</h3>
          <p className="text-sm text-muted-foreground mt-1">Crie e edite os caixas (gavetas) do sistema</p>
        </div>
        <Button onClick={abrirNovo} className="bg-primary hover:bg-primary/90 flex items-center gap-2">
          <Plus size={16} /> Novo Caixa
        </Button>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Caixa</th>
              <th className="px-4 py-3 font-medium">Filial</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {caixas.map((c) => (
              <tr key={c.codcaixa} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                <td className="px-4 py-3 font-medium">{c.nome}</td>
                <td className="px-4 py-3 text-gray-600">
                  {filiais.find((f) => f.codfilial === c.codfilial)?.filial || `Filial ${c.codfilial}`}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${c.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {c.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="icon" onClick={() => abrirEditar(c)} className="text-blue-600 hover:text-blue-800 hover:bg-blue-50">
                    <Pencil size={16} />
                  </Button>
                </td>
              </tr>
            ))}
            {caixas.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                  Nenhum caixa cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? "Editar Caixa" : "Novo Caixa"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome do Caixa</Label>
              <Input placeholder="Ex: Caixa 01" value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            
            <div className="space-y-2">
              <Label>Filial</Label>
              <Select value={codfilial} onValueChange={setCodfilial}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a filial..." />
                </SelectTrigger>
                <SelectContent>
                  {filiais.map(f => (
                    <SelectItem key={f.codfilial} value={String(f.codfilial)}>{f.filial}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {editando && (
              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <Label>Caixa Ativo</Label>
                  <p className="text-xs text-gray-500">Caixas inativos não aparecerão para uso.</p>
                </div>
                <Switch checked={ativo} onCheckedChange={setAtivo} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={salvarCaixa} className="bg-primary hover:bg-primary/90">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CaixasConfig;
