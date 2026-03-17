import KpiCard from "@/components/KpiCard";
import SalesChart from "@/components/SalesChart";
import RecentOrders from "@/components/RecentOrders";
import TopProducts from "@/components/TopProducts";
import StockAlert from "@/components/StockAlert";
import { pedidos, produtos, obterEstoqueProduto } from "@/data/mockData";
import { useBranch } from "@/contexts/BranchContext";

const Dashboard = () => {
  const { filialSelecionada, rotuloFilial } = useBranch();
  const hoje = "2026-03-11";

  const pedidosFiltrados = pedidos.filter((o) => filialSelecionada === "todas" || o.filial === filialSelecionada);
  const pedidosHoje = pedidosFiltrados.filter((o) => o.data === hoje);
  const vendasHoje = pedidosHoje.reduce((s, o) => s + o.total, 0);
  const vendasMes = pedidosFiltrados.reduce((s, o) => s + o.total, 0);
  const estoqueBaixo = produtos.filter((p) => {
    const s = obterEstoqueProduto(p, filialSelecionada);
    return s <= p.estoqueMinimo;
  });
  const pedidosPendentes = pedidosFiltrados.filter((o) => o.status === "aguardando");

  return (
    <div className="flex gap-6 flex-col xl:flex-row">
      <div className="flex-1 flex flex-col gap-6 min-w-0">
        <div className="animate-fade-in-up animate-delay-1">
          <h2 className="font-display text-2xl md:text-3xl font-semibold text-primary">Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-1">{rotuloFilial} — Março 2026</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <KpiCard label="Vendas Hoje" value={`R$ ${vendasHoje.toLocaleString("pt-BR")}`} change={`${pedidosHoje.length} pedidos`} positive delay="animate-delay-2" />
          <KpiCard label="Vendas do Mês" value={`R$ ${vendasMes.toLocaleString("pt-BR")}`} change="+12,4% vs mês anterior" positive delay="animate-delay-2" />
          <KpiCard label="Pedidos Hoje" value={String(pedidosHoje.length)} change={`${pedidosFiltrados.length} no mês`} positive delay="animate-delay-2" />
          <KpiCard label="Estoque Baixo" value={String(estoqueBaixo.length)} change="itens precisam reposição" positive={false} delay="animate-delay-3" />
          <KpiCard label="Aguardando Pgto" value={String(pedidosPendentes.length)} change="pedidos pendentes" positive={false} delay="animate-delay-3" />
        </div>

        <SalesChart />
        <StockAlert />
      </div>

      <div className="w-full xl:w-80 flex-shrink-0 flex flex-col gap-6">
        <RecentOrders />
        <TopProducts />
      </div>
    </div>
  );
};

export default Dashboard;
