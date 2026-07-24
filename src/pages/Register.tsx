import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Mail, Phone, Calendar, Hash, Store, Shield, UserPlus, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import api from "@/services/api";
import { filiais } from "@/contexts/BranchContext";

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    nome: "",
    cpf: "",
    data_nascimento: "",
    email: "",
    telefone: "",
    login: "",
    tipo_usuario: "",
    codfilial: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSelectChange = (id: string, value: string) => {
    setFormData({ ...formData, [id]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post("/usuario", {
        nome: formData.nome,
        cpf: formData.cpf.replace(/\D/g, ""),
        data_nascimento: formData.data_nascimento,
        email: formData.email,
        telefone: formData.telefone.replace(/\D/g, ""),
        login: formData.login,
        // Senha oculta travada no termo padrão conforme regra para forçar troca posterior
        senha: "padrao", 
        tipo_usuario: formData.tipo_usuario,
        codfilial: Number(formData.codfilial) || null
      });

      toast.success("Usuário cadastrado com sucesso!");
      navigate("/");
    } catch (err: any) {
      toast.error(err.response?.data?.erro || "Falha ao registrar novo usuário.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 animate-fade-in-up">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 text-primary rounded-lg hidden sm:block">
            <UserPlus className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground font-display tracking-tight">Novo Colaborador</h1>
            <p className="text-sm text-muted-foreground mt-1">Cadastre acesso para os seus gerentes e vendedores</p>
          </div>
        </div>
        <Button variant="outline" className="shrink-0" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
      </div>

      <div className="bg-card rounded-lg border border-border p-6 sm:p-8 shadow-sm animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              
              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="nome" type="text" value={formData.nome} onChange={handleChange} className="pl-10" required />
                </div>
              </div>

              {/* Login */}
              <div className="space-y-2">
                <Label htmlFor="login">Usuário (Login)</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="login" type="text" value={formData.login} onChange={handleChange} className="pl-10" required />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" value={formData.email} onChange={handleChange} className="pl-10" required />
                </div>
              </div>

              {/* CPF */}
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="cpf" type="text" placeholder="Apenas números" value={formData.cpf} onChange={handleChange} className="pl-10" required maxLength={14} />
                </div>
              </div>

              {/* Telefone */}
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone / Celular</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="telefone" type="text" value={formData.telefone} onChange={handleChange} className="pl-10" required />
                </div>
              </div>

              {/* Data Nasc */}
              <div className="space-y-2">
                <Label htmlFor="data_nascimento">Data de Nascimento</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="data_nascimento" type="date" value={formData.data_nascimento} onChange={handleChange} className="pl-10" required />
                </div>
              </div>

              {/* Tipo Usuario */}
              <div className="space-y-2">
                <Label htmlFor="tipo_usuario">Nível de Acesso</Label>
                <div className="relative flex">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                  <Select onValueChange={(val) => handleSelectChange('tipo_usuario', val)}>
                    <SelectTrigger className="pl-10 relative">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Administrador</SelectItem>
                      <SelectItem value="VENDEDOR">Vendedor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Filial */}
              <div className="space-y-2">
                <Label htmlFor="codfilial">Filial de Destino</Label>
                <div className="relative flex">
                  <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                  <Select onValueChange={(val) => handleSelectChange('codfilial', val)}>
                    <SelectTrigger className="pl-10 relative">
                      <SelectValue placeholder="Selecione a unidade..." />
                    </SelectTrigger>
                    <SelectContent>
                      {filiais.map((f) => (
                        <SelectItem key={f.id} value={String(f.id)}>
                          {f.rotulo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

            </div>

            <div className="pt-4 flex justify-end">
              <Button type="button" variant="outline" className="mr-3" onClick={() => navigate("/")}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Registrando..." : "Cadastrar Colaborador"}
              </Button>
            </div>
          </form>
        </div>
    </div>
  );
};

export default Register;
