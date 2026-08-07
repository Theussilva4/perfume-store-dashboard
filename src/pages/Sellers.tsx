import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Edit, Plus, Search, UserMinus, UserCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { getVendedores, createVendedor, updateVendedor, updateVendedorStatus } from "@/services/vendedorService";
import type { Vendedor } from "@/services/vendedorService";
import { getFilial } from "@/services/filialService";

const Sellers = () => {
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [filtered, setFiltered] = useState<Vendedor[]>([]);
  const [filiais, setFiliais] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  
  const [editItem, setEditItem] = useState<Partial<Vendedor>>({ nome: "", cpf: "", ativo: "S" });

  useEffect(() => {
    fetchData();
    fetchFiliais();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getVendedores();
      setVendedores(data);
      setFiltered(data);
    } catch (err) {
      toast.error("Erro ao carregar vendedores");
    } finally {
      setLoading(false);
    }
  };

  const fetchFiliais = async () => {
    try {
      const data = await getFilial();
      setFiliais(data);
    } catch (err) {
      console.error("Erro ao carregar filiais", err);
    }
  };

  useEffect(() => {
    const term = search.toLowerCase();
    setFiltered(vendedores.filter(v => 
      v.nome.toLowerCase().includes(term) || 
      (v.cpf && v.cpf.includes(term)) ||
      String(v.codvendedor).includes(term)
    ));
  }, [search, vendedores]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editItem.codvendedor) {
        await updateVendedor(editItem.codvendedor, editItem);
        toast.success("Vendedor atualizado");
      } else {
        await createVendedor(editItem);
        toast.success("Vendedor criado");
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error("Erro ao salvar vendedor");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (vendedor: Vendedor) => {
    try {
      const novoStatus = vendedor.ativo === "S" ? "N" : "S";
      await updateVendedorStatus(vendedor.codvendedor, novoStatus);
      toast.success(Vendedor );
      fetchData();
    } catch (err) {
      toast.error("Erro ao alterar status");
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 text-primary rounded-lg hidden sm:block">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground font-display tracking-tight">Vendedores</h1>
            <p className="text-sm text-muted-foreground mt-1">Gerencie a equipe de vendas</p>
          </div>
        </div>
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditItem({ nome: "", cpf: "", ativo: "S" })}>
              <Plus className="mr-2 h-4 w-4" /> Novo Vendedor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editItem.codvendedor ? "Editar Vendedor" : "Novo Vendedor"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo *</Label>
                  <Input id="nome" value={editItem.nome || ""} onChange={e => setEditItem({...editItem, nome: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input id="cpf" value={editItem.cpf || ""} onChange={e => setEditItem({...editItem, cpf: e.target.value})} />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="codfilial">Filial Associada</Label>
                  <select
                    id="codfilial"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={editItem.codfilial || ""}
                    onChange={(e) => setEditItem({...editItem, codfilial: e.target.value ? Number(e.target.value) : undefined})}
                  >
                    <option value="">-- Nenhuma --</option>
                    {filiais.map(f => (
                      <option key={f.codfilial} value={f.codfilial}>{f.filial}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone / WhatsApp</Label>
                  <Input id="telefone" value={editItem.telefone || ""} onChange={e => setEditItem({...editItem, telefone: e.target.value})} />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" value={editItem.email || ""} onChange={e => setEditItem({...editItem, email: e.target.value})} />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="data_nascimento">Data de Nascimento</Label>
                  <Input id="data_nascimento" type="date" value={editItem.data_nascimento ? editItem.data_nascimento.split('T')[0] : ""} onChange={e => setEditItem({...editItem, data_nascimento: e.target.value})} />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="comissao_padrao">Comissão Padrão (%)</Label>
                  <Input id="comissao_padrao" type="number" step="0.01" value={editItem.comissao_padrao || ""} onChange={e => setEditItem({...editItem, comissao_padrao: Number(e.target.value)})} />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="meta_vendas">Meta de Vendas (R$)</Label>
                  <Input id="meta_vendas" type="number" step="0.01" value={editItem.meta_vendas || ""} onChange={e => setEditItem({...editItem, meta_vendas: Number(e.target.value)})} />
                </div>
              </div>

              <div className="border-t pt-4 mt-4 space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground">Endereço</h4>
                <div className="space-y-2">
                  <Label htmlFor="endereco">Rua, Número, Bairro</Label>
                  <Input id="endereco" value={editItem.endereco || ""} onChange={e => setEditItem({...editItem, endereco: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input id="cidade" value={editItem.cidade || ""} onChange={e => setEditItem({...editItem, cidade: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="uf">UF</Label>
                    <Input id="uf" maxLength={2} value={editItem.uf || ""} onChange={e => setEditItem({...editItem, uf: e.target.value.toUpperCase()})} />
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={submitting}>Salvar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-lg border border-border shadow-sm flex flex-col h-[calc(100vh-14rem)]">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar vendedores..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="pl-9 bg-secondary/50 border-0 focus-visible:ring-1" 
            />
          </div>
          <div className="text-sm text-muted-foreground ml-4 hidden sm:block">
            {filtered.length} {filtered.length === 1 ? 'registro' : 'registros'}
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader className="bg-secondary/50 sticky top-0 z-10 backdrop-blur-sm">
              <TableRow>
                <TableHead className="w-20">Cód</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Filial</TableHead>
                <TableHead className="w-28 text-center">Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">Carregando...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum vendedor encontrado.</TableCell></TableRow>
              ) : (
                filtered.map((v) => {
                  const filialNome = filiais.find(f => f.codfilial === v.codfilial)?.filial || "-";
                  return (
                    <TableRow key={v.codvendedor} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">{v.codvendedor}</TableCell>
                      <TableCell>
                        <div>{v.nome}</div>
                        {v.telefone && <div className="text-xs text-muted-foreground">{v.telefone}</div>}
                      </TableCell>
                      <TableCell>{v.cpf || "-"}</TableCell>
                      <TableCell>{filialNome}</TableCell>
                      <TableCell className="text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${v.ativo === 'S' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                          {v.ativo === "S" ? "Ativo" : "Inativo"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => { setEditItem(v); setModalOpen(true); }} className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => toggleStatus(v)} className={`h-8 w-8 ${v.ativo === 'S' ? 'text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-green-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'}`}>
                          {v.ativo === "S" ? <UserMinus className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default Sellers;

