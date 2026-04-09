import { rotulosStatus } from "@/data/mockData";

const statusColor: Record<string, string> = {
  "Entregue": "text-success",
  "Em trânsito": "text-primary",
  "Processando": "text-muted-foreground",
};

const RecentOrders = ({ pedidos = [] }: { pedidos?: any[] }) => {
  return (
    <div className="bg-card rounded-sm p-6 animate-fade-in-up animate-delay-5">
      <h3 className="text-xs text-muted-foreground font-body uppercase tracking-widest mb-5">
        Últimos Pedidos
      </h3>
      <div className="flex flex-col gap-4">
        {pedidos.slice(0, 10).map((order) => {
          const nomeStatus = rotulosStatus[order.status] || order.status || "Aberto";
          return (
            <button
              key={order.id}
              className="flex items-center justify-between text-left group cursor-pointer transition-colors duration-200 hover:opacity-80"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-sm text-foreground font-body font-medium group-hover:text-primary transition-colors duration-200">
                  {order.nomeCliente || "Cliente Desconhecido"}
                </span>
                <span className="text-xs text-muted-foreground font-body">
                  #{order.numero || order.numpedido || order.id}
                </span>
              </div>
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-sm text-foreground font-body">
                  R$ {Number(order.total || order.valor_total || 0).toLocaleString("pt-BR")}
                </span>
                <span className={`text-xs font-body ${statusColor[nomeStatus] || "text-primary"}`}>
                  {nomeStatus}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default RecentOrders;
