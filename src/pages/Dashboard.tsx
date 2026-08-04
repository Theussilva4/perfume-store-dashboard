import { useEffect, useState } from "react";
import { getDashboardMetrics } from "@/services/dashboardService";
import { useBranch } from "@/contexts/BranchContext";
import { PackageOpen, Calendar, Filter, DollarSign, ShoppingBag, Package, TrendingUp, Users, AlertTriangle, Clock, PlusCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import ptBR from "date-fns/locale/pt-BR";

const formataMoeda = (valor: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
};

export default function Dashboard() {
  const { rotuloFilial } = useBranch();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const hoje = new Date();
  const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0];
  const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0];

  const [dataInicial, setDataInicial] = useState(primeiroDia);
  const [dataFinal, setDataFinal] = useState(ultimoDia);

  useEffect(() => {
    async function carregar() {
      setLoading(true);
      try {
        const data = await getDashboardMetrics(dataInicial, dataFinal);
        setMetrics(data);
      } catch (err) {
        console.error(err);
        toast.error("Erro ao carregar métricas do dashboard");
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, [dataInicial, dataFinal]);

  if (loading && !metrics) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Carregando painel gerencial...</div>;
  }

  if (!metrics && !loading) {
    return <div className="p-8 text-center text-red-500">Erro ao carregar dashboard.</div>;
  }

  const {
    faturamento = {},
    pedidos = {},
    ticketMedio = 0,
    lucroBrutoHoje = 0,
    kitsVendidosHoje = 0,
    topClientes = [],
    produtosSemGiro = { "30d": [], "60d": [], "90d": [] },
    clientesBase = 0,
    clientesNovosMes = 0,
    graficoVendas = [],
    maisVendidos = [],
    ultimosPedidos = [],
    estoqueBaixo = []
  } = metrics;

  return (
    <div className="space-y-6">
      {/* HEADER E FILTROS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">Painel de Gestão</h2>
          <p className="text-sm text-muted-foreground mt-1">{rotuloFilial}</p>
        </div>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span>Filtro de Período</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-auto p-4 flex flex-col gap-3">
            <div className="text-sm font-medium mb-1">Período Analisado</div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input 
                type="date" 
                value={dataInicial} 
                onChange={(e) => setDataInicial(e.target.value)}
                className="h-8 w-36 text-sm"
              />
              <span className="text-muted-foreground text-sm">até</span>
              <Input 
                type="date" 
                value={dataFinal} 
                onChange={(e) => setDataFinal(e.target.value)}
                className="h-8 w-36 text-sm"
              />
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* LINHA SUPERIOR: KPIs (O que preciso saber agora) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Faturamento */}
        <Card className="col-span-1 xl:col-span-1 border-l-4 border-l-primary shadow-sm hover:shadow-md transition-all">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Faturamento
              <DollarSign className="h-4 w-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-1">
            <div className="flex justify-between items-end">
              <span className="text-xs text-muted-foreground">Hoje:</span>
              <span className="font-bold text-lg text-primary">{formataMoeda(faturamento.hoje)}</span>
            </div>
            <div className="flex justify-between items-end border-t pt-1">
              <span className="text-xs text-muted-foreground">Mês:</span>
              <span className="font-semibold text-sm">{formataMoeda(faturamento.mes)}</span>
            </div>
            <div className="flex justify-between items-end border-t pt-1">
              <span className="text-xs text-muted-foreground">Ano:</span>
              <span className="font-semibold text-sm">{formataMoeda(faturamento.ano)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Ticket Médio */}
        <Card className="col-span-1 xl:col-span-1 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Ticket Médio Hoje
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-3xl font-bold text-primary mt-2">{formataMoeda(ticketMedio)}</div>
            <p className="text-xs text-muted-foreground mt-2">Média de gasto por pedido diário</p>
          </CardContent>
        </Card>

        {/* Pedidos */}
        <Card className="col-span-1 xl:col-span-1 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Pedidos Hoje
              <ShoppingBag className="h-4 w-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-2">
            <div className="text-3xl font-bold mt-1">{pedidos.hoje}</div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Em Aberto:</span>
              <span className="font-medium text-amber-600">{pedidos.emAberto}</span>
            </div>
            <div className="flex justify-between text-xs border-t pt-1">
              <span className="text-muted-foreground">Finalizados:</span>
              <span className="font-medium text-green-600">{pedidos.finalizados}</span>
            </div>
          </CardContent>
        </Card>

        {/* Lucro Bruto */}
        <Card className="col-span-1 xl:col-span-1 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Lucro Bruto Hoje
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-green-600 mt-2">{formataMoeda(lucroBrutoHoje)}</div>
            <p className="text-xs text-muted-foreground mt-3">Receita líquida (Venda - Custo)</p>
          </CardContent>
        </Card>

        {/* Kits */}
        <Card className="col-span-1 xl:col-span-1 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Kits Vendidos (Hoje)
              <Package className="h-4 w-4 text-purple-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-3xl font-bold text-purple-600 mt-2">{kitsVendidosHoje}</div>
            <p className="text-xs text-muted-foreground mt-2">Kits promocionais faturados</p>
          </CardContent>
        </Card>

        {/* Clientes */}
        <Card className="col-span-1 xl:col-span-1 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Clientes Base
              <Users className="h-4 w-4 text-blue-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-blue-600 mt-2">{clientesBase} Ativos</div>
            <p className="text-xs text-muted-foreground mt-3"><span className="font-semibold text-green-600">+{clientesNovosMes}</span> novos neste mês</p>
          </CardContent>
        </Card>
      </div>

      {/* PARTE INFERIOR: 2 COLUNAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* COLUNA ESQUERDA: DESEMPENHO */}
        <div className="space-y-6">
          {/* Gráfico de Vendas */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">📈 Desempenho Diário (Últimos 15 dias)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={graficoVendas} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis 
                      dataKey="data" 
                      tickFormatter={(val) => {
                        try { return format(parseISO(val), 'dd/MM'); } catch { return val; }
                      }} 
                      fontSize={12} 
                      axisLine={false} 
                      tickLine={false} 
                    />
                    <YAxis 
                      tickFormatter={(val) => `R$${(val/1000).toFixed(1)}k`} 
                      fontSize={12} 
                      axisLine={false} 
                      tickLine={false} 
                    />
                    <Tooltip 
                      formatter={(val: number) => [formataMoeda(val), 'Faturamento']}
                      labelFormatter={(label) => {
                        try { return format(parseISO(label), "dd 'de' MMMM", { locale: ptBR }); } catch { return label; }
                      }}
                    />
                    <Bar dataKey="total" fill="#0f172a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Produtos mais vendidos */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                🔥 Produtos Mais Vendidos <span className="text-sm font-normal text-muted-foreground ml-auto">(Período)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mt-2">
                {maisVendidos.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma venda no período.</p>
                ) : (
                  maisVendidos.map((p: any, i: number) => (
                    <div key={i} className="flex justify-between items-center border-b pb-2 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-muted-foreground w-4">{i + 1}º</span>
                        <span className="font-medium">{p.descricao}</span>
                      </div>
                      <span className="font-semibold text-primary bg-primary/10 px-2 py-1 rounded text-sm">
                        {p.quantidade} vendas
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Clientes */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                🏆 Top Clientes <span className="text-sm font-normal text-muted-foreground ml-auto">(Período)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mt-2">
                {topClientes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum cliente identificado no período.</p>
                ) : (
                  topClientes.map((c: any, i: number) => (
                    <div key={i} className="flex justify-between items-center border-b pb-2 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-amber-500 w-4">{i + 1}º</span>
                        <span className="font-medium">{c.nome}</span>
                      </div>
                      <span className="font-semibold text-green-600">
                        {formataMoeda(c.total)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* COLUNA DIREITA: OPERAÇÃO E ALERTA */}
        <div className="space-y-6">
          
          {/* Últimos Pedidos */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                📦 Últimos Pedidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mt-2">
                {ultimosPedidos.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum pedido recente.</p>
                ) : (
                  ultimosPedidos.map((ped: any, i: number) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-muted/40 rounded-md border">
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">Pedido #{ped.numpedido}</span>
                        <span className="text-xs text-muted-foreground">{ped.cliente}</span>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-bold">{formataMoeda(ped.valor_total)}</span>
                        <Badge variant={ped.status === 'FINALIZADO' ? 'default' : ped.status === 'CANCELADO' ? 'destructive' : 'secondary'} className="text-[10px] px-1 py-0 h-4">
                          {ped.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Produtos sem Giro */}
          <Card className="shadow-sm border-amber-200">
            <CardHeader className="pb-2 bg-amber-50/50">
              <CardTitle className="text-lg flex items-center gap-2 text-amber-800">
                💸 Produtos sem Giro (Capital Parado)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <Tabs defaultValue="30d" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="30d">{">"} 30 dias</TabsTrigger>
                  <TabsTrigger value="60d">{">"} 60 dias</TabsTrigger>
                  <TabsTrigger value="90d">{">"} 90 dias</TabsTrigger>
                </TabsList>
                
                {['30d', '60d', '90d'].map((periodo) => (
                  <TabsContent key={periodo} value={periodo}>
                    <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
                      {produtosSemGiro[periodo]?.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">Ótimo! Não há produtos parados neste período.</p>
                      ) : (
                        produtosSemGiro[periodo].map((p: any, i: number) => (
                          <div key={i} className="flex justify-between items-center text-sm border-b pb-2 last:border-0">
                            <span className="truncate flex-1 pr-2 font-medium">{p.descricao}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-muted-foreground">
                                {p.ultima_venda ? format(new Date(p.ultima_venda), 'dd/MM/yyyy') : 'Nunca'}
                              </span>
                              <Badge variant="outline" className="text-amber-600 bg-amber-50">
                                {p.saldo} un
                              </Badge>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          {/* Estoque Baixo */}
          <Card className="shadow-sm border-red-200">
            <CardHeader className="pb-2 bg-red-50/50">
              <CardTitle className="text-lg flex items-center gap-2 text-red-800">
                ⚠ Estoque Crítico
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
                {estoqueBaixo.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhum produto abaixo do estoque mínimo.</p>
                ) : (
                  estoqueBaixo.map((p: any, i: number) => (
                    <div key={i} className="flex justify-between items-center text-sm border-b pb-2 last:border-0">
                      <span className="truncate flex-1 pr-2 font-medium">{p.descricao}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">Min: {p.minimo}</span>
                        <Badge variant="destructive">
                          {p.saldo} un
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Produtos próximos do vencimento (Placeholder) */}
          <Card className="shadow-sm border-dashed border-2 bg-muted/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2 text-muted-foreground">
                ⏰ Validade e Lotes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                <Clock className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-sm font-medium">Em breve: Controle de Vencimento</p>
                <p className="text-xs text-center mt-1">Este card mostrará os lotes que expiram em 15 ou 30 dias.</p>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}