import { useEffect, useState } from "react";
import { Truck, Plus, Search, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { getFornecedores, createFornecedor, updateFornecedor } from "@/services/fornecedorService";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface Fornecedor {
  uuid: string;
  nome: string;
  cnpj: string;
  telefone: string;
  email: string;
  contato: string;
  ativo: boolean;
}

const fornecedorVazio: Omit<Fornecedor, "uuid"> = {
  nome: "",
  cnpj: "",
  telefone: "",
  email: "",
  contato: "",
  ativo: true,
};

const Suppliers = () => {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<Omit<Fornecedor, "uuid">>(fornecedorVazio);
  const [editando, setEditando] = useState<Fornecedor | null>(null);
  const [lista, setLista] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    carregarFornecedores();
  }, []);

  const abrirNovo = () => {
    setEditando(null);
    setForm(fornecedorVazio);
    setDialogOpen(true);
  };

  const abrirEdicao = (item: Fornecedor) => {
    setEditando(item);
    setForm({ ...item });
    setDialogOpen(true);
  };

  async function carregarFornecedores() {
    try {
      setLoading(true);
      const data = await getFornecedores();
      setLista(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log(error);
      toast.error("Erro ao carregar fornecedores");
    } finally {
      setLoading(false);
    }
  }

  const limpar = (v: string) => v.replace(/\D/g, "");

  const filtrados = lista.filter((c) => {
    const termo = search.toLowerCase();
    return (
      c.nome?.toLowerCase().includes(termo) ||
      limpar(c.telefone || "").includes(limpar(search)) ||
      limpar(c.cnpj || "").includes(limpar(search)) ||
      c.email?.toLowerCase().includes(termo)
    );
  });

  const ordenados = [...filtrados].sort((a, b) =>
    (a.nome || "").localeCompare(b.nome || "")
  );

  const handleSalvar = async () => {
    if (!form.nome) {
      toast.error("Nome é obrigatório");
      return;
    }
    
    try {
      if (editando) {
        await updateFornecedor(editando.uuid, form);
        toast.success("Fornecedor atualizado!");
      } else {
        await createFornecedor(form);
        toast.success("Fornecedor criado!");
      }

      await carregarFornecedores();
      setDialogOpen(false);
      setEditando(null);
    } catch (error) {
      toast.error("Erro ao salvar fornecedor");
    }
  };

  function formatarCnpj(valor: string) {
    valor = valor.replace(/\D/g, "");
    if (valor.length <= 11) {
      return valor
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }
    return valor
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  return (
    <>
      <div className="space-y-6 animate-fade-in-up">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold text-primary">
              Fornecedores
            </h2>
            <p className="text-sm text-muted-foreground">
              {lista.length} fornecedores cadastrados
            </p>
          </div>

          <Button onClick={abrirNovo}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Fornecedor
          </Button>
        </div>

        {/* BUSCA */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" />
          <Input
            placeholder="Buscar por nome, telefone ou CNPJ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* LISTA */}
        {loading ? (
          <div className="text-center p-4">Carregando...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ordenados.map((item) => (
              <div
                key={item.uuid}
                className="bg-card rounded-lg border p-5 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {item.nome?.charAt(0)}
                    </span>
                  </div>

                  <button
                    onClick={() => abrirEdicao(item)}
                    className="p-1.5 rounded-md hover:bg-muted"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>

                <div>
                  <h3 className="font-medium text-sm">{item.nome}</h3>
                  <p className="text-xs text-muted-foreground">
                    CNPJ: {formatarCnpj(item.cnpj)}
                  </p>
                  {item.telefone && (
                    <p className="text-xs text-muted-foreground">
                      Tel: {item.telefone}
                    </p>
                  )}
                  {item.contato && (
                    <p className="text-xs text-muted-foreground">
                      Contato: {item.contato}
                    </p>
                  )}
                </div>

                <button
                  className={`text-xs py-1 rounded-md border ${
                    item.ativo
                      ? "border-primary text-primary"
                      : "border-destructive text-destructive"
                  }`}
                >
                  {item.ativo ? "Ativo" : "Inativo"}
                </button>
              </div>
            ))}
          </div>
        )}

        {!loading && ordenados.length === 0 && (
          <div className="text-center text-muted-foreground">
            <Truck className="mx-auto mb-2 opacity-30 h-10 w-10" />
            Nenhum fornecedor encontrado
          </div>
        )}
      </div>

      {/* DIALOG */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent 
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
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
            <DialogTitle>
              {editando ? "Editar Fornecedor" : "Novo Fornecedor"}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do fornecedor
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Nome</Label>
              <Input
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
              />
            </div>

            <div>
              <Label>CNPJ / CPF</Label>
              <Input
                value={formatarCnpj(form.cnpj)}
                onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
              />
            </div>

            <div>
              <Label>Telefone</Label>
              <Input
                value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: e.target.value })}
              />
            </div>

            <div className="col-span-2">
              <Label>Email</Label>
              <Input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            
            <div className="col-span-2">
              <Label>Contato (Nome da Pessoa)</Label>
              <Input
                value={form.contato}
                onChange={(e) => setForm({ ...form, contato: e.target.value })}
              />
            </div>
            
            <div className="col-span-2 flex items-center gap-2 mt-2">
              <input 
                type="checkbox" 
                checked={form.ativo} 
                onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
                id="ativoFornecedor"
              />
              <Label htmlFor="ativoFornecedor">Fornecedor Ativo</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvar}>
              {editando ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Suppliers;
