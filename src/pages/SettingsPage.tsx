import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
    fastClientMode: localStorage.getItem("fastClientMode") !== "false", // default to true
    allowOutOfStockOrders: localStorage.getItem("allowOutOfStockOrders") !== "false", // default to true
    askProductSupplier: localStorage.getItem("askProductSupplier") !== "false", // default to true
    allowBuyFromAnySupplier: localStorage.getItem("allowBuyFromAnySupplier") !== "false", // default to true
    allowProductsWithoutPrice: localStorage.getItem("allowProductsWithoutPrice") === "true", // default to false
  });

  const handleSave = () => {
    localStorage.setItem("fastClientMode", String(form.fastClientMode));
    localStorage.setItem("allowOutOfStockOrders", String(form.allowOutOfStockOrders));
    localStorage.setItem("askProductSupplier", String(form.askProductSupplier));
    localStorage.setItem("allowBuyFromAnySupplier", String(form.allowBuyFromAnySupplier));
    localStorage.setItem("allowProductsWithoutPrice", String(form.allowProductsWithoutPrice));
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

        <div className="flex flex-col gap-4 border-t border-border pt-6 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Cadastro Rápido de Clientes (Modo Teste)</p>
              <p className="text-xs text-muted-foreground">Se ativo, permite cadastrar clientes exigindo apenas Nome e Telefone. Se desativado, exigirá CPF e Endereço completos.</p>
            </div>
            <Switch 
              checked={form.fastClientMode} 
              onCheckedChange={(checked) => setForm({ ...form, fastClientMode: checked })} 
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="text-sm font-medium text-foreground">Permitir Venda Sem Estoque (Modo Teste)</p>
              <p className="text-xs text-muted-foreground">Se ativo, permite adicionar produtos ao pedido mesmo que o estoque seja zero ou negativo.</p>
            </div>
            <Switch 
              checked={form.allowOutOfStockOrders} 
              onCheckedChange={(checked) => setForm({ ...form, allowOutOfStockOrders: checked })} 
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="text-sm font-medium text-foreground">Solicitar Fornecedor no Cadastro de Produto</p>
              <p className="text-xs text-muted-foreground">Se ativo, exibe o campo "Fornecedor" de forma opcional ao cadastrar ou editar um produto.</p>
            </div>
            <Switch 
              checked={form.askProductSupplier} 
              onCheckedChange={(checked) => setForm({ ...form, askProductSupplier: checked })} 
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="text-sm font-medium text-foreground">Permitir Compra de Qualquer Fornecedor</p>
              <p className="text-xs text-muted-foreground">Se ativo, ao registrar uma compra, você pode selecionar qualquer produto, mesmo que não seja daquele fornecedor.</p>
            </div>
            <Switch 
              checked={form.allowBuyFromAnySupplier} 
              onCheckedChange={(checked) => setForm({ ...form, allowBuyFromAnySupplier: checked })} 
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="text-sm font-medium text-foreground">Permitir Venda Sem Preço Cadastrado</p>
              <p className="text-xs text-muted-foreground">Se ativo, permite adicionar produtos ao pedido mesmo que eles não tenham preço na tabela comercial.</p>
            </div>
            <Switch 
              checked={form.allowProductsWithoutPrice} 
              onCheckedChange={(checked) => setForm({ ...form, allowProductsWithoutPrice: checked })} 
            />
          </div>
        </div>

        <Button onClick={handleSave}>Salvar Configurações</Button>
      </div>
    </div>
  );
};

export default SettingsPage;
