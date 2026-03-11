import { useParams, useNavigate } from "react-router-dom";
import { orders, statusLabels, statusColors, paymentMethodLabels } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, Phone, MapPin, CreditCard } from "lucide-react";

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const order = orders.find((o) => o.id === id);

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Pedido não encontrado.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/pedidos")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up max-w-3xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/pedidos")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="font-display text-2xl font-semibold text-primary">Pedido #{order.number}</h2>
          <p className="text-sm text-muted-foreground">{new Date(order.date).toLocaleDateString("pt-BR")}</p>
        </div>
        <Badge className={`${statusColors[order.status]} border-0 ml-auto`}>
          {statusLabels[order.status]}
        </Badge>
      </div>

      {/* Client */}
      <div className="bg-card rounded-lg border border-border p-5">
        <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-4">Dados do Cliente</p>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm"><User className="h-4 w-4 text-muted-foreground" /> {order.clientName}</div>
          <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground" /> {order.clientPhone}</div>
          {order.clientAddress && (
            <div className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-muted-foreground" /> {order.clientAddress}</div>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="bg-card rounded-lg border border-border p-5">
        <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-4">Itens do Pedido</p>
        <div className="space-y-3">
          {order.items.map((item) => (
            <div key={item.productId} className="flex items-center justify-between text-sm">
              <div>
                <span className="font-medium text-foreground">{item.productName}</span>
                <span className="text-muted-foreground ml-2">× {item.quantity}</span>
              </div>
              <span className="text-foreground">R$ {(item.price * item.quantity).toLocaleString("pt-BR")}</span>
            </div>
          ))}
          <div className="border-t border-border pt-3 flex justify-between font-medium text-base">
            <span>Total</span>
            <span className="text-primary">R$ {order.total.toLocaleString("pt-BR")}</span>
          </div>
        </div>
      </div>

      {/* Payment */}
      <div className="bg-card rounded-lg border border-border p-5">
        <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-4">Pagamento</p>
        <div className="flex items-center gap-2 text-sm">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          {paymentMethodLabels[order.paymentMethod]}
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
