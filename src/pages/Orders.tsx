import { useState } from "react";
import { orders as initialOrders, products, statusLabels, statusColors, paymentMethodLabels, branchLabels, Order, OrderItem } from "@/data/mockData";
import { useBranch, branches } from "@/contexts/BranchContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Eye, ClipboardList, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const Orders = () => {
  const { selectedBranch, branchLabel } = useBranch();
  const navigate = useNavigate();
  const [orderList, setOrderList] = useState<Order[]>(initialOrders);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  // New order form
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("pix");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedQty, setSelectedQty] = useState(1);

  const filtered = orderList.filter((o) => {
    const matchSearch = o.clientName.toLowerCase().includes(search.toLowerCase()) ||
      String(o.number).includes(search);
    const matchStatus = filterStatus === "all" || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const addItem = () => {
    const product = products.find((p) => p.id === selectedProduct);
    if (!product) return;
    const existing = orderItems.find((i) => i.productId === product.id);
    if (existing) {
      setOrderItems((prev) =>
        prev.map((i) => i.productId === product.id ? { ...i, quantity: i.quantity + selectedQty } : i)
      );
    } else {
      setOrderItems((prev) => [...prev, {
        productId: product.id,
        productName: product.name,
        quantity: selectedQty,
        price: product.salePrice,
      }]);
    }
    setSelectedProduct("");
    setSelectedQty(1);
  };

  const removeItem = (productId: string) => {
    setOrderItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const orderTotal = orderItems.reduce((s, i) => s + i.price * i.quantity, 0);

  const handleCreateOrder = () => {
    if (!clientName || !clientPhone || orderItems.length === 0) {
      toast.error("Preencha cliente e adicione pelo menos um produto.");
      return;
    }
    const newOrder: Order = {
      id: String(Date.now()),
      number: Math.max(...orderList.map((o) => o.number)) + 1,
      clientName,
      clientPhone,
      clientAddress: clientAddress || undefined,
      items: orderItems,
      total: orderTotal,
      paymentMethod: paymentMethod as Order["paymentMethod"],
      status: paymentMethod === "pendente" ? "aguardando" : "pago",
      date: new Date().toISOString().split("T")[0],
      branch: "matriz",
    };
    setOrderList((prev) => [newOrder, ...prev]);
    toast.success(`Pedido #${newOrder.number} criado!`);
    setDialogOpen(false);
    setClientName(""); setClientPhone(""); setClientAddress("");
    setOrderItems([]); setPaymentMethod("pix");
  };

  const updateStatus = (orderId: string, status: Order["status"]) => {
    setOrderList((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
    toast.success("Status atualizado!");
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl md:text-3xl font-semibold text-primary">Pedidos</h2>
          <p className="text-sm text-muted-foreground mt-1">{orderList.length} pedidos registrados</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-2" /> Novo Pedido</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por cliente ou nº..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(statusLabels).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Orders table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nº</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Cliente</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Pagamento</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Data</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr key={order.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">#{order.number}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{order.clientName}</div>
                    <div className="text-xs text-muted-foreground">{order.clientPhone}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">R$ {order.total.toLocaleString("pt-BR")}</td>
                  <td className="px-4 py-3 text-center text-muted-foreground">{paymentMethodLabels[order.paymentMethod]}</td>
                  <td className="px-4 py-3 text-center">
                    <Select value={order.status} onValueChange={(v) => updateStatus(order.id, v as Order["status"])}>
                      <SelectTrigger className="h-7 text-xs border-0 bg-transparent w-auto inline-flex">
                        <Badge className={`${statusColors[order.status]} border-0 text-[10px]`}>
                          {statusLabels[order.status]}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusLabels).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(order.date).toLocaleDateString("pt-BR")}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => navigate(`/pedidos/${order.id}`)}
                      className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum pedido encontrado.</p>
        </div>
      )}

      {/* New order dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Novo Pedido</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            {/* Client info */}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-3">Dados do Cliente</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input value={clientName} onChange={(e) => setClientName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="(00) 00000-0000" />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Endereço (opcional)</Label>
                  <Input value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Products */}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-3">Produtos</p>
              <div className="flex gap-2 mb-3">
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Selecione um produto" /></SelectTrigger>
                  <SelectContent>
                    {products.filter((p) => p.active && p.stock > 0).map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} — R$ {p.salePrice.toLocaleString("pt-BR")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input type="number" value={selectedQty} onChange={(e) => setSelectedQty(Number(e.target.value))} className="w-20" min={1} />
                <Button variant="outline" onClick={addItem} disabled={!selectedProduct}>+</Button>
              </div>

              {orderItems.length > 0 && (
                <div className="bg-muted/30 rounded-md p-3 space-y-2">
                  {orderItems.map((item) => (
                    <div key={item.productId} className="flex items-center justify-between text-sm">
                      <span className="text-foreground">{item.productName} × {item.quantity}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground">R$ {(item.price * item.quantity).toLocaleString("pt-BR")}</span>
                        <button onClick={() => removeItem(item.productId)} className="text-destructive hover:text-destructive/80">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="border-t border-border pt-2 flex justify-between font-medium">
                    <span>Total</span>
                    <span className="text-primary">R$ {orderTotal.toLocaleString("pt-BR")}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Payment */}
            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="cartao">Cartão</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateOrder}>Criar Pedido</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;
