import KpiCard from "@/components/KpiCard";
import SalesChart from "@/components/SalesChart";
import RecentOrders from "@/components/RecentOrders";
import TopProducts from "@/components/TopProducts";
import StockAlert from "@/components/StockAlert";
import { orders, products, getProductStock } from "@/data/mockData";
import { useBranch } from "@/contexts/BranchContext";

const Dashboard = () => {
  const { selectedBranch, branchLabel } = useBranch();
  const today = "2026-03-11";

  const filteredOrders = orders.filter((o) => selectedBranch === "todas" || o.branch === selectedBranch);
  const todayOrders = filteredOrders.filter((o) => o.date === today);
  const todaySales = todayOrders.reduce((s, o) => s + o.total, 0);
  const monthSales = filteredOrders.reduce((s, o) => s + o.total, 0);
  const lowStock = products.filter((p) => {
    const s = getProductStock(p, selectedBranch);
    return s <= p.minStock;
  });
  const pendingOrders = filteredOrders.filter((o) => o.status === "aguardando");

  return (
    <div className="flex gap-6 flex-col xl:flex-row">
      <div className="flex-1 flex flex-col gap-6 min-w-0">
        <div className="animate-fade-in-up animate-delay-1">
          <h2 className="font-display text-2xl md:text-3xl font-semibold text-primary">
            Dashboard
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {branchLabel} — Março 2026
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <KpiCard label="Vendas Hoje" value={`R$ ${todaySales.toLocaleString("pt-BR")}`} change={`${todayOrders.length} pedidos`} positive delay="animate-delay-2" />
          <KpiCard label="Vendas do Mês" value={`R$ ${monthSales.toLocaleString("pt-BR")}`} change="+12,4% vs mês anterior" positive delay="animate-delay-2" />
          <KpiCard label="Pedidos Hoje" value={String(todayOrders.length)} change={`${filteredOrders.length} no mês`} positive delay="animate-delay-2" />
          <KpiCard label="Estoque Baixo" value={String(lowStock.length)} change="itens precisam reposição" positive={false} delay="animate-delay-3" />
          <KpiCard label="Aguardando Pgto" value={String(pendingOrders.length)} change="pedidos pendentes" positive={false} delay="animate-delay-3" />
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
