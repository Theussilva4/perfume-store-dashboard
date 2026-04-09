import { useEffect, useState } from "react";
import KpiCard from "@/components/KpiCard";
import SalesChart from "@/components/SalesChart";
import RecentOrders from "@/components/RecentOrders";
import TopProducts from "@/components/TopProducts";
import StockAlert from "@/components/StockAlert";
import { getPedidos } from "@/services/pedidosService";
import { getProdutos } from "@/services/produtosService";
import { getCliente } from "@/services/clienteService";
import { useBranch } from "@/contexts/BranchContext";

const Dashboard = () => {
  const { filialSelecionada, rotuloFilial } = useBranch();
  
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregar() {
      try {
        const [peds, prods, clis] = await Promise.all([
          getPedidos(),
          getProdutos(),
          getCliente()
        ]);
        
        const pTratados = (peds || []).map((p: any) => ({
          ...p,
          id: p.numpedido || p.numero || p.id || Math.random(),
          status: String(p.status || "aberto").toLowerCase(),
          codfilial: p.codfilial || p.filial,
          data: p.data_pedido ? new Date(p.data_pedido).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          total: Number(p.valor_total || 0),
          nomeCliente: (clis || []).find((c:any) => String(c.codcliente) === String(p.codcliente))?.nome || 'Cliente Desconhecido'
        }));

        setPedidos(pTratados);
        setProdutos(prods || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, []);

  const hoje = new Date().toISOString().split('T')[0];

  const pedidosFiltrados = pedidos.filter((o) => filialSelecionada === "todas" || String(o.codfilial) === String(filialSelecionada));
  const pedidosHoje = pedidosFiltrados.filter((o) => o.data === hoje);
  const vendasHoje = pedidosHoje.reduce((s, o) => s + o.total, 0);
  const vendasMes = pedidosFiltrados.reduce((s, o) => s + o.total, 0);

  const estoqueBaixo = produtos.filter((p) => {
     // Estimativa provisória de leitura de estoque por fallback caso a API detalhada de estoque individualize
     const s = Number(p.estoque ?? p.quantidade ?? 0);
     return s <= Number(p.estoqueMinimo || 5);
  });
  
  const pedidosPendentes = pedidosFiltrados.filter((o) => ["aguardando", "pendente", "aberto"].includes(o.status));

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

        <SalesChart pedidos={pedidosFiltrados} />
        <StockAlert produtos={estoqueBaixo} />
      </div>

      <div className="w-full xl:w-80 flex-shrink-0 flex flex-col gap-6">
        <RecentOrders pedidos={pedidosFiltrados.slice(0, 7)} />
        <TopProducts pedidos={pedidosFiltrados} produtos={produtos} />
      </div>
    </div>
  );
};

export default Dashboard;
