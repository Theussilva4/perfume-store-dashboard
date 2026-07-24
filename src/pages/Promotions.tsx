import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Percent, Search, Plus, Trash2, Calendar, Tags } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import * as comercialService from "@/services/comercialService";

const Promotions = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [nome, setNome] = useState("");
  const [tipoGeral, setTipoGeral] = useState("PERCENTUAL");
  const [valorGeral, setValorGeral] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [prioridade, setPrioridade] = useState("1");
  const [itens, setItens] = useState<any[]>([]);

  // Para adicionar item na lista
  const [selectedProductId, setSelectedProductId] = useState("");

  const { data: configuracao } = useQuery({
    queryKey: ["configuracao-comercial"],
    queryFn: comercialService.getConfiguracao
  });

  const { data: promocoes = [], isLoading } = useQuery({
    queryKey: ["promocoes"],
    queryFn: comercialService.listarPromocoes
  });

  const { data: produtos = [] } = useQuery({
    queryKey: ["tabela-precos"],
    queryFn: comercialService.listarTabela
  });

  const mutationCriar = useMutation({
    mutationFn: (data: any) => comercialService.criarPromocao(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promocoes"] });
      toast.success("Promoção criada com sucesso!");
      setIsModalOpen(false);
      resetForm();
    },
    onError: () => toast.error("Erro ao criar promoção")
  });

  const mutationDeletar = useMutation({
    mutationFn: (id: string) => comercialService.deletarPromocao(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promocoes"] });
      toast.success("Promoção removida!");
    }
  });

  const resetForm = () => {
    setNome("");
    setTipoGeral("PERCENTUAL");
    setValorGeral("");
    setDataInicio("");
    setDataFim("");
    setPrioridade("1");
    setItens([]);
    setSelectedProductId("");
  };

  const handleAddItem = () => {
    if (!selectedProductId) return;
    const p = produtos.find((x: any) => x.codproduto.toString() === selectedProductId);
    if (!p) return;
    
    // Evitar duplicidade
    if (itens.find(i => i.codproduto === p.codproduto)) return;

    setItens([...itens, { ...p, tipo_opcional: "", valor_opcional: "" }]);
    setSelectedProductId("");
  };

  const handleRemoveItem = (codproduto: number) => {
    setItens(itens.filter(i => i.codproduto !== codproduto));
  };

  const handleSave = () => {
    if (!nome || !dataInicio || !dataFim || !valorGeral) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    mutationCriar.mutate({
      nome,
      tipo_geral: tipoGeral,
      valor_geral: valorGeral,
      data_inicio: dataInicio,
      data_fim: dataFim,
      prioridade,
      itens: itens.map(i => ({
        codproduto: i.codproduto,
        tipo_opcional: i.tipo_opcional || null,
        valor_opcional: i.valor_opcional || null
      }))
    });
  };

  const filtered = promocoes.filter((p: any) => 
    p.nome.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Promoções</h1>
          <p className="text-muted-foreground">Crie campanhas e regras de desconto</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Promoção
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Campanhas Ativas</CardTitle>
              <CardDescription>Gerencie suas regras de negócio e descontos programados</CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar campanha..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campanha</TableHead>
                  <TableHead>Regra</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead className="text-center">Prioridade</TableHead>
                  <TableHead className="text-center">Qtd. Itens</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center">Carregando...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center">Nenhuma campanha encontrada</TableCell></TableRow>
                ) : (
                  filtered.map((p: any) => (
                    <TableRow key={p.codpromocao}>
                      <TableCell className="font-medium">{p.nome}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1">
                          <Tags className="h-3 w-3 text-muted-foreground" />
                          {p.tipo_geral === "PERCENTUAL" ? `${p.valor_geral}%` : `R$ ${p.valor_geral}`}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(p.data_inicio).toLocaleDateString()} - {new Date(p.data_fim).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="px-2 py-1 rounded bg-secondary text-secondary-foreground text-xs font-medium">
                          Nível {p.prioridade}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">{p.itens?.length || 0}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => mutationDeletar.mutate(p.codpromocao)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal Nova Promoção */}
      <Dialog open={isModalOpen} onOpenChange={(open) => {
        setIsModalOpen(open);
        if(!open) resetForm();
      }}>
        <DialogContent 
          className="max-w-4xl max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => {
            e.preventDefault();
            if (window.confirm("Você tem um formulário em andamento. Deseja realmente fechar sem salvar?")) {
              setIsModalOpen(false);
            }
          }}
          onEscapeKeyDown={(e) => {
            e.preventDefault();
            if (window.confirm("Você tem um formulário em andamento. Deseja realmente fechar sem salvar?")) {
              setIsModalOpen(false);
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>Nova Campanha Promocional</DialogTitle>
            <DialogDescription>
              Configure as regras gerais e adicione os produtos participantes.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {/* Informações Gerais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-muted/30 p-4 rounded-lg border">
              <div className="space-y-2 lg:col-span-2">
                <label className="text-sm font-medium">Nome da Campanha</label>
                <Input placeholder="Ex: Black Friday 2026" value={nome} onChange={(e) => setNome(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Prioridade</label>
                <Input type="number" min="1" value={prioridade} onChange={(e) => setPrioridade(e.target.value)} placeholder="Maior = Mais importante" />
              </div>
              <div className="space-y-2 lg:col-span-1">
                <label className="text-sm font-medium">Regra Geral</label>
                <div className="flex gap-2">
                  <Select value={tipoGeral} onValueChange={setTipoGeral}>
                    <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTUAL">%</SelectItem>
                      <SelectItem value="VALOR_FIXO">R$ -</SelectItem>
                      <SelectItem value="PRECO_FIXO">R$ =</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input type="number" placeholder="Valor" value={valorGeral} onChange={(e) => setValorGeral(e.target.value)} className="flex-1" />
                </div>
              </div>
              <div className="space-y-2 lg:col-span-2">
                <label className="text-sm font-medium">Período</label>
                <div className="flex items-center gap-2">
                  <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
                  <span className="text-muted-foreground">até</span>
                  <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Adição de Produtos */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b pb-2">Produtos Participantes</h3>
              <div className="flex gap-2">
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Selecione um produto..." /></SelectTrigger>
                  <SelectContent>
                    {produtos.map((p: any) => (
                      <SelectItem key={p.codproduto} value={p.codproduto.toString()}>{p.descricao} - (Base: R$ {p.precificacao?.precoBase?.toFixed(2)})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="secondary" onClick={handleAddItem} disabled={!selectedProductId}>Adicionar</Button>
              </div>

              {itens.length > 0 && (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead className="text-right">Custo / Base</TableHead>
                        <TableHead className="text-center">Regra Específica</TableHead>
                        <TableHead className="text-center w-48">Simulador (Margem)</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {itens.map((item, index) => {
                        const custo = item.precificacao.custoBase || 0;
                        const base = item.precificacao.precoBase || 0;
                        
                        // Calculo ao vivo para este item
                        const tipo = item.tipo_opcional || tipoGeral;
                        const valor = parseFloat(item.valor_opcional || valorGeral) || 0;
                        
                        let precoFinal = base;
                        if(tipo === "PERCENTUAL") precoFinal = base - (base * (valor/100));
                        if(tipo === "VALOR_FIXO") precoFinal = base - valor;
                        if(tipo === "PRECO_FIXO") precoFinal = valor;
                        if(precoFinal < 0) precoFinal = 0;

                        const lucro = precoFinal - custo;
                        const margem = precoFinal > 0 ? (lucro / precoFinal) * 100 : 0;
                        const margemMinima = configuracao?.margem_minima || 10;
                        
                        const isPerigo = margem < margemMinima;

                        return (
                          <TableRow key={item.codproduto}>
                            <TableCell className="font-medium text-xs">{item.descricao}</TableCell>
                            <TableCell className="text-right text-xs text-muted-foreground">
                              C: {custo.toFixed(2)}<br/>B: {base.toFixed(2)}
                            </TableCell>
                            <TableCell>
                               <div className="flex gap-1 justify-center">
                                <Select 
                                  value={item.tipo_opcional || ""} 
                                  onValueChange={(val) => {
                                    const newItens = [...itens];
                                    newItens[index].tipo_opcional = val;
                                    setItens(newItens);
                                  }}>
                                  <SelectTrigger className="w-20 h-8 text-xs"><SelectValue placeholder="Geral" /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="PERCENTUAL">%</SelectItem>
                                    <SelectItem value="VALOR_FIXO">R$ -</SelectItem>
                                    <SelectItem value="PRECO_FIXO">R$ =</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Input 
                                  className="w-20 h-8 text-xs" 
                                  placeholder="Geral"
                                  type="number"
                                  value={item.valor_opcional}
                                  onChange={(e) => {
                                    const newItens = [...itens];
                                    newItens[index].valor_opcional = e.target.value;
                                    setItens(newItens);
                                  }}
                                />
                               </div>
                            </TableCell>
                            <TableCell>
                              <div className={`p-2 rounded text-center text-xs border ${isPerigo ? "bg-red-500/10 border-red-500/50 text-red-600" : "bg-green-500/10 border-green-500/50 text-green-600"}`}>
                                <div className="font-bold">Final: R$ {precoFinal.toFixed(2)}</div>
                                <div>Mg: {margem.toFixed(1)}%</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleRemoveItem(item.codproduto)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar Campanha</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Promotions;
