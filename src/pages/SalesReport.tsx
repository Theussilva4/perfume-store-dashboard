import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays, startOfMonth, endOfMonth, endOfDay } from "date-fns";
import { Search, Printer, Download, Filter, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { getFaturamentoProduto } from "@/services/relatoriosService";

const SalesReport = () => {
  const [dataInicial, setDataInicial] = useState<string>(
    format(startOfMonth(new Date()), "yyyy-MM-dd")
  );
  const [dataFinal, setDataFinal] = useState<string>(
    format(endOfDay(new Date()), "yyyy-MM-dd")
  );
  const [vendedorId, setVendedorId] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [marcaId, setMarcaId] = useState("");
  const [produtoId, setProdutoId] = useState("");
  const [search, setSearch] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["relatorio-faturamento", dataInicial, dataFinal, vendedorId, clienteId, categoriaId, marcaId, produtoId],
    queryFn: () => getFaturamentoProduto({ dataInicial, dataFinal, vendedorId, clienteId, categoriaId, marcaId, produtoId })
  });

  const produtos = data?.produtos || [];
  const resumo = data?.resumo || { faturamentoGeral: 0 };

  const filtered = produtos.filter((p: any) => {
    const s = search.toLowerCase().trim();
    return (
      String(p.codigo).includes(s) ||
      (p.descricao || "").toLowerCase().includes(s)
    );
  });

  const totais = filtered.reduce((acc: any, p: any) => {
    acc.qtClientes += p.qtClientes; // Aproximado
    acc.qtFaturada += p.qtFaturada;
    acc.vlFaturado += p.vlFaturado;
    acc.lucroValor += p.lucroValor;
    return acc;
  }, { qtClientes: 0, qtFaturada: 0, vlFaturado: 0, lucroValor: 0 });

  const totalLucroPct = totais.vlFaturado > 0 ? (totais.lucroValor / totais.vlFaturado) * 100 : 0;

  const handleImprimir = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground flex items-center gap-2">
            <FileText className="h-7 w-7 text-primary" />
            Apuração de Vendas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Análise detalhada de vendas, giro e lucro por produto.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsFilterOpen(!isFilterOpen)}>
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <Button variant="outline" onClick={handleImprimir} className="print:hidden">
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </div>

      {isFilterOpen && (
        <Card className="print:hidden">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <label className="text-sm font-medium">Data Inicial</label>
                <Input
                  type="date"
                  value={dataInicial}
                  onChange={(e) => setDataInicial(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Data Final</label>
                <Input
                  type="date"
                  value={dataFinal}
                  onChange={(e) => setDataFinal(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Cód. Vendedor</label>
                <Input
                  type="number"
                  placeholder="Ex: 1"
                  value={vendedorId}
                  onChange={(e) => setVendedorId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Cód. Cliente</label>
                <Input
                  type="number"
                  placeholder="Ex: 10"
                  value={clienteId}
                  onChange={(e) => setClienteId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Cód. Categoria</label>
                <Input
                  type="number"
                  placeholder="Ex: 3"
                  value={categoriaId}
                  onChange={(e) => setCategoriaId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Cód. Marca</label>
                <Input
                  type="number"
                  placeholder="Ex: 5"
                  value={marcaId}
                  onChange={(e) => setMarcaId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Cód. Produto</label>
                <Input
                  type="number"
                  placeholder="Ex: 12"
                  value={produtoId}
                  onChange={(e) => setProdutoId(e.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-1 flex items-end">
                <Button onClick={() => refetch()} className="w-full">
                  Aplicar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="print:hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Listagem de Produtos</CardTitle>
              <CardDescription>
                {filtered.length} produtos listados no período
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por código ou descrição..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto print:overflow-visible">
            <Table className="text-xs print:text-[10px]">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold text-center w-[50px]">Seq.</TableHead>
                  <TableHead className="font-semibold w-[80px]">Código</TableHead>
                  <TableHead className="font-semibold min-w-[200px]">Descrição</TableHead>
                  <TableHead className="font-semibold text-center" title="Qtde Clientes Positivados">Qt. Cli. Pos.</TableHead>
                  <TableHead className="font-semibold text-right">Qt. Vendida</TableHead>
                  <TableHead className="font-semibold text-right min-w-[100px]">Vl.Vendido (R$)</TableHead>
                  <TableHead className="font-semibold text-right">% Partic.</TableHead>
                  <TableHead className="font-semibold text-right" title="Preço Médio Unitário">Preço Méd.</TableHead>
                  <TableHead className="font-semibold text-right text-primary">% Lucro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Calculando Vendas...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Nenhum produto vendido neste período.
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {filtered.map((p: any, index: number) => (
                      <TableRow key={p.codigo} className="hover:bg-muted/30">
                        <TableCell className="text-center text-muted-foreground">{index + 1}</TableCell>
                        <TableCell>{p.codigo}</TableCell>
                        <TableCell className="font-medium truncate max-w-[250px]">{p.descricao}</TableCell>
                        <TableCell className="text-center">{p.qtClientes}</TableCell>
                        <TableCell className="text-right">{p.qtFaturada}</TableCell>
                        <TableCell className="text-right font-medium">
                          {Number(p.vlFaturado).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {Number(p.pctPartic).toFixed(2)}%
                        </TableCell>
                        <TableCell className="text-right">
                          {Number(p.precoMedio).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className={`text-right font-bold ${p.pctLucro < 10 ? 'text-red-500' : 'text-green-600'}`}>
                          {Number(p.pctLucro).toFixed(2)}%
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/80 font-bold border-t-2 border-border">
                      <TableCell colSpan={3} className="text-right">Total Geral:</TableCell>
                      <TableCell className="text-center text-muted-foreground">-</TableCell>
                      <TableCell className="text-right">{totais.qtFaturada}</TableCell>
                      <TableCell className="text-right text-primary">
                        R$ {totais.vlFaturado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right">100.00%</TableCell>
                      <TableCell className="text-right">-</TableCell>
                      <TableCell className={`text-right ${totalLucroPct < 10 ? 'text-red-500' : 'text-green-600'}`}>
                        {totalLucroPct.toFixed(2)}%
                      </TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Estilos específicos para impressão */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .animate-fade-in-up, .animate-fade-in-up * {
            visibility: visible;
            animation: none !important;
          }
          .animate-fade-in-up {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:text-\\[10px\\] {
            font-size: 10px !important;
          }
          .print\\:overflow-visible {
            overflow: visible !important;
          }
          @page {
            size: landscape;
            margin: 1cm;
          }
        }
      `}} />
    </div>
  );
};

export default SalesReport;
