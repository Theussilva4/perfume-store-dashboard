import { pedidos, produtos } from "@/data/mockData";
import { AlertTriangle, Bell, Package, Clock } from "lucide-react";

const Alerts = () => {
  const estoqueBaixo = produtos.filter((p) => p.estoque <= p.estoqueMinimo && p.estoque > 0);
  const semEstoque = produtos.filter((p) => p.estoque === 0);
  const pedidosPendentes = pedidos.filter((o) => o.status === "aguardando");

  const alertas = [
    ...semEstoque.map((p) => ({
      tipo: "danger" as const,
      icone: Package,
      titulo: `${p.nome} está sem estoque`,
      descricao: "Necessita reposição urgente",
    })),
    ...estoqueBaixo.map((p) => ({
      tipo: "warning" as const,
      icone: AlertTriangle,
      titulo: `${p.nome} com estoque baixo`,
      descricao: `${p.estoque} un. (mínimo: ${p.estoqueMinimo})`,
    })),
    ...pedidosPendentes.map((o) => ({
      tipo: "info" as const,
      icone: Clock,
      titulo: `Pedido #${o.numero} aguardando pagamento`,
      descricao: `${o.nomeCliente} — R$ ${o.total.toLocaleString("pt-BR")}`,
    })),
  ];

  const estilosTipo = {
    danger: "border-destructive/20 bg-destructive/5",
    warning: "border-amber-200 bg-amber-50",
    info: "border-blue-200 bg-blue-50",
  };
  const estilosIcone = {
    danger: "text-destructive",
    warning: "text-amber-600",
    info: "text-blue-600",
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h2 className="font-display text-2xl md:text-3xl font-semibold text-primary">Alertas</h2>
        <p className="text-sm text-muted-foreground mt-1">{alertas.length} notificação(ões)</p>
      </div>

      {alertas.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum alerta no momento.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alertas.map((alerta, i) => (
            <div key={i} className={`flex items-start gap-4 p-4 rounded-lg border ${estilosTipo[alerta.tipo]}`}>
              <alerta.icone className={`h-5 w-5 mt-0.5 flex-shrink-0 ${estilosIcone[alerta.tipo]}`} />
              <div>
                <p className="text-sm font-medium text-foreground">{alerta.titulo}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{alerta.descricao}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Alerts;
