import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DollarSign, Search, Edit2, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Tabela de Preços</h1>
          <p className="text-muted-foreground">Gerencie os preços base e acompanhe a rentabilidade</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Produtos e Precificação</CardTitle>
              <CardDescription>Consulte e altere o preço base dos seus produtos</CardDescription>
            </div>
            <div className="relative w-72">
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
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Custo</TableHead>
                  <TableHead className="text-right">Preço Base</TableHead>
                  <TableHead className="text-center">Margem</TableHead>
                  <TableHead className="text-center">Markup</TableHead>
                  <TableHead className="text-center">Desc. Máx</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center">Carregando...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center">Nenhum produto encontrado</TableCell></TableRow>
                ) : (
                  filtered.map((p: any) => (
                    <TableRow key={p.codproduto}>
                      <TableCell className="font-medium">{p.descricao}</TableCell>
                      <TableCell className="text-right">R$ {p.precificacao.custoBase?.toFixed(2)}</TableCell>
                      <TableCell className="text-right">R$ {p.precificacao.precoBase?.toFixed(2)}</TableCell>
                      <TableCell className="text-center">{p.precificacao.margem?.toFixed(1)}%</TableCell>
                      <TableCell className="text-center">{p.precificacao.markup?.toFixed(2)}x</TableCell>
                      <TableCell className="text-center">{p.precificacao.descontoMaximo?.toFixed(1)}%</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(p)}>
                          <Edit2 className="h-4 w-4" />
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

      {/* Modal de Precificação */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent 
          className="sm:max-w-[600px]"
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
            <DialogTitle>Formação de Preço</DialogTitle>
            <DialogDescription>
              {selectedProduct?.descricao}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Preço de Custo (R$)</label>
                <Input
                  type="number"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Preço de Venda Base (R$)</label>
                <Input
                  type="number"
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
              
              <div className="grid grid-cols-3 gap-4">
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
