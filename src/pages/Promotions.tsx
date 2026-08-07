import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Percent, Search, Plus, Trash2, Calendar, Tags, Eye, Pencil } from "lucide-react";
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
  const [isViewing, setIsViewing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

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

  const mutationEditar = useMutation({
    mutationFn: (data: { codpromocao: number, payload: any }) => comercialService.updatePromocao(data.codpromocao, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promocoes"] });
      toast.success("Promoção atualizada com sucesso!");
      setIsModalOpen(false);
      resetForm();
    },
    onError: () => toast.error("Erro ao atualizar promoção")
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
    setIsViewing(false);
    setEditingId(null);
  };

  const abrirModal = (promocao: any, viewOnly: boolean = false) => {
    setNome(promocao.nome);
    setTipoGeral(promocao.tipo_geral);
    setValorGeral(promocao.valor_geral.toString());
    setDataInicio(new Date(promocao.data_inicio).toISOString().split("T")[0]);
    setDataFim(new Date(promocao.data_fim).toISOString().split("T")[0]);
    setPrioridade(promocao.prioridade.toString());
    
    // Map items
    const itensMapeados = promocao.itens.map((item: any) => {
      const p = produtos.find((x: any) => x.codproduto === item.codproduto);
      return {
        ...p,
        tipo_opcional: item.tipo_opcional || "",
        valor_opcional: item.valor_opcional ? item.valor_opcional.toString() : ""
      };
    }).filter((i: any) => i.codproduto); // filter out undefined if product was deleted
    
    setItens(itensMapeados);
    setEditingId(promocao.codpromocao);
    setIsViewing(viewOnly);
    setIsModalOpen(true);
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
    const payload = {
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
    };

    if (editingId) {
      mutationEditar.mutate({ codpromocao: editingId, payload });
    } else {
      mutationCriar.mutate(payload);
    }
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
          {/* VISÃO MOBILE */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {isLoading ? (
              <div className="text-center p-4 text-muted-foreground">Carregando...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center p-4 text-muted-foreground">Nenhuma campanha encontrada</div>
            ) : (
              filtered.map((p: any) => (
                <div key={p.codpromocao} className="bg-background border border-border rounded-lg p-4 space-y-3 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-foreground text-sm">{p.nome}</h4>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(p.data_inicio).toLocaleDateString()} - {new Date(p.data_fim).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="px-2 py-1 rounded bg-secondary text-secondary-foreground text-xs font-medium">
                      Nível {p.prioridade}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
                    <span className="inline-flex items-center gap-1 font-medium">
                      <Tags className="h-3 w-3 text-muted-foreground" />
                      {p.tipo_geral === "PERCENTUAL" ? `${p.valor_geral}%` : `R$ ${p.valor_geral}`}
                    </span>
                    <span className="text-muted-foreground text-xs">{p.itens?.length || 0} produtos</span>
                  </div>
                  
                  <div className="flex justify-end pt-2 gap-1 border-t border-border mt-2">
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-primary" onClick={() => abrirModal(p, true)}>
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-primary" onClick={() => abrirModal(p, false)}>
                      <Pencil className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-destructive hover:bg-destructive/10" onClick={() => mutationDeletar.mutate(p.codpromocao)}>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Excluir
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* VISÃO DESKTOP */}
          <div className="hidden md:block rounded-md border overflow-x-auto">
            <Table className="whitespace-nowrap">
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
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => abrirModal(p, true)} title="Ver Detalhes">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => abrirModal(p, false)} title="Editar Campanha">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => mutationDeletar.mutate(p.codpromocao)} title="Excluir">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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
          className="w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>{isViewing ? "Detalhes da Campanha" : editingId ? "Editar Campanha" : "Nova Campanha Promocional"}</DialogTitle>
            <DialogDescription>
              {isViewing ? "Apenas visualização das regras da campanha." : "Configure as regras gerais e adicione os produtos participantes."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {/* Informações Gerais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-muted/30 p-4 rounded-lg border">
              <div className="space-y-2 lg:col-span-2">
                <label className="text-sm font-medium">Nome da Campanha</label>
                <Input placeholder="Ex: Black Friday 2026" value={nome} onChange={(e) => setNome(e.target.value)} disabled={isViewing} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Prioridade</label>
                <Input type="number" min="1" value={prioridade} onChange={(e) => setPrioridade(e.target.value)} placeholder="Maior = Mais importante" disabled={isViewing} />
              </div>
              <div className="space-y-2 lg:col-span-1">
                <label className="text-sm font-medium">Regra Geral</label>
                <div className="flex gap-2">
                  <Select value={tipoGeral} onValueChange={setTipoGeral} disabled={isViewing}>
                    <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTUAL">%</SelectItem>
                      <SelectItem value="VALOR_FIXO">R$ -</SelectItem>
                      <SelectItem value="PRECO_FIXO">R$ =</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input type="number" step="0.01" placeholder="Valor" value={valorGeral} onChange={(e) => setValorGeral(e.target.value)} className="flex-1" disabled={isViewing} />
                </div>
              </div>
              <div className="space-y-2 lg:col-span-2">
                <label className="text-sm font-medium">Período</label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} disabled={isViewing} />
                  <span className="text-muted-foreground hidden sm:inline">até</span>
                  <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} disabled={isViewing} />
                </div>
              </div>
            </div>

            {/* Adição de Produtos */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b pb-2">Produtos Participantes</h3>
              
              {!isViewing && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Selecione um produto..." /></SelectTrigger>
                    <SelectContent>
                      {produtos.map((p: any) => (
                        <SelectItem key={p.codproduto} value={p.codproduto.toString()}>{p.descricao} - (Base: R$ {Number(p.precificacao?.precoBase || 0).toFixed(2)})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="secondary" onClick={handleAddItem} disabled={!selectedProductId}>Adicionar</Button>
                </div>
              )}

              {itens.length > 0 && (
                <>
                  {/* MOBILE VIEW */}
                  <div className="grid grid-cols-1 gap-3 md:hidden">
                    {itens.map((item, index) => {
                      const custo = item.precificacao.custoBase || 0;
                      const base = item.precificacao.precoBase || 0;
                      
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
                        <div key={item.codproduto} className="bg-background p-3 rounded-lg border border-border shadow-sm flex flex-col gap-3">
                          <div className="flex justify-between items-start">
                             <div>
                               <div className="font-medium text-sm">{item.descricao}</div>
                               <div className="text-xs text-muted-foreground mt-1">C: R$ {custo.toFixed(2)} | B: R$ {base.toFixed(2)}</div>
                             </div>
                             {!isViewing && (
                               <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={() => handleRemoveItem(item.codproduto)}>
                                 <Trash2 className="h-4 w-4" />
                               </Button>
                             )}
                          </div>
                          
                          <div className="flex gap-2 items-center">
                            <span className="text-xs font-medium text-muted-foreground w-12">Regra:</span>
                            <Select 
                              value={item.tipo_opcional || ""} 
                              disabled={isViewing}
                              onValueChange={(val) => {
                                const newItens = [...itens];
                                newItens[index].tipo_opcional = val;
                                setItens(newItens);
                              }}>
                              <SelectTrigger className="flex-1 h-8 text-xs"><SelectValue placeholder="Geral" /></SelectTrigger>
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
                              step="0.01"
                              disabled={isViewing}
                              value={item.valor_opcional}
                              onChange={(e) => {
                                const newItens = [...itens];
                                newItens[index].valor_opcional = e.target.value;
                                setItens(newItens);
                              }}
                            />
                          </div>
                          
                          <div className={`p-2 rounded text-center text-xs border ${isPerigo ? "bg-red-500/10 border-red-500/50 text-red-600" : "bg-green-500/10 border-green-500/50 text-green-600"}`}>
                            <div className="font-bold">Final: R$ {precoFinal.toFixed(2)}</div>
                            <div>Margem: {margem.toFixed(1)}%</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* DESKTOP VIEW */}
                  <div className="hidden md:block rounded-md border overflow-x-auto">
                    <Table className="whitespace-nowrap">
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
                                    disabled={isViewing}
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
                                    step="0.01"
                                    disabled={isViewing}
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
                                {!isViewing && (
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleRemoveItem(item.codproduto)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              {isViewing ? "Fechar" : "Cancelar"}
            </Button>
            {!isViewing && (
              <Button onClick={handleSave}>{editingId ? "Salvar Alterações" : "Salvar Campanha"}</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Promotions;
