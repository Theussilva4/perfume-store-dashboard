import { useEffect, useState } from "react";
import KpiCard from "@/components/KpiCard";
import RecentOrders from "@/components/RecentOrders";
import TopProducts from "@/components/TopProducts";
import StockAlert from "@/components/StockAlert";
import { getDashboardMetrics } from "@/services/dashboardService";
import { useBranch } from "@/contexts/BranchContext";
import { PackageOpen } from "lucide-react";

const Dashboard = () => {
  const { rotuloFilial } = useBranch();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregar() {
      try {
        const data = await getDashboardMetrics();
        setMetrics(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Carregando métricas...</div>;
  }

  if (!metrics) {
    return <div className="p-8 text-center text-red-500">Erro ao carregar dashboard.</div>;
  }

  // Converter formato da API para os componentes
  const formatOrders = (metrics.ultimasVendas || []).map((o: any) => ({
    id: o.codigo_venda || o.numpedido || o.uuid,
    numero: o.codigo_venda || o.numpedido,
    nomeCliente: o.mscliente?.nome || "Não informado",
    total: Number(o.valor_total || 0),
    status: String(o.status || "aberto").toLowerCase(),
    data: new Date(o.data_pedido).toISOString().split('T')[0]
  }));

  const formatLowStock = (metrics.estoqueBaixo || []).map((p: any) => ({
    id: p.uuid,
    nome: p.descricao,
    estoque: Number(p.saldo || 0),
    estoqueMinimo: Number(p.estoque_minimo || 0),
  }));

  const formatTopProducts = (metrics.maisVendidos || []).map((p: any) => ({
    id: Math.random().toString(),
    nome: p.descricao,
    vendidos: p.quantidade
  }));

  return (
    <div className="flex gap-6 flex-col xl:flex-row">
      <div className="flex-1 flex flex-col gap-6 min-w-0">
        <div className="animate-fade-in-up animate-delay-1">
          <h2 className="font-display text-2xl md:text-3xl font-semibold text-primary">Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-1">{rotuloFilial}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard 
            label="Venda do Dia" 
            value={`R$ ${Number(metrics.vendaDia || 0).toLocaleString("pt-BR")}`} 
            change="Hoje" 
            positive 
            delay="animate-delay-2" 
          />
          <KpiCard 
            label="Venda do Mês" 
            value={`R$ ${Number(metrics.vendaMes || 0).toLocaleString("pt-BR")}`} 
            change="Mês atual" 
            positive 
            delay="animate-delay-2" 
          />
          <KpiCard 
            label="Produtos Baixo Estoque" 
            value={String((metrics.estoqueBaixo || []).length)} 
            change="itens precisam reposição" 
            positive={false} 
            delay="animate-delay-3" 
          />
          <KpiCard 
            label="Clientes Cadastrados" 
            value={String(metrics.clientesCadastrados || 0)} 
            change="ativos no sistema" 
            positive 
            delay="animate-delay-3" 
          />
        </div>

        <StockAlert produtos={formatLowStock} />
      </div>

      <div className="w-full xl:w-80 flex-shrink-0 flex flex-col gap-6">
        <RecentOrders pedidos={formatOrders} />
        
        <div className="bg-card rounded-lg border border-border p-5 h-[400px] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-foreground flex items-center gap-2">
              <PackageOpen className="h-4 w-4 text-primary" />
              Mais Vendidos (Mês)
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {formatTopProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center">Nenhum dado no mês.</p>
            ) : (
              formatTopProducts.map((p: any, i: number) => (
                <div key={i} className="flex justify-between items-center text-sm border-b pb-2 last:border-0">
                  <span className="truncate flex-1 pr-2">{p.nome}</span>
                  <span className="font-semibold text-primary">{p.vendidos} un</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
