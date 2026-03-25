import { useState, useRef } from "react";
import { pedidos as pedidosIniciais, produtos, rotulosStatus, coresStatus, rotulosFormaPagamento, rotulosFilial, Pedido, ItemPedido } from "@/data/mockData";
import { getFilial } from '@/services/filialService'
import { getCliente } from '@/services/clienteService'
import { getVendedor } from '@/services/vendedorService'
import { getProdutos } from '@/services/produtosService'
import { useBranch, filiais } from "@/contexts/BranchContext";
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
import { useEffect } from "react";



const Orders = () => {
  const [listaFiliais, setListaFiliais] = useState<any[]>([]);
  const [listaClientes, setListarClientes] = useState<any[]>([]);
  const [codigoCliente, setCodigoCliente] = useState("");
  const [nomeCliente, setNomeCliente] = useState("");
  const [dialogClienteOpen, setDialogClienteOpen] = useState(false);
  const [buscaCliente, setBuscaCliente] = useState("");
  const [listaVendedor, setListarVendedor] = useState<any[]>([]);
  const [codigoVendedor, setCodigoVendedor] = useState("");
  const [nomeVendedor, setNomeVendedor] = useState("");
  const [dialogVendedorOpen, setDialogVendedorOpen] = useState(false);
  const [buscaVendedor, setBuscaVendedor] = useState("");
  const [listarProdutos, setListarProdutos] = useState<any[]>([]);
  const [buscarProduto, setBuscarproduto] = useState("");
  const [precoProduto, setPrecoProduto] = useState(0);
  const [buscaProdutoInput, setBuscaProdutoInput] = useState("");



  const { filialSelecionada, rotuloFilial } = useBranch();
  const navigate = useNavigate();
  const [listaPedidos, setListaPedidos] = useState<Pedido[]>(pedidosIniciais);
  const [search, setSearch] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("all");
  const [filtroPeriodo, setFiltroPeriodo] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [telefoneCliente, setTelefoneCliente] = useState("");
  const [enderecoCliente, setEnderecoCliente] = useState("");
  const [formaPagamento, setFormaPagamento] = useState<string>("pix");
  const [itensPedido, setItensPedido] = useState<ItemPedido[]>([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState("");
  const [filialPedido, setFilialPedido] = useState("");
  const [qtdSelecionada, setQtdSelecionada] = useState(1);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const refCodigo = useRef<HTMLInputElement>(null);
  const refQtd = useRef<HTMLInputElement>(null);
  const refPreco = useRef<HTMLInputElement>(null);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setLoading(true);
    setErro(null);

    try {
      const [filiais, clientes, vendedores, produtos] = await Promise.all([
        getFilial(),
        getCliente(),
        getVendedor(),
        getProdutos(),
      ]);

      setListaFiliais(filiais);
      setListarClientes(clientes);
      setListarVendedor(vendedores);
      setListarProdutos(produtos);
    } catch (error) {
      console.error(error);
      setErro("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }

  // 👇 UI de loading (opcional)
  if (loading) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Carregando dados...
      </div>
    );
  }

  // 👇 UI de erro (opcional)
  if (erro) {
    return (
      <div className="p-6 text-center text-red-500">
        {erro}
      </div>
    );
  }

  function limparNumero(valor: string) {
    return valor = valor.replace(/\D/g, "");

  }

  function formatarCpfCnpj(valor: string) {
    valor = valor.replace(/\D/g, "");

    if (valor.length <= 11) {
      return valor
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }

    return valor
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
  async function buscarClientePorCodigo(codigo?: string) {
    const codigoBusca = codigo || codigoCliente;
    if (!codigoCliente) {
      setNomeCliente("");
      return;
    }
    const cliente = listaClientes.find(
      (c) => String(c.codcliente) === codigoBusca
    );
    if (cliente) {
      setNomeCliente(cliente.nome);
      setTelefoneCliente(cliente.telefone);
      setEnderecoCliente(cliente.endereco);
    } else {
      setNomeCliente("");
      toast.error("Cliente não encontrado");
    }
  }
  async function buscarVendedorPorCodigo(codigo?: string) {
    const codigoBusca = codigo || codigoVendedor;

    if (!codigoBusca) {
      setNomeVendedor("");
      return;
    }

    const vendedor = listaVendedor.find(
      (v) => String(v.codvendedor) === codigoBusca
    );

    if (vendedor) {
      setNomeVendedor(vendedor.nome);
    } else {
      setNomeVendedor("");
      toast.error("Vendedor não encontrado");
    }
  }

  const clientesFiltrados = listaClientes.filter((c) => {
    const busca = buscaCliente.toLowerCase();
    const buscaNumerica = limparNumero(buscaCliente);

    return (
      (c.nome || "").toLowerCase().includes(busca) ||

      String(c.codcliente || "").includes(buscaNumerica) ||

      limparNumero(c.cpf_cnpj || "").includes(buscaNumerica)
    );
  });
  const vendedorFiltrados = listaVendedor.filter((v) => {
    const busca = buscaVendedor.toLowerCase();
    const buscaNumerica = limparNumero(buscaVendedor);

    return (
      (v.nome || "").toLowerCase().includes(busca) ||

      String(v.codvendedor || "").includes(buscaNumerica) ||

      limparNumero(v.cpf || "").includes(buscaNumerica)
    );
  });
  const ProdutosFiltrados = listarProdutos.filter((p) => {
    const busca = buscarProduto.toLowerCase();
    const buscaNumerica = limparNumero(buscarProduto);

    return (
      (p.descricao || "").toLowerCase().includes(busca) ||

      String(p.codproduto || "").includes(buscaNumerica) /* || */

      /*  limparNumero(c.cpf_cnpj || "").includes(buscaNumerica) */
    );
  });

  const filtrados = listaPedidos.filter((o) => {
    const matchFilial = filialSelecionada === "todas" || o.filial === filialSelecionada;
    const matchSearch = o.nomeCliente.toLowerCase().includes(search.toLowerCase()) ||
      String(o.numero).includes(search);
    const matchStatus = filtroStatus === "all" || o.status === filtroStatus;
    return matchFilial && matchSearch && matchStatus;
  });

  /* const adicionarItem = () => {
    const produto = listarProdutos.find((p) => p.codproduto === String(produtoSelecionado));
    if (!produto) return;
    const existente = itensPedido.find((i) => i.produtoId === produto.codproduto);
    if (existente) {
      setItensPedido((prev) =>
        prev.map((i) => i.produtoId === produto.codproduto ? { ...i, quantidade: i.quantidade + qtdSelecionada } : i)
      );
    } else {
      setItensPedido((prev) => [...prev, {
        produtoId: String(produto.codproduto),
        nomeProduto: produto.descricao,
        quantidade: qtdSelecionada,
        preco: Number(produto.preco_normal),
      }]);
    }
    setProdutoSelecionado("");
    setQtdSelecionada(1);
  }; */
  const adicionarItem = () => {
    const produto = listarProdutos.find(
      (p) => String(p.codproduto) === produtoSelecionado
    );

    if (!produto) return;

    const existente = itensPedido.find(
      (i) => i.produtoId === String(produto.codproduto)
    );

    if (existente) {
      setItensPedido((prev) =>
        prev.map((i) =>
          i.produtoId === String(produto.codproduto)
            ? { ...i, quantidade: i.quantidade + qtdSelecionada }
            : i
        )
      );
    } else {
      setItensPedido((prev) => [
        ...prev,
        {
          produtoId: String(produto.codproduto),
          nomeProduto: produto.descricao,
          quantidade: qtdSelecionada,
          preco: Number(produto.preco_normal) || 0,
        },
      ]);
    }

    // limpa depois de adicionar
    setProdutoSelecionado("");
    setQtdSelecionada(1);
    setPrecoProduto(0);
  };

  function buscarProdutos() {
    if (!buscaProdutoInput) return;

    const busca = buscaProdutoInput.toLowerCase();

    const produto = listarProdutos.find((p) =>
      String(p.codproduto) === buscaProdutoInput ||
      (p.descricao || "").toLowerCase().includes(busca)
    );

    if (produto) {
      setProdutoSelecionado(String(produto.codproduto));
      setPrecoProduto(Number(produto.preco_normal) || 0);
    } else {
      toast.error("Produto não encontrado");
    }
  }





  const removerItem = (produtoId: string) => {
    setItensPedido((prev) => prev.filter((i) => i.produtoId !== produtoId));
  };

  const totalPedido = itensPedido.reduce((s, i) => s + i.preco * i.quantidade, 0);

  const handleCriarPedido = () => {
    if (!codigoCliente || itensPedido.length === 0) {
      toast.error("Preencha cliente e adicione pelo menos um produto.");
      return;
    }
    else if (!codigoVendedor) {
      toast.error("Preencha o Vendedor.");
      return;
    }
    const novoPedido: Pedido = {
      id: String(Date.now()),
      numero: Math.max(...listaPedidos.map((o) => o.numero)) + 1,
      nomeCliente,
      telefoneCliente,
      enderecoCliente: enderecoCliente || undefined,
      itens: itensPedido,
      total: totalPedido,
      formaPagamento: formaPagamento as Pedido["formaPagamento"],
      status: formaPagamento === "pendente" ? "aguardando" : "pago",
      data: new Date().toISOString().split("T")[0],
      filial: filialPedido,
    };
    setListaPedidos((prev) => [novoPedido, ...prev]);
    toast.success(`Pedido #${novoPedido.numero} criado!`);
    setDialogOpen(false);
    setNomeCliente(""); setTelefoneCliente(""); setEnderecoCliente("");
    setItensPedido([]); setFormaPagamento("pix");
  };

  const atualizarStatus = (pedidoId: string, status: Pedido["status"]) => {
    setListaPedidos((prev) =>
      prev.map((o) => (o.id === pedidoId ? { ...o, status } : o))
    );
    toast.success("Status atualizado!");
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl md:text-3xl font-semibold text-primary">Pedidos</h2>
          <p className="text-sm text-muted-foreground mt-1">{rotuloFilial} • {filtrados.length} pedidos</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-2" /> Novo Pedido</Button>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por cliente ou nº..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(rotulosStatus).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Unidade</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((pedido) => (
                <tr key={pedido.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">#{pedido.numero}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{pedido.nomeCliente}</div>
                    <div className="text-xs text-muted-foreground">{pedido.telefoneCliente}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">R$ {pedido.total.toLocaleString("pt-BR")}</td>
                  <td className="px-4 py-3 text-center text-muted-foreground">{rotulosFormaPagamento[pedido.formaPagamento]}</td>
                  <td className="px-4 py-3 text-center">
                    <Select value={pedido.status} onValueChange={(v) => atualizarStatus(pedido.id, v as Pedido["status"])}>
                      <SelectTrigger className="h-7 text-xs border-0 bg-transparent w-auto inline-flex">
                        <Badge className={`${coresStatus[pedido.status]} border-0 text-[10px]`}>
                          {rotulosStatus[pedido.status]}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(rotulosStatus).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(pedido.data).toLocaleDateString("pt-BR")}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="outline" className="text-[10px]">{rotulosFilial[pedido.filial]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => navigate(`/pedidos/${pedido.id}`)}
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

      {filtrados.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum pedido encontrado.</p>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Novo Pedido</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Filial</Label>
              <Select value={filialPedido} onValueChange={setFilialPedido}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {listaFiliais.map((b) => (
                    <SelectItem key={b.codfilial} value={String(b.codfilial)}>{b.filial}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-3">Dados do Cliente</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2 col-span-2">
                  <Label>Cliente</Label>

                  <div className="flex gap-2">
                    {/* Código */}
                    <Input
                      value={codigoCliente}
                      onChange={(e) => setCodigoCliente(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          buscarClientePorCodigo(e.currentTarget.value);
                        }
                      }}
                      placeholder="Código"
                      className="w-28"
                    />

                    {/* Botão ... */}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogClienteOpen(true)}
                    >
                      ...
                    </Button>

                    {/* Nome */}
                    <Input
                      value={nomeCliente}
                      readOnly
                      placeholder="Nome do cliente"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Vendedor</Label>

                  <div className="flex gap-2">
                    {/* Código */}
                    <Input
                      value={codigoVendedor}
                      onChange={(e) => setCodigoVendedor(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          buscarVendedorPorCodigo(e.currentTarget.value);
                        }
                      }}
                      placeholder="Código"
                      className="w-28"
                    />

                    {/* Botão ... */}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogVendedorOpen(true)}
                    >
                      ...
                    </Button>

                    {/* Nome */}
                    <Input
                      value={nomeVendedor}
                      readOnly
                      placeholder="Nome do Vendedor"
                      className="flex-1"
                    />
                  </div>
                </div>
                {/* <div className="col-span-2 space-y-2">
                  <Label>Endereço (opcional)</Label>
                  <Input value={enderecoCliente} onChange={(e) => setEnderecoCliente(e.target.value)} />
                </div> */}
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-3">Produtos</p>



              <div className="grid grid-cols-12 gap-2 items-end mb-3">

                {/* CÓDIGO */}
                <div className="col-span-2">
                  <Label>Código</Label>
                  <Input
                    ref={refCodigo}
                    placeholder="Código ou nome"
                    value={buscaProdutoInput}
                    onChange={(e) => setBuscaProdutoInput(e.target.value)}
                    onBlur={buscarProdutos}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        buscarProdutos();
                        refQtd.current?.focus();
                      }
                    }}
                  />
                </div>

                {/* DESCRIÇÃO */}
                <div className="col-span-4">
                  <Label>Descrição</Label>
                  <Input
                    value={
                      listarProdutos.find(p => String(p.codproduto) === produtoSelecionado)?.descricao || ""
                    }
                    readOnly
                  />
                </div>

                {/* EMBALAGEM */}
                <div className="col-span-2">
                  <Label>Emb.</Label>
                  <Input
                    value={
                      listarProdutos.find(p => String(p.codproduto) === produtoSelecionado)?.embalagem || "UN"
                    }
                    readOnly
                  />
                </div>

                {/* QUANTIDADE */}
                <div className="col-span-2">
                  <Label>Qtd.</Label>
                  <Input
                    ref={refQtd}
                    type="number"
                    value={qtdSelecionada}
                    onChange={(e) => setQtdSelecionada(Number(e.target.value))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        refPreco.current?.focus();
                      }
                    }}
                  />
                  </div>

                  {/* PREÇO */}
                  <div className="col-span-2">
                    <Label>Preço</Label>
                    <Input
                      ref={refPreco}
                      type="number"
                      value={precoProduto}
                      onChange={(e) => setPrecoProduto(Number(e.target.value))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          adicionarItem();
                          setBuscaProdutoInput("");
                          setProdutoSelecionado("");
                          refCodigo.current?.focus();
                        }
                      }}
                    />
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={adicionarItem}
                  disabled={!produtoSelecionado}
                >
                  + Adicionar
                </Button>




                {/*  <Input type="number" value={qtdSelecionada} onChange={(e) => setQtdSelecionada(Number(e.target.value))} className="w-20" min={1} />
                <Button variant="outline" onClick={adicionarItem} disabled={!produtoSelecionado}>+</Button> */}


                {itensPedido.length > 0 && (
                  <div className="bg-muted/30 rounded-md p-3 space-y-2">
                    {itensPedido.map((item) => (
                      <div key={item.produtoId} className="flex items-center justify-between text-sm">
                        <span className="text-foreground">{item.nomeProduto} × {item.quantidade}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-muted-foreground">R$ {((item.preco || 0) * (item.quantidade || 0)).toLocaleString("pt-BR")}</span>
                          <button onClick={() => removerItem(item.produtoId)} className="text-destructive hover:text-destructive/80">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="border-t border-border pt-2 flex justify-between font-medium">
                      <span>Total</span>
                      <span className="text-primary">R$ {(totalPedido || 0).toLocaleString("pt-BR")}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Forma de Pagamento</Label>
                <Select value={formaPagamento} onValueChange={setFormaPagamento}>
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
              <Button onClick={handleCriarPedido}>Criar Pedido</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={dialogClienteOpen} onOpenChange={setDialogClienteOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Selecionar Cliente</DialogTitle>
          </DialogHeader>

          {/* BUSCA */}
          <Input
            placeholder="Buscar cliente..."
            value={buscaCliente}
            onChange={(e) => setBuscaCliente(e.target.value)}
          />

          {/* LISTA */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto mt-3">
            {clientesFiltrados.map((c) => (
              <div
                key={c.codcliente}
                className="p-3 border rounded cursor-pointer hover:bg-muted"
                onClick={() => {
                  setCodigoCliente(String(c.codcliente));
                  setNomeCliente(c.nome);
                  setTelefoneCliente(c.telefone);
                  setEnderecoCliente(c.endereco);
                  setDialogClienteOpen(false);
                }}
              >
                <div className="font-medium">{c.nome}</div>

                <div className="text-xs text-muted-foreground">
                  Código: {c.codcliente}
                </div>

                <div className="text-xs text-muted-foreground">
                  CPF/CNPJ: {formatarCpfCnpj(c.cpf_cnpj)}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      {/* -------------- aqui -------------*/}
      <Dialog open={dialogVendedorOpen} onOpenChange={setDialogVendedorOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Selecionar Vendedor</DialogTitle>
          </DialogHeader>

          {/* BUSCA */}
          <Input
            placeholder="Buscar Vendedor..."
            value={buscaVendedor}
            onChange={(e) => setBuscaVendedor(e.target.value)}
          />

          {/* LISTA */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto mt-3">
            {vendedorFiltrados.map((v) => (
              <div
                key={v.codvendedor}
                className="p-3 border rounded cursor-pointer hover:bg-muted"
                onClick={() => {
                  setCodigoVendedor(String(v.codvendedor));
                  setNomeVendedor(v.nome);
                  setDialogVendedorOpen(false);
                }}
              >
                <div className="font-medium">{v.nome}</div>

                <div className="text-xs text-muted-foreground">
                  Código: {v.codvendedor}
                </div>

                <div className="text-xs text-muted-foreground">
                  CPF/CNPJ: {formatarCpfCnpj(v.cpf)}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;
