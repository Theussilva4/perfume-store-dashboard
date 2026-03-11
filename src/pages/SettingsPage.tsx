import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

const SettingsPage = () => {
  const [form, setForm] = useState({
    storeName: "TassiAchando",
    phone: "(11) 99999-0000",
    pixKey: "tassiachando@email.com",
    address: "Rua Exemplo, 123 — São Paulo, SP",
    instagram: "@tassiachando",
    facebook: "",
  });

  const handleSave = () => {
    toast.success("Configurações salvas!");
  };

  return (
    <div className="space-y-6 animate-fade-in-up max-w-2xl">
      <div>
        <h2 className="font-display text-2xl md:text-3xl font-semibold text-primary">Configurações</h2>
        <p className="text-sm text-muted-foreground mt-1">Dados da loja</p>
      </div>

      <div className="bg-card rounded-lg border border-border p-6 space-y-6">
        {/* Logo */}
        <div className="flex items-center gap-4">
          <img src={logo} alt="Logo" className="w-16 h-16 rounded-full" />
          <div>
            <p className="text-sm font-medium text-foreground">Logo da Loja</p>
            <p className="text-xs text-muted-foreground">Será exibida no painel e relatórios</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nome da Loja</Label>
            <Input value={form.storeName} onChange={(e) => setForm({ ...form, storeName: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Telefone</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Chave PIX</Label>
            <Input value={form.pixKey} onChange={(e) => setForm({ ...form, pixKey: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Instagram</Label>
            <Input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} />
          </div>
          <div className="col-span-1 sm:col-span-2 space-y-2">
            <Label>Endereço</Label>
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
        </div>

        <Button onClick={handleSave}>Salvar Configurações</Button>
      </div>
    </div>
  );
};

export default SettingsPage;
