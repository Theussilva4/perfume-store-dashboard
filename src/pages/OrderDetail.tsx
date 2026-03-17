import { useParams, useNavigate } from "react-router-dom";
import { pedidos, rotulosStatus, coresStatus, rotulosFormaPagamento } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, Phone, MapPin, CreditCard } from "lucide-react";

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const pedido = pedidos.find((o) => o.id === id);

  if (!pedido) {
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
          <h2 className="font-display text-2xl font-semibold text-primary">Pedido #{pedido.numero}</h2>
          <p className="text-sm text-muted-foreground">{new Date(pedido.data).toLocaleDateString("pt-BR")}</p>
        </div>
        <Badge className={`${coresStatus[pedido.status]} border-0 ml-auto`}>
          {rotulosStatus[pedido.status]}
        </Badge>
      </div>

      <div className="bg-card rounded-lg border border-border p-5">
        <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-4">Dados do Cliente</p>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm"><User className="h-4 w-4 text-muted-foreground" /> {pedido.nomeCliente}</div>
          <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground" /> {pedido.telefoneCliente}</div>
          {pedido.enderecoCliente && (
            <div className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-muted-foreground" /> {pedido.enderecoCliente}</div>
          )}
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-5">
        <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-4">Itens do Pedido</p>
        <div className="space-y-3">
          {pedido.itens.map((item) => (
            <div key={item.produtoId} className="flex items-center justify-between text-sm">
              <div>
                <span className="font-medium text-foreground">{item.nomeProduto}</span>
                <span className="text-muted-foreground ml-2">× {item.quantidade}</span>
              </div>
              <span className="text-foreground">R$ {(item.preco * item.quantidade).toLocaleString("pt-BR")}</span>
            </div>
          ))}
          <div className="border-t border-border pt-3 flex justify-between font-medium text-base">
            <span>Total</span>
            <span className="text-primary">R$ {pedido.total.toLocaleString("pt-BR")}</span>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-5">
        <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-4">Pagamento</p>
        <div className="flex items-center gap-2 text-sm">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          {rotulosFormaPagamento[pedido.formaPagamento]}
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
