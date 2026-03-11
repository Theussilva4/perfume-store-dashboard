import { orders, products } from "@/data/mockData";
import KpiCard from "@/components/KpiCard";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell,
} from "recharts";

const Reports = () => {
  const totalRevenue = orders.filter((o) => o.status !== "cancelado").reduce((s, o) => s + o.total, 0);
  const validOrders = orders.filter((o) => o.status !== "cancelado");
  const avgTicket = validOrders.length ? totalRevenue / validOrders.length : 0;

  // Products most sold
  const productSales: Record<string, { name: string; qty: number; revenue: number }> = {};
  orders.forEach((o) => {
    if (o.status === "cancelado") return;
    o.items.forEach((item) => {
      if (!productSales[item.productId]) {
        productSales[item.productId] = { name: item.productName, qty: 0, revenue: 0 };
      }
      productSales[item.productId].qty += item.quantity;
      productSales[item.productId].revenue += item.price * item.quantity;
    });
  });
  const topProducts = Object.values(productSales).sort((a, b) => b.qty - a.qty).slice(0, 5);

  // Sales by category
  const categorySales: Record<string, number> = {};
  orders.forEach((o) => {
    if (o.status === "cancelado") return;
    o.items.forEach((item) => {
      const product = products.find((p) => p.id === item.productId);
      const cat = product?.category || "Outros";
      categorySales[cat] = (categorySales[cat] || 0) + item.price * item.quantity;
    });
  });
  const categoryData = Object.entries(categorySales).map(([name, value]) => ({ name, value }));

  // Profit calculation
  const totalCost = orders
    .filter((o) => o.status !== "cancelado")
    .reduce((s, o) => {
      return s + o.items.reduce((is, item) => {
        const product = products.find((p) => p.id === item.productId);
        return is + (product?.costPrice || 0) * item.quantity;
      }, 0);
    }, 0);
  const totalProfit = totalRevenue - totalCost;
  const margin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : "0";

  const COLORS = [
    "hsl(145, 55%, 40%)", "hsl(200, 60%, 50%)", "hsl(30, 80%, 55%)",
    "hsl(280, 50%, 55%)", "hsl(350, 60%, 55%)", "hsl(170, 50%, 45%)",
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-card border border-border rounded-md px-3 py-2 text-sm">
          <p className="font-medium text-foreground">{label || payload[0].name}</p>
          <p className="text-primary">R$ {Number(payload[0].value).toLocaleString("pt-BR")}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h2 className="font-display text-2xl md:text-3xl font-semibold text-primary">Relatórios</h2>
        <p className="text-sm text-muted-foreground mt-1">Análise de vendas e desempenho</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Faturamento Total" value={`R$ ${totalRevenue.toLocaleString("pt-BR")}`} positive delay="animate-delay-1" />
        <KpiCard label="Ticket Médio" value={`R$ ${avgTicket.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`} positive delay="animate-delay-2" />
        <KpiCard label="Lucro Total" value={`R$ ${totalProfit.toLocaleString("pt-BR")}`} change={`Margem: ${margin}%`} positive delay="animate-delay-2" />
        <KpiCard label="Total de Pedidos" value={String(validOrders.length)} positive delay="animate-delay-3" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top products chart */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-xs text-muted-foreground uppercase tracking-widest mb-5">Produtos Mais Vendidos</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topProducts} layout="vertical" margin={{ left: 0, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(140 12% 85% / 0.7)" horizontal={false} />
              <XAxis type="number" tick={{ fill: "hsl(150 8% 45%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fill: "hsl(150 8% 45%)", fontSize: 11 }} axisLine={false} tickLine={false} width={120} />
              <Tooltip content={<CustomTooltip />} cursor={false} />
              <Bar dataKey="revenue" fill="hsl(145, 55%, 40%)" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category pie chart */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-xs text-muted-foreground uppercase tracking-widest mb-5">Vendas por Categoria</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} strokeWidth={2} stroke="hsl(0 0% 100%)">
                {categoryData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-3 justify-center">
            {categoryData.map((cat, i) => (
              <div key={cat.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                {cat.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top clients */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="text-xs text-muted-foreground uppercase tracking-widest mb-5">Clientes que Mais Compram</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Cliente</th>
                <th className="text-center px-4 py-2 font-medium text-muted-foreground">Pedidos</th>
                <th className="text-right px-4 py-2 font-medium text-muted-foreground">Total Gasto</th>
              </tr>
            </thead>
            <tbody>
              {[...new Map(orders.filter((o) => o.status !== "cancelado").map((o) => [o.clientName, o])).values()]
                .map((o) => {
                  const clientOrders = orders.filter((oo) => oo.clientName === o.clientName && oo.status !== "cancelado");
                  return { name: o.clientName, count: clientOrders.length, total: clientOrders.reduce((s, oo) => s + oo.total, 0) };
                })
                .sort((a, b) => b.total - a.total)
                .slice(0, 5)
                .map((c) => (
                  <tr key={c.name} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium text-foreground">{c.name}</td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{c.count}</td>
                    <td className="px-4 py-3 text-right text-primary font-medium">R$ {c.total.toLocaleString("pt-BR")}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
