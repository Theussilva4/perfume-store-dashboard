const orders = [
  { id: "#1247", cliente: "Maria Eduarda", valor: "R$ 890,00", status: "Entregue" },
  { id: "#1246", cliente: "Carlos Henrique", valor: "R$ 1.250,00", status: "Em trânsito" },
  { id: "#1245", cliente: "Ana Beatriz", valor: "R$ 445,00", status: "Processando" },
  { id: "#1244", cliente: "Rafael Costa", valor: "R$ 2.100,00", status: "Entregue" },
  { id: "#1243", cliente: "Juliana Ferreira", valor: "R$ 670,00", status: "Em trânsito" },
  { id: "#1242", cliente: "Pedro Almeida", valor: "R$ 1.890,00", status: "Entregue" },
];

const statusColor: Record<string, string> = {
  "Entregue": "text-success",
  "Em trânsito": "text-primary",
  "Processando": "text-muted-foreground",
};

const RecentOrders = () => {
  return (
    <div className="bg-card rounded-sm p-6 animate-fade-in-up animate-delay-5">
      <h3 className="text-xs text-muted-foreground font-body uppercase tracking-widest mb-5">
        Últimos Pedidos
      </h3>
      <div className="flex flex-col gap-4">
        {orders.map((order) => (
          <button
            key={order.id}
            className="flex items-center justify-between text-left group cursor-pointer transition-colors duration-200 hover:opacity-80"
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-sm text-foreground font-body font-medium group-hover:text-primary transition-colors duration-200">
                {order.cliente}
              </span>
              <span className="text-xs text-muted-foreground font-body">
                {order.id}
              </span>
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-sm text-foreground font-body">
                {order.valor}
              </span>
              <span className={`text-xs font-body ${statusColor[order.status]}`}>
                {order.status}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default RecentOrders;
