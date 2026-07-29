import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DollarSign, Search, Edit2, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import * as comercialService from "@/services/comercialService";

const Prices = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [costPrice, setCostPrice] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [maxDiscount, setMaxDiscount] = useState("");

  const { data: configuracao } = useQuery({
    queryKey: ["configuracao-comercial"],
    queryFn: comercialService.getConfiguracao
  });

  const { data: produtos = [], isLoading } = useQuery({
    queryKey: ["tabela-precos"],
    queryFn: comercialService.listarTabela
  });

  const mutationPreco = useMutation({
    mutationFn: (data: any) => comercialService.definirPreco(selectedProduct.codproduto, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tabela-precos"] });
      toast.success("Preço atualizado com sucesso");
      setIsModalOpen(false);
    },
    onError: () => toast.error("Erro ao atualizar preço")
  });

  const filtered = produtos.filter((p: any) => {
    const s = search.toLowerCase().trim();
    return (
      String(p.codproduto).includes(s) ||
      String(p.codigo_barras).includes(s) ||
      String(p.codigoBarras).includes(s) ||
      (p.descricao || "").toLowerCase().includes(s)
    );
  });

  const handleEdit = (p: any) => {
    setSelectedProduct(p);
    setCostPrice(p.precificacao.custoBase.toString() || "0");
    setSellPrice(p.precificacao.precoBase.toString() || "0");
    setMaxDiscount(p.precificacao.descontoMaximo?.toString() || "0");
    setIsModalOpen(true);
  };

  const handleSave = () => {
    mutationPreco.mutate({
      preco_custo: parseFloat(costPrice),
      preco_venda: parseFloat(sellPrice),
      desconto_maximo: parseFloat(maxDiscount || "0")
    });
  };

  // --- SIMULADOR EM TEMPO REAL ---
  const custoAtual = parseFloat(costPrice) || 0;
  const vendaAtual = parseFloat(sellPrice) || 0;
  const lucro = vendaAtual - custoAtual;
  const margem = vendaAtual > 0 ? (lucro / vendaAtual) * 100 : 0;
  const markup = custoAtual > 0 ? (vendaAtual / custoAtual) : 0;

  const margemAlvo = configuracao?.margem_alvo || 40;
  const margemMinima = configuracao?.margem_minima || 10;
  const sugestaoVenda = custoAtual > 0 ? custoAtual / (1 - (margemAlvo / 100)) : 0;

  const getStatusColor = () => {
    if (margem < margemMinima) return "text-red-500 bg-red-500/10";
    if (margem < margemAlvo) return "text-yellow-500 bg-yellow-500/10";
    return "text-green-500 bg-green-500/10";
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Tabela de Preços</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie os preços base e acompanhe a rentabilidade</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Produtos e Precificação</CardTitle>
              <CardDescription>Consulte e altere o preço base dos seus produtos</CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produto..."
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
                  <TableHead>Cód</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Custo</TableHead>
                  <TableHead>Preço Base</TableHead>
                  <TableHead>Margem</TableHead>
                  <TableHead>Markup</TableHead>
                  <TableHead>Desc. Máx</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Carregando...</TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhum produto encontrado</TableCell>
                  </TableRow>
                ) : (
                  filtered.map((p: any) => (
                    <TableRow key={p.codproduto}>
                      <TableCell className="text-xs text-muted-foreground">{p.codproduto}</TableCell>
                      <TableCell className="font-medium text-sm text-foreground">{p.descricao}</TableCell>
                      <TableCell>R$ {p.precificacao.custoBase?.toFixed(2) || "0.00"}</TableCell>
                      <TableCell className="font-bold text-primary">R$ {p.precificacao.precoBase?.toFixed(2) || "0.00"}</TableCell>
                      <TableCell>{p.precificacao.margem?.toFixed(1) || "0"}%</TableCell>
                      <TableCell>{p.precificacao.markup?.toFixed(2) || "0"}x</TableCell>
                      <TableCell>{p.precificacao.descontoMaximo?.toFixed(1) || "0"}%</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(p)} className="h-8 w-8 p-0">
                          <Edit2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile: Cards */}
          <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            {isLoading ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">Carregando...</div>
            ) : filtered.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">Nenhum produto encontrado</div>
            ) : (
              filtered.map((p: any) => (
                <div key={p.codproduto} className="bg-card rounded-lg border border-border p-5 flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-sm text-foreground">{p.descricao}</h3>
                      <p className="text-xs text-muted-foreground">Cód: {p.codproduto}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(p)} className="h-8 w-8 p-0">
                      <Edit2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="bg-muted/30 p-2 rounded">
                      <p className="text-[10px] text-muted-foreground uppercase">Custo</p>
                      <p className="font-medium text-sm">R$ {p.precificacao.custoBase?.toFixed(2) || "0.00"}</p>
                    </div>
                    <div className="bg-primary/10 p-2 rounded">
                      <p className="text-[10px] text-primary uppercase font-semibold">Preço Base</p>
                      <p className="font-bold text-sm text-primary">R$ {p.precificacao.precoBase?.toFixed(2) || "0.00"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap mt-2">
                    <Badge variant="secondary" className="text-[10px]">Mg: {p.precificacao.margem?.toFixed(1) || "0"}%</Badge>
                    <Badge variant="outline" className="text-[10px]">Mkup: {p.precificacao.markup?.toFixed(2) || "0"}x</Badge>
                    <Badge variant="outline" className="text-[10px]">Desc. Máx: {p.precificacao.descontoMaximo?.toFixed(1) || "0"}%</Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent 
          className="w-[95vw] sm:max-w-[600px] overflow-y-auto max-h-[90vh]"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Formação de Preço</DialogTitle>
            <DialogDescription>
              {selectedProduct?.descricao}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Preço de Custo (R$)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Preço de Venda Base (R$)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={sellPrice}
                  onChange={(e) => setSellPrice(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Sugestão ({margemAlvo}% alvo): <strong>R$ {sugestaoVenda.toFixed(2)}</strong>
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Desconto Máximo (%)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={maxDiscount}
                  onChange={(e) => setMaxDiscount(e.target.value)}
                  min="0"
                  max="100"
                />
              </div>
            </div>

            {/* Simulador Card */}
            <div className={`p-4 rounded-lg border ${getStatusColor()}`}>
              <div className="flex items-center gap-2 mb-3">
                {margem < margemMinima ? <TrendingDown className="h-5 w-5" /> : <TrendingUp className="h-5 w-5" />}
                <h3 className="font-semibold">Simulador de Rentabilidade</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs opacity-80 uppercase tracking-wider">Lucro Bruto</p>
                  <p className="text-xl font-bold">R$ {lucro.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs opacity-80 uppercase tracking-wider">Margem</p>
                  <p className="text-xl font-bold">{margem.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-xs opacity-80 uppercase tracking-wider">Markup</p>
                  <p className="text-xl font-bold">{markup.toFixed(2)}x</p>
                </div>
              </div>

              {margem < margemMinima && (
                <div className="mt-3 flex items-start gap-2 text-sm bg-red-500/20 text-red-700 dark:text-red-300 p-2 rounded">
                  <AlertTriangle className="h-4 w-4 mt-0.5" />
                  <p>
                    <strong>Atenção:</strong> Esta margem está abaixo do limite mínimo da empresa ({margemMinima}%). 
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar Preço</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Prices;
