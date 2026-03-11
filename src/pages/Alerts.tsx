import { orders, products } from "@/data/mockData";
import { AlertTriangle, Bell, Package, Clock } from "lucide-react";

const Alerts = () => {
  const lowStock = products.filter((p) => p.stock <= p.minStock && p.stock > 0);
  const outOfStock = products.filter((p) => p.stock === 0);
  const pendingOrders = orders.filter((o) => o.status === "aguardando");

  const alerts = [
    ...outOfStock.map((p) => ({
      type: "danger" as const,
      icon: Package,
      title: `${p.name} está sem estoque`,
      desc: "Necessita reposição urgente",
    })),
    ...lowStock.map((p) => ({
      type: "warning" as const,
      icon: AlertTriangle,
      title: `${p.name} com estoque baixo`,
      desc: `${p.stock} un. (mínimo: ${p.minStock})`,
    })),
    ...pendingOrders.map((o) => ({
      type: "info" as const,
      icon: Clock,
      title: `Pedido #${o.number} aguardando pagamento`,
      desc: `${o.clientName} — R$ ${o.total.toLocaleString("pt-BR")}`,
    })),
  ];

  const typeStyles = {
    danger: "border-destructive/20 bg-destructive/5",
    warning: "border-amber-200 bg-amber-50",
    info: "border-blue-200 bg-blue-50",
  };
  const iconStyles = {
    danger: "text-destructive",
    warning: "text-amber-600",
    info: "text-blue-600",
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h2 className="font-display text-2xl md:text-3xl font-semibold text-primary">Alertas</h2>
        <p className="text-sm text-muted-foreground mt-1">{alerts.length} notificação(ões)</p>
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum alerta no momento.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert, i) => (
            <div key={i} className={`flex items-start gap-4 p-4 rounded-lg border ${typeStyles[alert.type]}`}>
              <alert.icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${iconStyles[alert.type]}`} />
              <div>
                <p className="text-sm font-medium text-foreground">{alert.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{alert.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Alerts;
