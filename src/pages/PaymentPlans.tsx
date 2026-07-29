import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Edit2, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import * as formaPagamentoService from "@/services/formaPagamentoService";

const PaymentPlans = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form state
  const [idEdicao, setIdEdicao] = useState<number | null>(null);
  const [descricao, setDescricao] = useState("");
  const [temAcrescimo, setTemAcrescimo] = useState(false);
  const [taxaAcrescimo, setTaxaAcrescimo] = useState("");
  const [maxParcelas, setMaxParcelas] = useState("1");
  const [valorMinimoParcela, setValorMinimoParcela] = useState("0");
  const [ativo, setAtivo] = useState(true);

  const { data: planos = [], isLoading } = useQuery({
    queryKey: ["planos-pagamento"],
    queryFn: formaPagamentoService.getFormasPagamento,
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => {
      if (idEdicao) {
        return formaPagamentoService.atualizarFormaPagamento(idEdicao, data);
      }
      return formaPagamentoService.criarFormaPagamento(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planos-pagamento"] });
      toast.success(idEdicao ? "Plano atualizado com sucesso" : "Plano criado com sucesso");
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.erro || "Erro ao salvar plano");
    }
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, ativo }: { id: number, ativo: boolean }) => formaPagamentoService.alterarStatusFormaPagamento(id, ativo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planos-pagamento"] });
      toast.success("Status atualizado");
    },
    onError: () => toast.error("Erro ao atualizar status")
  });

  const filteredPlanos = useMemo(() => {
    return planos.filter((p: any) => {
      const s = search.toLowerCase();
      return (
        String(p.CODPLPAG).includes(s) || 
        (p.DESCRICAO || "").toLowerCase().includes(s)
      );
    });
  }, [planos, search]);

  const abrirNovo = () => {
    setIdEdicao(null);
    setDescricao("");
    setTemAcrescimo(false);
    setTaxaAcrescimo("");
    setMaxParcelas("1");
    setValorMinimoParcela("0");
    setAtivo(true);
    setIsModalOpen(true);
  };

  const abrirEdicao = (plano: any) => {
    setIdEdicao(plano.CODPLPAG);
    setDescricao(plano.DESCRICAO || "");
    setTemAcrescimo(plano.tem_acrescimo || false);
    setTaxaAcrescimo(plano.taxa_acrescimo?.toString() || "");
    setMaxParcelas(plano.max_parcelas?.toString() || "1");
    setValorMinimoParcela(plano.valor_minimo_parcela?.toString() || "0");
    setAtivo(plano.ATIVO === "S");
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!descricao.trim()) {
      toast.error("A descrição é obrigatória");
      return;
    }
    if (temAcrescimo && (!taxaAcrescimo || Number(taxaAcrescimo) <= 0)) {
      toast.error("Informe a taxa de acréscimo");
      return;
    }
    if (!maxParcelas || Number(maxParcelas) < 1) {
      toast.error("Número de parcelas inválido");
      return;
    }

    saveMutation.mutate({
      descricao,
      tem_acrescimo: temAcrescimo,
      taxa_acrescimo: temAcrescimo ? Number(taxaAcrescimo) : 0,
      max_parcelas: Number(maxParcelas),
      valor_minimo_parcela: Number(valorMinimoParcela) || 0,
    });
  };

  const handleToggleStatus = (plano: any, checked: boolean) => {
    statusMutation.mutate({ id: plano.CODPLPAG, ativo: checked });
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Planos de Pagamento</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie as formas e planos de pagamento disponíveis</p>
        </div>
        <Button onClick={abrirNovo} className="w-full sm:w-auto gap-2">
          <Plus className="h-4 w-4" />
          Novo Plano
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Planos Cadastrados</CardTitle>
              <CardDescription>Consulte e altere os planos do sistema</CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar plano..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Desktop: Tabela */}
          <div className="hidden md:block mt-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Cód</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Acréscimo</TableHead>
                  <TableHead>Parcelas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Carregando...</TableCell>
                  </TableRow>
                ) : filteredPlanos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum plano encontrado</TableCell>
                  </TableRow>
                ) : (
                  filteredPlanos.map((p: any) => (
                    <TableRow key={p.CODPLPAG}>
                      <TableCell className="text-muted-foreground font-medium">{p.CODPLPAG}</TableCell>
                      <TableCell className="font-semibold">{p.DESCRICAO}</TableCell>
                      <TableCell>
                        {p.tem_acrescimo ? (
                          <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-200">
                            +{Number(p.taxa_acrescimo || 0).toFixed(2)}%
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">Não</span>
                        )}
                      </TableCell>
                      <TableCell>Até {p.max_parcelas || 1}x</TableCell>
                      <TableCell>
                        <Switch 
                          checked={p.ATIVO === "S"} 
                          onCheckedChange={(checked) => handleToggleStatus(p, checked)} 
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => abrirEdicao(p)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile: Cards */}
          <div className="md:hidden grid grid-cols-1 gap-4 mt-4">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            ) : filteredPlanos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Nenhum plano encontrado</div>
            ) : (
              filteredPlanos.map((p: any) => (
                <div key={p.CODPLPAG} className="bg-card rounded-lg border border-border p-5 flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-foreground">{p.DESCRICAO}</h3>
                      <p className="text-xs text-muted-foreground">Cód: {p.CODPLPAG}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => abrirEdicao(p)} className="h-8 w-8 p-0">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="bg-muted/30 p-3 rounded flex flex-col justify-center items-center text-center">
                      <p className="text-[10px] text-muted-foreground uppercase">Acréscimo</p>
                      <p className="font-medium text-sm">
                        {p.tem_acrescimo ? `+${Number(p.taxa_acrescimo || 0).toFixed(2)}%` : "Não"}
                      </p>
                    </div>
                    <div className="bg-primary/10 p-3 rounded flex flex-col justify-center items-center text-center">
                      <p className="text-[10px] text-primary uppercase font-semibold">Parcelas</p>
                      <p className="font-bold text-sm text-primary">Até {p.max_parcelas || 1}x</p>
                      {Number(p.valor_minimo_parcela) > 0 && (
                        <p className="text-[10px] text-primary/70 font-semibold leading-tight mt-0.5">
                          Mín. R$ {Number(p.valor_minimo_parcela).toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-border pt-3 mt-1">
                    <span className="text-sm text-muted-foreground">Status do Plano</span>
                    <Switch 
                      checked={p.ATIVO === "S"} 
                      onCheckedChange={(checked) => handleToggleStatus(p, checked)} 
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              {idEdicao ? "Editar Plano de Pagamento" : "Novo Plano de Pagamento"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-5 py-4">
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input 
                placeholder="Ex: Cartão de Crédito 3x" 
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Máximo de Parcelas</Label>
                <Input 
                  type="number"
                  min="1"
                  value={maxParcelas}
                  onChange={(e) => setMaxParcelas(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Valor Mínimo (R$)</Label>
                <Input 
                  type="number"
                  min="0"
                  step="0.01"
                  value={valorMinimoParcela}
                  onChange={(e) => setValorMinimoParcela(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-md bg-muted/20">
              <div className="space-y-0.5">
                <Label>Possui Acréscimo/Juros?</Label>
                <p className="text-[11px] text-muted-foreground">Aplica taxa ao valor total do pedido</p>
              </div>
              <Switch 
                checked={temAcrescimo}
                onCheckedChange={setTemAcrescimo}
              />
            </div>

            {temAcrescimo && (
              <div className="space-y-2 animate-fade-in">
                <Label>Taxa de Acréscimo (%)</Label>
                <div className="flex items-center">
                  <Input 
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={taxaAcrescimo}
                    onChange={(e) => setTaxaAcrescimo(e.target.value)}
                  />
                  <span className="ml-2 font-bold text-muted-foreground">%</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentPlans;
