import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Mail, Phone, Calendar, Hash, Store, Shield } from "lucide-react";
import { toast } from "sonner";
import api from "@/services/api";

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
      await api.post("/usuarios", {
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
    <div className="w-full max-w-4xl mx-auto animate-fade-in-up">
      <div className="mb-6">
        <h2 className="font-display text-2xl font-semibold text-primary">Novo Usuário</h2>
        <p className="text-sm text-muted-foreground mt-1">Crie acesso para os seus Colaboradores e Vendedores</p>
      </div>

      <div className="bg-card rounded-lg border border-border p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
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

              {/* Cod. Filial */}
              <div className="space-y-2">
                <Label htmlFor="codfilial">Código da Filial Destino</Label>
                <div className="relative">
                  <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="codfilial" type="number" placeholder="Ex: 1" value={formData.codfilial} onChange={handleChange} className="pl-10" required />
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
