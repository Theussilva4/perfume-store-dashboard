import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '@/services/api';

import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from '@/contexts/AuthContext';
import { useBranch } from '@/contexts/BranchContext';

interface ContaReceber {
  id: number;
  codcliente: number;
  codfilial: number;
  numpedido: number | null;
  valor_total: string | number;
  valor_pago: string | number;
  data_emissao: string;
  data_vencimento: string | null;
  status: 'PENDENTE' | 'PARCIAL' | 'PAGO' | 'CANCELADO';
  observacoes: string | null;
  mscliente: {
    nome: string;
    cpf_cnpj: string | null;
  };
  pagamentos: Pagamento[];
}

interface Pagamento {
  id: number;
  valor_pago: string | number;
  data_pagamento: string;
  msusuario: {
    nome: string;
  } | null;
}

export default function AccountsReceivable() {
  const { user } = useAuth();
  const { selectedBranch } = useBranch();
  
  const [contas, setContas] = useState<ContaReceber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal de Baixa
  const [baixaModalOpen, setBaixaModalOpen] = useState(false);
  const [contaSelecionada, setContaSelecionada] = useState<ContaReceber | null>(null);
  const [valorBaixa, setValorBaixa] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal Nova Conta
  const [novaContaModalOpen, setNovaContaModalOpen] = useState(false);
  const [novoClienteId, setNovoClienteId] = useState("");
  const [novoValor, setNovoValor] = useState("");
  const [novaDataVencimento, setNovaDataVencimento] = useState("");
  const [clientes, setClientes] = useState<{codcliente: number, nome: string}[]>([]);

  useEffect(() => {
    carregarContas();
    carregarClientes();
  }, [selectedBranch]);

  const carregarClientes = async () => {
    try {
      const response = await api.get('/cliente');
      if (response.data) {
        setClientes(response.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCriarConta = async () => {
    if (!novoClienteId || !novoValor) {
      toast.error("Cliente e Valor são obrigatórios.");
      return;
    }
    try {
      setIsSubmitting(true);
      await api.post('/contas-receber', {
        codcliente: parseInt(novoClienteId),
        codfilial: selectedBranch || 1,
        valor_total: parseFloat(novoValor),
        data_vencimento: novaDataVencimento || null,
        observacoes: "Conta gerada manualmente"
      });
      
      toast.success("Conta criada com sucesso!");
      setNovaContaModalOpen(false);
      setNovoClienteId("");
      setNovoValor("");
      setNovaDataVencimento("");
      carregarContas();
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.message || "Erro ao criar conta");
    } finally {
      setIsSubmitting(false);
    }
  };

  const carregarContas = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (selectedBranch) {
        params.append('codfilial', selectedBranch.toString());
      }
      
      const response = await api.get(`/contas-receber?${params.toString()}`);
      setContas(response.data);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar contas a receber");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAbrirBaixa = (conta: ContaReceber) => {
    setContaSelecionada(conta);
    const saldoDevedor = Number(conta.valor_total) - Number(conta.valor_pago);
    setValorBaixa(saldoDevedor.toFixed(2));
    setBaixaModalOpen(true);
  };

  const handleConfirmarBaixa = async () => {
    if (!contaSelecionada || !valorBaixa) return;
    
    const valor = parseFloat(valorBaixa);
    if (isNaN(valor) || valor <= 0) {
      toast.error("Informe um valor válido maior que zero.");
      return;
    }

    try {
      setIsSubmitting(true);
      
      await api.post(`/contas-receber/${contaSelecionada.id}/baixar`, {
        valor_pago: valor,
        codusur: user?.id
      });
      
      toast.success("Pagamento registrado com sucesso! O valor foi adicionado ao seu Caixa Atual.");
      setBaixaModalOpen(false);
      carregarContas();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.error || error.message || "Erro ao baixar conta");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDENTE':
        return <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200"><Clock className="w-3 h-3 mr-1" /> Pendente</Badge>;
      case 'PARCIAL':
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200"><AlertCircle className="w-3 h-3 mr-1" /> Parcial</Badge>;
      case 'PAGO':
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200"><CheckCircle2 className="w-3 h-3 mr-1" /> Pago</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const contasFiltradas = contas.filter(c => 
    c.mscliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.numpedido && c.numpedido.toString().includes(searchTerm))
  );

  const contasPendentes = contasFiltradas.filter(c => c.status === 'PENDENTE' || c.status === 'PARCIAL');
  const contasPagas = contasFiltradas.filter(c => c.status === 'PAGO');

  const formatarMoeda = (valor: string | number) => {
    return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Contas a Receber</h1>
        <p className="text-muted-foreground mt-1">Gerencie pagamentos no crediário e fiado pendentes dos seus clientes.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por cliente ou nº do pedido..." 
            className="pl-9 bg-card"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={() => setNovaContaModalOpen(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Nova Conta
        </Button>
      </div>

      <Tabs defaultValue="pendentes" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="pendentes">Pendentes / Parciais</TabsTrigger>
          <TabsTrigger value="pagas">Liquidadas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pendentes" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              <p className="text-muted-foreground p-4">Carregando contas...</p>
            ) : contasPendentes.length === 0 ? (
              <div className="col-span-full bg-card p-8 text-center rounded-lg border border-border/50">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3 opacity-50" />
                <h3 className="text-lg font-medium">Tudo em dia!</h3>
                <p className="text-muted-foreground mt-1">Nenhuma conta pendente encontrada para esta filial.</p>
              </div>
            ) : (
              contasPendentes.map((conta) => {
                const total = Number(conta.valor_total);
                const pago = Number(conta.valor_pago);
                const saldo = total - pago;

                return (
                  <Card key={conta.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <div className="h-1 w-full bg-amber-400"></div>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base font-bold">{conta.mscliente.nome}</CardTitle>
                          {conta.numpedido && (
                            <CardDescription className="flex items-center mt-1">
                              <FileText className="h-3 w-3 mr-1" /> Pedido #{conta.numpedido}
                            </CardDescription>
                          )}
                        </div>
                        {getStatusBadge(conta.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-muted/50 p-2 rounded-md">
                          <span className="text-muted-foreground block text-xs mb-1">Valor Total</span>
                          <span className="font-semibold">{formatarMoeda(total)}</span>
                        </div>
                        <div className="bg-red-50/50 p-2 rounded-md border border-red-100">
                          <span className="text-red-600/70 block text-xs mb-1 font-medium">Saldo Devedor</span>
                          <span className="font-bold text-red-600">{formatarMoeda(saldo)}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>Gerada em: {format(new Date(conta.data_emissao), "dd/MM/yyyy", { locale: ptBR })}</span>
                        </div>
                        {conta.data_vencimento && (
                          <div className={`flex items-center text-xs font-medium ${new Date(conta.data_vencimento) < new Date() ? 'text-red-500' : 'text-amber-600'}`}>
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>Vence em: {format(new Date(conta.data_vencimento), "dd/MM/yyyy", { locale: ptBR })}</span>
                          </div>
                        )}
                      </div>

                      <Button className="w-full" onClick={() => handleAbrirBaixa(conta)}>
                        Receber Pagamento
                      </Button>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="pagas" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              <p className="text-muted-foreground p-4">Carregando contas...</p>
            ) : contasPagas.length === 0 ? (
              <div className="col-span-full bg-card p-8 text-center rounded-lg border border-border/50">
                <p className="text-muted-foreground">Nenhuma conta paga encontrada.</p>
              </div>
            ) : (
              contasPagas.map((conta) => (
                <Card key={conta.id} className="overflow-hidden opacity-80 hover:opacity-100 transition-opacity">
                  <div className="h-1 w-full bg-emerald-400"></div>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base font-bold">{conta.mscliente.nome}</CardTitle>
                        {conta.numpedido && (
                          <CardDescription className="flex items-center mt-1">
                            <FileText className="h-3 w-3 mr-1" /> Pedido #{conta.numpedido}
                          </CardDescription>
                        )}
                      </div>
                      {getStatusBadge(conta.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-emerald-50 p-3 rounded-md border border-emerald-100 flex justify-between items-center">
                      <span className="text-emerald-700 font-medium text-sm">Total Pago</span>
                      <span className="font-bold text-emerald-700">{formatarMoeda(conta.valor_pago)}</span>
                    </div>
                    <div className="flex flex-col gap-1 mt-3">
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>Gerada em: {format(new Date(conta.data_emissao), "dd/MM/yyyy", { locale: ptBR })}</span>
                      </div>
                      {conta.data_vencimento && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>Vence em: {format(new Date(conta.data_vencimento), "dd/MM/yyyy", { locale: ptBR })}</span>
                        </div>
                      )}
                    </div>
                    
                    {conta.pagamentos && conta.pagamentos.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">Último Pagamento:</span><br/>
                        {format(new Date(conta.pagamentos[conta.pagamentos.length - 1].data_pagamento), "dd/MM/yyyy HH:mm")}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={baixaModalOpen} onOpenChange={setBaixaModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Receber Pagamento</DialogTitle>
            <DialogDescription>
              Informe o valor que o cliente está pagando agora. O dinheiro entrará automaticamente no seu <strong>Caixa Aberto</strong>.
            </DialogDescription>
          </DialogHeader>
          
          {contaSelecionada && (
            <div className="space-y-4 py-4">
              <div className="bg-muted p-3 rounded-md text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-muted-foreground">Cliente:</span>
                  <span className="font-medium">{contaSelecionada.mscliente.nome}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-muted-foreground">Valor Original:</span>
                  <span>{formatarMoeda(contaSelecionada.valor_total)}</span>
                </div>
                <div className="flex justify-between font-bold text-red-600 mt-2 pt-2 border-t">
                  <span>Saldo Devedor:</span>
                  <span>{formatarMoeda(Number(contaSelecionada.valor_total) - Number(contaSelecionada.valor_pago))}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="valor_baixa">Valor Recebido (R$)</Label>
                <Input
                  id="valor_baixa"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={Number(contaSelecionada.valor_total) - Number(contaSelecionada.valor_pago)}
                  value={valorBaixa}
                  onChange={(e) => setValorBaixa(e.target.value)}
                  className="text-lg font-medium"
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setBaixaModalOpen(false)} disabled={isSubmitting}>Cancelar</Button>
            <Button onClick={handleConfirmarBaixa} disabled={isSubmitting || !valorBaixa}>
              {isSubmitting ? "Registrando..." : "Confirmar Recebimento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={novaContaModalOpen} onOpenChange={setNovaContaModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Conta a Receber</DialogTitle>
            <DialogDescription>
              Crie uma conta manualmente (ex: fiados antigos ou dívidas anteriores).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select value={novoClienteId} onValueChange={setNovoClienteId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map(c => (
                    <SelectItem key={c.codcliente} value={c.codcliente.toString()}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="novo_valor">Valor Total (R$)</Label>
              <Input
                id="novo_valor"
                type="number"
                step="0.01"
                min="0.01"
                value={novoValor}
                onChange={(e) => setNovoValor(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_vencimento">Data de Vencimento (Opcional)</Label>
              <Input
                id="data_vencimento"
                type="date"
                value={novaDataVencimento}
                onChange={(e) => setNovaDataVencimento(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNovaContaModalOpen(false)} disabled={isSubmitting}>Cancelar</Button>
            <Button onClick={handleCriarConta} disabled={isSubmitting || !novoClienteId || !novoValor}>
              {isSubmitting ? "Salvando..." : "Criar Conta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
