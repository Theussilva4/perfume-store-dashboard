import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const allMonths = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-sm px-4 py-3 animate-fade-in-up" style={{ animationDuration: '0.2s' }}>
        <p className="text-xs text-muted-foreground font-body mb-1">{label}</p>
        <p className="font-display text-lg font-semibold text-primary">
          R$ {payload[0].value.toLocaleString("pt-BR")}
        </p>
      </div>
    );
  }
  return null;
};

const CustomDot = (props: any) => {
  const { cx, cy, payload } = props;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill="hsl(145, 55%, 40%)"
      stroke="none"
      style={{
        filter: "drop-shadow(0 0 6px hsl(145 55% 40% / 0.4))",
        transition: "filter 0.3s ease",
      }}
    />
  );
};

const SalesChart = ({ pedidos = [] }: { pedidos?: any[] }) => {
  const chartData = allMonths.map(m => ({ month: m, vendas: 0 }));

  pedidos.forEach(p => {
    if (!p.data) return;
    const dateStr = String(p.data); 
    const monthIndex = parseInt(dateStr.split('-')[1] || "1", 10) - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
      chartData[monthIndex].vendas += Number(p.total || 0);
    }
  });

  return (
    <div className="bg-card rounded-sm p-6 animate-fade-in-up animate-delay-4">
      <h3 className="text-xs text-muted-foreground font-body uppercase tracking-widest mb-6">
        Vendas ao Longo do Ano Base
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(140 12% 85% / 0.7)"
            vertical={false}
          />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "hsl(150 8% 45%)", fontSize: 11, fontFamily: "Inter" }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "hsl(150 8% 45%)", fontSize: 11, fontFamily: "Inter" }}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} cursor={false} />
          <Line
            type="monotone"
            dataKey="vendas"
            stroke="hsl(145, 55%, 40%)"
            strokeWidth={2}
            dot={false}
            activeDot={<CustomDot />}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SalesChart;
