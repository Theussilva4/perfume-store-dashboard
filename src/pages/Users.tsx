import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Plus, Search, UserMinus, UserCheck, Users as UsersIcon, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { getUsuarios, createUsuario, updateUsuario, Usuario } from "@/services/usuarioService";
import { getFilial } from "@/services/filialService";
import { getVendedores } from "@/services/vendedorService";

const Users = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [filtered, setFiltered] = useState<Usuario[]>([]);
  const [filiais, setFiliais] = useState<any[]>([]);
  const [vendedores, setVendedores] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  
  const [editItem, setEditItem] = useState<Partial<Usuario> & { senha?: string }>({});
  const [passwordForm, setPasswordForm] = useState({ codusur: 0, novaSenha: "", confirmarSenha: "" });

  useEffect(() => {
    fetchData();
    fetchSupportData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getUsuarios();
      setUsuarios(data);
      setFiltered(data);
    } catch (err) {
      toast.error("Erro ao carregar colaboradores");
    } finally {
      setLoading(false);
    }
  };

  const fetchSupportData = async () => {
    try {
      const filData = await getFilial();
      setFiliais(filData);
      const vendData = await getVendedores();
      setVendedores(vendData);
    } catch (err) {
      console.error("Erro ao carregar dados de suporte", err);
    }
  };

  useEffect(() => {
    const term = search.toLowerCase();
    setFiltered(usuarios.filter(u => 
      u.nome.toLowerCase().includes(term) || 
      u.login.toLowerCase().includes(term) ||
      (u.email && u.email.toLowerCase().includes(term))
    ));
  }, [search, usuarios]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editItem.codusur) {
        await updateUsuario(editItem.codusur, editItem);
        toast.success("Colaborador atualizado");
      } else {
        if (!editItem.senha) {
          toast.error("Senha é obrigatória para novos colaboradores");
          setSubmitting(false);
          return;
        }
        await createUsuario(editItem);
        toast.success("Colaborador criado");
      }
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.erro || "Erro ao salvar colaborador");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.novaSenha !== passwordForm.confirmarSenha) {
      toast.error("As senhas não coincidem");
      return;
    }
    if (passwordForm.novaSenha.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres");
      return;
    }
    
    setSubmitting(true);
    try {
      await updateUsuario(passwordForm.codusur, { senha: passwordForm.novaSenha });
      toast.success("Senha alterada com sucesso");
      setPasswordModalOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.erro || "Erro ao alterar senha");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (user: Usuario) => {
    try {
      const novoStatus = user.ativo === "S" ? "N" : "S";
      await updateUsuario(user.codusur, { ativo: novoStatus });
      toast.success(`Colaborador ${novoStatus === 'S' ? 'ativado' : 'inativado'} com sucesso`);
      fetchData();
    } catch (err) {
      toast.error("Erro ao alterar status");
    }
  };

  const openNewModal = () => {
    setEditItem({ nome: "", login: "", email: "", tipo_usuario: "VENDEDOR", ativo: "S", senha: "" });
    setModalOpen(true);
  };

  const openEditModal = (u: Usuario) => {
    setEditItem({ ...u });
    setModalOpen(true);
  };

  const openPasswordModal = (u: Usuario) => {
    setPasswordForm({ codusur: u.codusur, novaSenha: "", confirmarSenha: "" });
    setPasswordModalOpen(true);
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 text-primary rounded-lg hidden sm:block">
            <UsersIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground font-display tracking-tight">Colaboradores</h1>
            <p className="text-sm text-muted-foreground mt-1">Gerencie os usuários que acessam o sistema</p>
          </div>
        </div>
        
        <Button onClick={openNewModal}>
          <Plus className="mr-2 h-4 w-4" /> Novo Colaborador
        </Button>
      </div>

      <div className="bg-card rounded-lg border border-border shadow-sm flex flex-col h-[calc(100vh-14rem)]">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nome, login ou email..." 
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
                <TableHead className="w-20 hidden sm:table-cell">Cód</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden md:table-cell">Login</TableHead>
                <TableHead className="hidden sm:table-cell">Perfil</TableHead>
                <TableHead className="w-28 text-center">Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">Carregando...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum colaborador encontrado.</TableCell></TableRow>
              ) : (
                filtered.map((u) => (
                  <TableRow key={u.codusur} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium hidden sm:table-cell">{u.codusur}</TableCell>
                    <TableCell>
                      <div className="font-medium">{u.nome}</div>
                      <div className="text-xs text-muted-foreground md:hidden">{u.login}</div>
                      {u.email && <div className="text-xs text-muted-foreground hidden sm:block">{u.email}</div>}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{u.login}</TableCell>
                    <TableCell className="hidden sm:table-cell">{u.tipo_usuario || "VENDEDOR"}</TableCell>
                    <TableCell className="text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${u.ativo === 'S' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                        {u.ativo === "S" ? "Ativo" : "Inativo"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" title="Alterar Senha" onClick={() => openPasswordModal(u)} className="h-8 w-8 text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20">
                        <KeyRound className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Editar" onClick={() => openEditModal(u)} className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title={u.ativo === "S" ? "Inativar" : "Ativar"} onClick={() => toggleStatus(u)} className={`h-8 w-8 ${u.ativo === 'S' ? 'text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-green-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'}`}>
                        {u.ativo === "S" ? <UserMinus className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal Novo / Editar Colaborador */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem.codusur ? "Editar Colaborador" : "Novo Colaborador"}</DialogTitle>
            <DialogDescription>
              Preencha os dados do usuário para acesso ao sistema.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input id="nome" value={editItem.nome || ""} onChange={e => setEditItem({...editItem, nome: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login">Login (Usuário) *</Label>
                <Input id="login" value={editItem.login || ""} onChange={e => setEditItem({...editItem, login: e.target.value})} required disabled={!!editItem.codusur} />
              </div>
              
              {!editItem.codusur && (
                <div className="space-y-2">
                  <Label htmlFor="senha">Senha Inicial *</Label>
                  <Input id="senha" type="password" value={editItem.senha || ""} onChange={e => setEditItem({...editItem, senha: e.target.value})} required />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" value={editItem.email || ""} onChange={e => setEditItem({...editItem, email: e.target.value})} />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input id="cpf" value={editItem.cpf || ""} onChange={e => setEditItem({...editItem, cpf: e.target.value})} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input id="telefone" value={editItem.telefone || ""} onChange={e => setEditItem({...editItem, telefone: e.target.value})} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo_usuario">Perfil do Usuário</Label>
                <Select value={editItem.tipo_usuario || "VENDEDOR"} onValueChange={(val) => setEditItem({...editItem, tipo_usuario: val})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Administrador</SelectItem>
                    <SelectItem value="GERENTE">Gerente</SelectItem>
                    <SelectItem value="VENDEDOR">Vendedor</SelectItem>
                    <SelectItem value="ESTOQUE">Estoque</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="codfilial">Filial Padrão</Label>
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
                <Label htmlFor="codvendedor">Vendedor Associado</Label>
                <select
                  id="codvendedor"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={editItem.codvendedor || ""}
                  onChange={(e) => setEditItem({...editItem, codvendedor: e.target.value ? Number(e.target.value) : undefined})}
                >
                  <option value="">-- Nenhum --</option>
                  {vendedores.map(v => (
                    <option key={v.codvendedor} value={v.codvendedor}>{v.nome}</option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">Selecione caso este usuário faça pedidos.</p>
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={submitting}>Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Trocar Senha */}
      <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Trocar Senha</DialogTitle>
            <DialogDescription>
              Defina a nova senha para o colaborador.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangePassword} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="novaSenha">Nova Senha</Label>
              <Input id="novaSenha" type="password" value={passwordForm.novaSenha} onChange={e => setPasswordForm({...passwordForm, novaSenha: e.target.value})} required minLength={6} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmarSenha">Confirmar Nova Senha</Label>
              <Input id="confirmarSenha" type="password" value={passwordForm.confirmarSenha} onChange={e => setPasswordForm({...passwordForm, confirmarSenha: e.target.value})} required minLength={6} />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setPasswordModalOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={submitting}>Salvar Senha</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;
