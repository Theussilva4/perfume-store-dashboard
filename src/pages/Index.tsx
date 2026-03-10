import { useState } from "react";
import SidebarNav from "@/components/SidebarNav";
import KpiCard from "@/components/KpiCard";
import SalesChart from "@/components/SalesChart";
import RecentOrders from "@/components/RecentOrders";
import TopProducts from "@/components/TopProducts";
import StockAlert from "@/components/StockAlert";

const Index = () => {
  const [activeNav, setActiveNav] = useState("overview");

  return (
    <div className="min-h-screen bg-background flex">
      <SidebarNav active={activeNav} onNavigate={setActiveNav} />

      {/* Main content */}
      <div className="ml-52 flex-1 p-8 flex gap-6">
        {/* Center column */}
        <div className="flex-1 flex flex-col gap-6 min-w-0">
          {/* Header */}
          <div className="animate-fade-in-up animate-delay-1">
            <h2 className="font-display text-3xl font-semibold text-primary">
              Visão Geral
            </h2>
            <p className="text-sm text-muted-foreground font-body mt-1">
              Março 2026
            </p>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-3 gap-4">
            <KpiCard
              label="Faturamento"
              value="R$ 284k"
              change="+12,4% vs mês anterior"
              positive
              delay="animate-delay-2"
            />
            <KpiCard
              label="Pedidos Novos"
              value="168"
              change="+8,2% vs mês anterior"
              positive
              delay="animate-delay-2"
            />
            <KpiCard
              label="Estoque Baixo"
              value="4"
              change="itens precisam reposição"
              positive={false}
              delay="animate-delay-3"
            />
          </div>

          {/* Sales Chart */}
          <SalesChart />

          {/* Stock Alert */}
          <StockAlert />
        </div>

        {/* Right column */}
        <div className="w-80 flex-shrink-0 flex flex-col gap-6">
          <RecentOrders />
          <TopProducts />
        </div>
      </div>
    </div>
  );
};

export default Index;
