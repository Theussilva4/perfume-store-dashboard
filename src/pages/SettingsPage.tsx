import { useState, useEffect } from "react";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import CaixasConfig from "@/components/CaixasConfig";

const SettingsPage = () => {
  const [form, setForm] = useState({
    storeName: "TassiAchando",
    phone: "(11) 99999-0000",
    pixKey: "tassiachando@email.com",
    address: "Rua Exemplo, 123 — São Paulo, SP",
    instagram: "@tassiachando",
    facebook: "",
    fastClientMode: true,
    allowOutOfStockOrders: true,
    askProductSupplier: true,
    allowBuyFromAnySupplier: true,
    allowProductsWithoutPrice: false,
    atualizacaoCustoCompra: "PERGUNTAR",
    modoCobrancaCartao: "PERCENTUAL",
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data } = await api.get("/configuracoes");
        if (data) {
          setForm({
            storeName: data.nome_loja || "",
            phone: data.telefone_loja || "",
            pixKey: data.chave_pix || "",
            address: data.endereco_loja || "",
            instagram: data.instagram_loja || "",
            facebook: data.facebook_loja || "",
            fastClientMode: data.cadastro_rapido_cliente !== false,
            allowOutOfStockOrders: data.venda_sem_estoque !== false,
            askProductSupplier: data.exigir_fornecedor !== false,
            allowBuyFromAnySupplier: data.venda_qualquer_fornecedor !== false,
            allowProductsWithoutPrice: data.venda_sem_preco === true,
            atualizacaoCustoCompra: data.atualizacao_custo_compra || "PERGUNTAR",
            modoCobrancaCartao: data.modo_cobranca_cartao || "PERCENTUAL",
          });
        }
      } catch (error) {
        console.error("Erro ao carregar configurações", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleSave = async () => {
    try {
      await api.put("/configuracoes", {
        nome_loja: form.storeName,
        telefone_loja: form.phone,
        chave_pix: form.pixKey,
        endereco_loja: form.address,
        instagram_loja: form.instagram,
        facebook_loja: form.facebook,
        cadastro_rapido_cliente: form.fastClientMode,
        venda_sem_estoque: form.allowOutOfStockOrders,
        exigir_fornecedor: form.askProductSupplier,
        venda_qualquer_fornecedor: form.allowBuyFromAnySupplier,
        venda_sem_preco: form.allowProductsWithoutPrice,
        atualizacao_custo_compra: form.atualizacaoCustoCompra,
        modo_cobranca_cartao: form.modoCobrancaCartao,
      });
      
      // Keep syncing with localStorage to not break other parts that might rely on it for now
      localStorage.setItem("storeName", form.storeName);
      localStorage.setItem("phone", form.phone);
      localStorage.setItem("pixKey", form.pixKey);
      localStorage.setItem("address", form.address);
      localStorage.setItem("instagram", form.instagram);
      localStorage.setItem("facebook", form.facebook);
      localStorage.setItem("fastClientMode", String(form.fastClientMode));
      localStorage.setItem("allowOutOfStockOrders", String(form.allowOutOfStockOrders));
      localStorage.setItem("askProductSupplier", String(form.askProductSupplier));
      localStorage.setItem("allowBuyFromAnySupplier", String(form.allowBuyFromAnySupplier));
      localStorage.setItem("allowProductsWithoutPrice", String(form.allowProductsWithoutPrice));
      localStorage.setItem("atualizacaoCustoCompra", form.atualizacaoCustoCompra);
      
      toast.success("Configurações salvas no banco de dados!");
    } catch (error) {
      console.error("Erro ao salvar configurações", error);
      toast.error("Erro ao salvar configurações no banco");
    }
  };

  if (isLoading) {
    return <div className="p-6">Carregando configurações...</div>;
  }

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

          <div className="flex items-center justify-between pt-2 border-t border-border mt-2">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Atualização de Custo (Compra)</p>
              <p className="text-xs text-muted-foreground">Como o sistema deve atualizar o custo dos produtos ao registrar uma compra com valor diferente.</p>
            </div>
            <div className="w-[300px]">
              <Select
                value={form.atualizacaoCustoCompra}
                onValueChange={(val) => setForm({ ...form, atualizacaoCustoCompra: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERGUNTAR">Perguntar Sempre</SelectItem>
                  <SelectItem value="CUSTO_MEDIO">Custo Médio Automático</SelectItem>
                  <SelectItem value="ULTIMO_CUSTO">Último Custo Automático</SelectItem>
                  <SelectItem value="MANTER">Não Atualizar (Manual)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border mt-2">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Modo de Cobrança Cartão</p>
              <p className="text-xs text-muted-foreground">Define como os juros e valores de cartão de crédito são calculados no PDV.</p>
            </div>
            <div className="w-[300px]">
              <Select
                value={form.modoCobrancaCartao}
                onValueChange={(val) => setForm({ ...form, modoCobrancaCartao: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTUAL">Acréscimo Percentual (Gross-Up)</SelectItem>
                  <SelectItem value="PRECO_FIXO">Preço Fixo de Cartão (Tabela Produto)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">Salvar Configurações</Button>
      </div>

      <CaixasConfig />
    </div>
  );
};

export default SettingsPage;
