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

const data = [
  { month: "Jan", vendas: 12400 },
  { month: "Fev", vendas: 15800 },
  { month: "Mar", vendas: 13200 },
  { month: "Abr", vendas: 18900 },
  { month: "Mai", vendas: 22100 },
  { month: "Jun", vendas: 19800 },
  { month: "Jul", vendas: 24500 },
  { month: "Ago", vendas: 21300 },
  { month: "Set", vendas: 26700 },
  { month: "Out", vendas: 28400 },
  { month: "Nov", vendas: 31200 },
  { month: "Dez", vendas: 35800 },
];

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

const SalesChart = () => {
  return (
    <div className="bg-card rounded-sm p-6 animate-fade-in-up animate-delay-4">
      <h3 className="text-xs text-muted-foreground font-body uppercase tracking-widest mb-6">
        Vendas ao Longo do Tempo
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
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
            tick={{ fill: "hsl(140 5% 50%)", fontSize: 11, fontFamily: "Inter" }}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} cursor={false} />
          <Line
            type="monotone"
            dataKey="vendas"
            stroke="hsl(145, 55%, 55%)"
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
