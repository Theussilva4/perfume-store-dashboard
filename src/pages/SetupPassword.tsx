import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Lock } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import api from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

const SetupPassword = () => {
  const navigate = useNavigate();
  const { entrar } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (senha.length < 4) {
      return toast.error("A senha deve ter no mínimo 4 caracteres.");
    }

    if (senha !== confirmarSenha) {
      return toast.error("As senhas não coincidem!");
    }

    setLoading(true);

    try {
      // Puxamos quem é do cache temporario
      const tmpData = localStorage.getItem("tmp_usuario_setup");
      if(!tmpData) {
         toast.error("Sessão de configuração perdida. Faça login novamente.");
         navigate("/login");
         return;
      }
      
      const { token, usuario } = JSON.parse(tmpData);

      // Aqui você disparará a rota da sua API que altera a senha de fato do usuãrio
      await api.put(`/usuarios/${usuario.login || usuario.id}/senha`, {
         nova_senha: senha
      }, {
         headers: { Authorization: `Bearer ${token}` }
      });

      toast.success("Senha configurada com sucesso!");
      
      // Auto-loga no painel principal após trocar
      localStorage.removeItem("tmp_usuario_setup");
      entrar(token, usuario);
      navigate("/");

    } catch (err: any) {
      toast.error(err.response?.data?.erro || "Falha ao definir nova senha.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-lg border border-border p-8 shadow-sm animate-fade-in-up">
          <div className="flex flex-col items-center mb-8">
            <img src={logo} alt="TassiAchando" className="w-16 h-16 rounded-full mb-4" />
            <h1 className="font-display text-2xl font-semibold text-primary">Bem-vindo(a)!</h1>
            <p className="text-sm text-center text-muted-foreground mt-2">
              Você está acessando pela primeira vez com a senha padrão.
              <br/>Por segurança, cadastre a sua nova senha pessoal abaixo:
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="senha" className="text-sm text-foreground">Nova Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="senha" type={showPassword ? "text" : "password"} placeholder="Sua nova senha secreta" value={senha} onChange={(e) => setSenha(e.target.value)} className="pl-10 pr-10" required minLength={4} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmarSenha" className="text-sm text-foreground">Confirmar Nova Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="confirmarSenha" type={showPassword ? "text" : "password"} placeholder="Digite a nova senha novamente" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} className="pl-10 pr-10" required minLength={4} />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Salvando..." : "Salvar e Entrar"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SetupPassword;
