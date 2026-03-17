import { pedidos, produtos } from "@/data/mockData";
import { useBranch } from "@/contexts/BranchContext";
import KpiCard from "@/components/KpiCard";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell,
} from "recharts";

const Reports = () => {
  const { filialSelecionada, rotuloFilial } = useBranch();
  const pedidosFilial = pedidos.filter((o) => filialSelecionada === "todas" || o.filial === filialSelecionada);

  const faturamentoTotal = pedidosFilial.filter((o) => o.status !== "cancelado").reduce((s, o) => s + o.total, 0);
  const pedidosValidos = pedidosFilial.filter((o) => o.status !== "cancelado");
  const ticketMedio = pedidosValidos.length ? faturamentoTotal / pedidosValidos.length : 0;

  const vendasPorProduto: Record<string, { nome: string; qtd: number; receita: number }> = {};
  pedidosFilial.forEach((o) => {
    if (o.status === "cancelado") return;
    o.itens.forEach((item) => {
      if (!vendasPorProduto[item.produtoId]) {
        vendasPorProduto[item.produtoId] = { nome: item.nomeProduto, qtd: 0, receita: 0 };
      }
      vendasPorProduto[item.produtoId].qtd += item.quantidade;
      vendasPorProduto[item.produtoId].receita += item.preco * item.quantidade;
    });
  });
  const topProdutos = Object.values(vendasPorProduto).sort((a, b) => b.qtd - a.qtd).slice(0, 5);

  const vendasPorCategoria: Record<string, number> = {};
  pedidosFilial.forEach((o) => {
    if (o.status === "cancelado") return;
    o.itens.forEach((item) => {
      const produto = produtos.find((p) => p.id === item.produtoId);
      const cat = produto?.categoria || "Outros";
      vendasPorCategoria[cat] = (vendasPorCategoria[cat] || 0) + item.preco * item.quantidade;
    });
  });
  const dadosCategoria = Object.entries(vendasPorCategoria).map(([nome, valor]) => ({ nome, valor }));

  const custoTotal = pedidosFilial
    .filter((o) => o.status !== "cancelado")
    .reduce((s, o) => {
      return s + o.itens.reduce((is, item) => {
        const produto = produtos.find((p) => p.id === item.produtoId);
        return is + (produto?.precoCusto || 0) * item.quantidade;
      }, 0);
    }, 0);
  const lucroTotal = faturamentoTotal - custoTotal;
  const margem = faturamentoTotal > 0 ? ((lucroTotal / faturamentoTotal) * 100).toFixed(1) : "0";

  const CORES = [
    "hsl(145, 55%, 40%)", "hsl(200, 60%, 50%)", "hsl(30, 80%, 55%)",
    "hsl(280, 50%, 55%)", "hsl(350, 60%, 55%)", "hsl(170, 50%, 45%)",
  ];

  const TooltipPersonalizado = ({ active, payload, label }: any) => {
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
        <p className="text-sm text-muted-foreground mt-1">{rotuloFilial} • Análise de vendas e desempenho</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Faturamento Total" value={`R$ ${faturamentoTotal.toLocaleString("pt-BR")}`} positive delay="animate-delay-1" />
        <KpiCard label="Ticket Médio" value={`R$ ${ticketMedio.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`} positive delay="animate-delay-2" />
        <KpiCard label="Lucro Total" value={`R$ ${lucroTotal.toLocaleString("pt-BR")}`} change={`Margem: ${margem}%`} positive delay="animate-delay-2" />
        <KpiCard label="Total de Pedidos" value={String(pedidosValidos.length)} positive delay="animate-delay-3" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-xs text-muted-foreground uppercase tracking-widest mb-5">Produtos Mais Vendidos</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topProdutos} layout="vertical" margin={{ left: 0, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(140 12% 85% / 0.7)" horizontal={false} />
              <XAxis type="number" tick={{ fill: "hsl(150 8% 45%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="nome" type="category" tick={{ fill: "hsl(150 8% 45%)", fontSize: 11 }} axisLine={false} tickLine={false} width={120} />
              <Tooltip content={<TooltipPersonalizado />} cursor={false} />
              <Bar dataKey="receita" fill="hsl(145, 55%, 40%)" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-xs text-muted-foreground uppercase tracking-widest mb-5">Vendas por Categoria</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={dadosCategoria} dataKey="valor" nameKey="nome" cx="50%" cy="50%" outerRadius={90} strokeWidth={2} stroke="hsl(0 0% 100%)">
                {dadosCategoria.map((_, i) => (
                  <Cell key={i} fill={CORES[i % CORES.length]} />
                ))}
              </Pie>
              <Tooltip content={<TooltipPersonalizado />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-3 justify-center">
            {dadosCategoria.map((cat, i) => (
              <div key={cat.nome} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CORES[i % CORES.length] }} />
                {cat.nome}
              </div>
            ))}
          </div>
        </div>
      </div>

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
              {[...new Map(pedidosFilial.filter((o) => o.status !== "cancelado").map((o) => [o.nomeCliente, o])).values()]
                .map((o) => {
                  const pedidosCliente = pedidosFilial.filter((oo) => oo.nomeCliente === o.nomeCliente && oo.status !== "cancelado");
                  return { nome: o.nomeCliente, contagem: pedidosCliente.length, total: pedidosCliente.reduce((s, oo) => s + oo.total, 0) };
                })
                .sort((a, b) => b.total - a.total)
                .slice(0, 5)
                .map((c) => (
                  <tr key={c.nome} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium text-foreground">{c.nome}</td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{c.contagem}</td>
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
