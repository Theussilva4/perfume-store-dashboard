import { useState, useRef } from "react";
import { pedidos as pedidosIniciais, produtos, rotulosStatus, coresStatus, rotulosFormaPagamento, rotulosFilial, Pedido, ItemPedido } from "@/data/mockData";
import { getFilial } from '@/services/filialService'
import { getCliente } from '@/services/clienteService'
import { getVendedor } from '@/services/vendedorService'
import { getProdutos } from '@/services/produtosService'
import { getFormasPagamento } from '@/services/formaPagamentoService'
import { createPedido, getPedidos, updatePedido, alterarStatusPedido, cancelarPedido } from '@/services/pedidosService'
import { getEstoque } from "@/services/estoqueService";
import { useBranch, filiais } from "@/contexts/BranchContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Search, Eye, ClipboardList, Trash2, Pencil, ScanBarcode, FileText } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { BarcodeScannerModal } from "@/components/BarcodeScannerModal";
import * as comercialService from "@/services/comercialService";
import { gerarEspelhoPedido } from "@/utils/pdfGenerator";


const Orders = () => {
  const { usuario } = useAuth();
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
  const [dialogProdutoOpen, setDialogProdutoOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  const [idPedidoEdicao, setIdPedidoEdicao] = useState<string | null>(null);
  const [statusAtualPedido, setStatusAtualPedido] = useState("EM_ABERTO");
  const [codigoPlano, setCodigoPlano] = useState("");
  const [nomePlano, setNomePlano] = useState("");
  const [dialogPlanoOpen, setDialogPlanoOpen] = useState(false);
  const [buscaPlano, setBuscaPlano] = useState("");
  const { filialSelecionada, rotuloFilial } = useBranch();
  const navigate = useNavigate();
  const [listaPedidos, setListaPedidos] = useState<any[]>([]);
  const [listaFormasPagamento, setListaFormasPagamento] = useState<any[]>([]);
  const [pedidoParaDetalhes, setPedidoParaDetalhes] = useState<any | null>(null);
  const [dialogDetalhesOpen, setDialogDetalhesOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("all");
  const [filtroPeriodo, setFiltroPeriodo] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogCancelarOpen, setDialogCancelarOpen] = useState(false);
  const [motivoCancelamento, setMotivoCancelamento] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [telefoneCliente, setTelefoneCliente] = useState("");
  const [enderecoCliente, setEnderecoCliente] = useState("");
  const [formaPagamento, setFormaPagamento] = useState<string>("pix");
  const [itensPedido, setItensPedido] = useState<ItemPedido[]>([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState("");
  const [filialPedido, setFilialPedido] = useState("");
  const [descontoPedido, setDescontoPedido] = useState(0);
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
      const responses = await Promise.all([
        getFilial(),
        getCliente(),
        getVendedor(),
        getProdutos(),
        getPedidos(),
        getFormasPagamento(),
        comercialService.listarTabela(),
        getEstoque()
      ]);

      const [filiais, clientes, vendedores, produtosRAW, pedidosAPI, formasPgtoAPI, tabelaPrecos, est] = responses;

      setEstoquesAPI(Array.isArray(est) ? est : []);

      const produtos = (produtosRAW || []).map((p: any) => {
        const tb = tabelaPrecos.find((t: any) => String(t.codproduto) === String(p.codproduto));
        return {
          ...p,
          preco_calculado: tb?.precificacao?.precoFinal || p.preco_promocao || p.preco_normal || 0,
          tem_preco_tabela: !!(tb?.precificacao?.precoFinal),
          desconto_maximo: tb?.precificacao?.descontoMaximo || 0
        };
      });

      setListaFiliais(filiais);
      setListarClientes(clientes);
      setListarVendedor(vendedores);
      setListarProdutos(produtos);
      setListaFormasPagamento(formasPgtoAPI || []);

      // Enriquecendo e nivelando os dados dos pedidos usando a tabela do banco de dados
      const pedidosCompletos = (pedidosAPI || []).map((p: any) => {
        const codCliente = p.codcliente || p.codcliente;
        const numPedido = p.numpedido || p.numero || p.id || Math.floor(Math.random() * 1000); // fallback provisorio se n tiver bd id
        const clienteReq = clientes.find((c: any) => String(c.codcliente) === String(codCliente));
        const filialReq = (filiais || []).find((f: any) => String(f.codfilial) === String(p.codfilial || p.filial));

        const itensTratados = (p.itens || p.mspedido_item || []).map((item: any, itemIdx: number) => {
          const idProd = item.codproduto ?? item.CODPRODUTO ?? item.produtoId ?? item.id_produto ?? item.coditem ?? `indefinido-${p.id}-${itemIdx}`;
          const prodLista = produtos.find((prod: any) => String(prod.codproduto) === String(idProd));
          const nomeProd = prodLista?.descricao || item.nomeProduto || item.Produto?.descricao || item.NOMEPRODUTO || `Produto ID: ${idProd}`;
          const qtd = Number(item.quantidade ?? item.QUANTIDADE ?? 1);
          const preco = Number(item.preco_unitario ?? item.PRECO_UNITARIO ?? item.preco ?? 0);

          if (!item.codproduto && !item.produtoId) {
            console.warn(`[Debug API] Um item do Pedido ${numPedido} retornou sem 'codproduto'. Verifica a extrutura do payload:`, item);
          }

          return {
            ...item,
            produtoId: String(idProd),
            nomeProduto: nomeProd,
            quantidade: qtd,
            preco: preco
          };
        });

        const codForma = p.CODPLPAG || p.codplpag || p.codforma || p.forma_pagamento || p.formaPagamento;
        const planoPgtoReq = (formasPgtoAPI || []).find((fp: any) => String(fp.CODPLPAG || fp.codplpag || fp.codforma || fp.id || fp.codplano) === String(codForma));

        return {
          ...p,
          id: String(numPedido),
          numero: String(p.codigo_venda || numPedido),
          codcliente: codCliente,
          subtotal: Number(p.subtotal || 0),
          desconto: Number(p.desconto || 0),
          total: Number(p.valor_total || p.total || 0),
          data: p.data_pedido || p.data || new Date().toISOString(),
          filial: p.codfilial || p.filial,
          nomeFilial: filialReq ? filialReq.filial : (rotulosFilial[p.filial] || p.filial),
          formaPagamento: String(codForma),
          nomeFormaPagamento: planoPgtoReq ? (planoPgtoReq.DESCRICAO || planoPgtoReq.descricao || planoPgtoReq.nome) : (p.formaPagamento || 'Não Informado'),
          nomeCliente: clienteReq ? clienteReq.nome : (p.nomeCliente || p.cliente?.nome || 'Cliente não encontrado'),
          telefoneCliente: clienteReq ? clienteReq.telefone : (p.telefoneCliente || p.cliente?.telefone || ''),
          motivo_cancelamento: p.motivo_cancelamento,
          data_cancelamento: p.data_cancelamento,
          usuarioCancelou: p.msusuario_mspedido_codusur_cancelouTomsusuario?.nome,
          itens: itensTratados
        };
      });

      setListaPedidos(pedidosCompletos);
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
    if (!codigoBusca) {
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

  async function buscarPlanoPorCodigo(codigo?: string) {
    const codigoBusca = codigo || codigoPlano;
    if (!codigoBusca) {
      setNomePlano("");
      return;
    }
    const plano = listaFormasPagamento.find(
      (fp) => String(fp.CODPLPAG || fp.codplpag || fp.codforma || fp.id || fp.codplano) === String(codigoBusca)
    );
    if (plano) {
      setNomePlano(plano.DESCRICAO || plano.descricao || plano.nome);
      setCodigoPlano(String(plano.CODPLPAG || plano.codplpag || plano.codforma || plano.id || plano.codplano));
    } else {
      setNomePlano("");
      toast.error("Plano de pagamento não encontrado");
    }
  }

  const clientesFiltrados = listaClientes.filter((c) => {
    const busca = buscaCliente.toLowerCase();
    const buscaNumerica = limparNumero(buscaCliente);

    return (
      (c.nome || "").toLowerCase().includes(busca) ||
      (buscaNumerica !== "" && String(c.codcliente || "").includes(buscaNumerica)) ||
      (buscaNumerica !== "" && limparNumero(c.cpf_cnpj || "").includes(buscaNumerica))
    );
  });
  const vendedorFiltrados = listaVendedor.filter((v) => {
    const busca = buscaVendedor.toLowerCase();
    const buscaNumerica = limparNumero(buscaVendedor);

    return (
      (v.nome || "").toLowerCase().includes(busca) ||
      (buscaNumerica !== "" && String(v.codvendedor || "").includes(buscaNumerica)) ||
      (buscaNumerica !== "" && limparNumero(v.cpf || "").includes(buscaNumerica))
    );
  });
  const PlanosFiltrados = listaFormasPagamento.filter((fp) => {
    const busca = buscaPlano.toLowerCase();
    const buscaNumerica = limparNumero(buscaPlano);
    return (
      ((fp.DESCRICAO || fp.descricao || fp.nome || "").toLowerCase().includes(busca)) ||
      (buscaNumerica !== "" && String(fp.CODPLPAG || fp.codplpag || fp.codforma || fp.id || fp.codplano || "").includes(buscaNumerica))
    );
  });
  const ProdutosFiltrados = listarProdutos.filter((p) => {
    const busca = buscarProduto.toLowerCase();
    const buscaNumerica = limparNumero(buscarProduto);

    return (
      (p.descricao || "").toLowerCase().includes(busca) ||
      (buscaNumerica !== "" && String(p.codproduto || "").includes(buscaNumerica))
    );
  });

  const filtrados = listaPedidos.filter((o) => {
    const isFilialSelecionadaMatriz = String(filialSelecionada).toLowerCase().includes("matriz");
    const isNomeFilialMatriz = String(o.nomeFilial || "").toLowerCase().includes("matriz");
    const matchMatriz = isFilialSelecionadaMatriz && isNomeFilialMatriz;

    const matchFilial = filialSelecionada === "todas" ||
      String(o.filial) === String(filialSelecionada) ||
      String(o.nomeFilial || "").toLowerCase().includes(String(filialSelecionada).toLowerCase()) ||
      matchMatriz;
    const nome = o.nomeCliente || (o.cliente && o.cliente.nome) || "";
    const matchSearch = nome.toLowerCase().includes(search.toLowerCase()) ||
      String(o.numero || "").includes(search);
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

    if (!produto) return false;

    const precoOriginal = Number(produto.preco_calculado);
    const precoInserido = Number(precoProduto);
    
    if (precoOriginal > 0 && precoInserido < precoOriginal) {
      const percDesconto = ((precoOriginal - precoInserido) / precoOriginal) * 100;
      const maxPermitido = Number(produto.desconto_maximo || 0);

      // Add a small epsilon to avoid floating point issues (e.g. 6.000000001 > 6)
      if (percDesconto > (maxPermitido + 0.01)) {
        toast.error(`Desconto não permitido! O limite para este item é de ${maxPermitido.toFixed(2)}% (inserido: ${percDesconto.toFixed(2)}%).`);
        return false;
      }
    }

    const allowOutOfStockOrders = localStorage.getItem("allowOutOfStockOrders") !== "false";

    if (!allowOutOfStockOrders) {
      const estoquesDoProduto = estoquesAPI.filter(e => String(e.codproduto) === String(produto.codproduto));
      let estoqueDisponivel = 0;
      
      if (filialPedido && filialPedido !== "todas") {
        const estFilial = estoquesDoProduto.find(e => String(e.codfilial) === filialPedido);
        estoqueDisponivel = estFilial ? estFilial.quantidade : 0;
      } else {
        estoqueDisponivel = estoquesDoProduto.reduce((acc, curr) => acc + curr.quantidade, 0);
      }
      
      const existente = itensPedido.find(i => i.produtoId === String(produto.codproduto));
      const qtdJáNoPedido = existente ? existente.quantidade : 0;
      const qtdPretendida = qtdJáNoPedido + qtdSelecionada;

      if (estoqueDisponivel < qtdPretendida) {
        toast.error(`Estoque insuficiente! Disponível: ${estoqueDisponivel}`);
        return false;
      }
    }

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
          preco: precoProduto,
        },
      ]);
    }

    // limpa depois de adicionar
    setBuscaProdutoInput("");
    setProdutoSelecionado("");
    setQtdSelecionada(1);
    setPrecoProduto(0);
    return true;
  };

  function buscarProdutos() {
    if (!buscaProdutoInput) return;

    const busca = buscaProdutoInput.toLowerCase().trim();

    // 1. Tentar busca exata por ID ou Código de Barras
    let produto = listarProdutos.find((p) =>
      String(p.codproduto) === busca ||
      String(p.codigoBarras) === busca ||
      String(p.codigo_barras) === busca
    );

    // 2. Se não achou exato, busca por descrição
    if (!produto) {
      produto = listarProdutos.find((p) =>
        (p.descricao || "").toLowerCase().includes(busca)
      );
    }

    if (produto) {
      if (!produto.tem_preco_tabela) {
        toast.error("Produto sem preço cadastrado na Tabela Comercial.");
        return;
      }
      setProdutoSelecionado(String(produto.codproduto));
      setPrecoProduto(Number(produto.preco_calculado) || 0);
    } else {
      toast.error("Produto não encontrado");
    }
  }

  const handleScanProduto = (text: string) => {
    setBuscaProdutoInput(text);
    const produtoEncontrado = listarProdutos.find(p => String(p.codigo_barras) === text || String(p.codigoBarras) === text || String(p.codproduto) === text);
    if(produtoEncontrado) {
       if (!produtoEncontrado.tem_preco_tabela) {
         toast.error("Produto sem preço cadastrado na Tabela Comercial.");
         return;
       }
       setProdutoSelecionado(String(produtoEncontrado.codproduto));
       setPrecoProduto(Number(produtoEncontrado.preco_calculado) || 0);
       toast.success("Produto encontrado!");
    } else {
       toast.error("Produto não encontrado pelo código lido.");
    }
  };

  const removerItem = (produtoId: string) => {
    setItensPedido((prev) => prev.filter((i) => i.produtoId !== produtoId));
  };

  const alterarQtdItem = (produtoId: string, novaQtd: number) => {
    if (novaQtd < 1) return;
    setItensPedido((prev) => prev.map((i) => i.produtoId === produtoId ? { ...i, quantidade: novaQtd } : i));
  };

  const subtotalPedido = itensPedido.reduce((s, i) => s + i.preco * i.quantidade, 0);
  const totalPedido = subtotalPedido - descontoPedido;

  const handleCriarPedido = async () => {
    if (!codigoCliente) {
      toast.error("Selecione um cliente para o pedido.");
      return;
    }
    if (!codigoVendedor) {
      toast.error("Selecione um vendedor.");
      return;
    }
    if (!filialPedido || filialPedido === "todas") {
      toast.error("Selecione uma filial específica de destino.");
      return;
    }
    if (!codigoPlano) {
      toast.error("Selecione um plano de pagamento.");
      return;
    }
    if (itensPedido.length === 0) {
      toast.error("Adicione pelo menos um item ao pedido.");
      return;
    }

    try {
      const payload = {
        codcliente: codigoCliente,
        codvendedor: codigoVendedor,
        codfilial: filialPedido,
        formaPagamento: codigoPlano,
        status: statusAtualPedido,
        desconto: descontoPedido,
        itens: itensPedido.map(i => ({
          codproduto: i.produtoId,
          quantidade: i.quantidade,
          preco_unitario: i.preco
        }))
      };

      if (idPedidoEdicao) {
        await updatePedido(idPedidoEdicao, payload);
        toast.success(`Pedido atualizado com sucesso!`);
      } else {
        await createPedido(payload);
        toast.success(`Pedido criado com sucesso!`);
      }

      carregarDados();
      window.dispatchEvent(new Event('pedidosChanged'));

      setDialogOpen(false);
      setIdPedidoEdicao(null);
      setNomeCliente("");
      setCodigoCliente("");
      setTelefoneCliente("");
      setEnderecoCliente("");
      setCodigoVendedor("");
      setNomeVendedor("");
      setItensPedido([]);
      setDescontoPedido(0);
      setCodigoPlano("");
      setNomePlano("");
      setFilialPedido("");

    } catch (error) {
      console.error(error);
      toast.error("Erro ao gravar pedido no banco de dados.");
    }
  };

  const atualizarStatus = async (pedidoId: string, status: Pedido["status"]) => {
    try {
      await alterarStatusPedido(pedidoId, status);
      setListaPedidos((prev) =>
        prev.map((o) => (o.id === String(pedidoId) ? { ...o, status } : o))
      );
      toast.success("Status atualizado!");
      window.dispatchEvent(new Event('pedidosChanged'));
    } catch {
      toast.error("Erro ao atualizar status do pedido.");
    }
  };

  const handleCancelarPedido = async () => {
    if (motivoCancelamento.trim().length < 15) {
      return toast.error("O motivo do cancelamento deve ter pelo menos 15 caracteres.");
    }

    setIsSubmitting(true);
    try {
      const codusur_cancelou = usuario?.codusur || null;
      await cancelarPedido(pedidoParaDetalhes.id, motivoCancelamento, codusur_cancelou);
      toast.success("Pedido cancelado e estoque devolvido com sucesso!");
      setDialogCancelarOpen(false);
      setMotivoCancelamento("");
      setDialogDetalhesOpen(false);
      carregarDados();
      window.dispatchEvent(new Event('pedidosChanged'));
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.error || "Erro ao cancelar o pedido");
    } finally {
      setIsSubmitting(false);
    }
  };

  const abrirModalEdicao = (pedido: any) => {
    setIdPedidoEdicao(String(pedido.id));
    setCodigoCliente(String(pedido.codcliente || pedido.clienteId || ''));
    setNomeCliente(pedido.nomeCliente || '');
    setTelefoneCliente(pedido.telefoneCliente || '');
    setCodigoVendedor(String(pedido.codusur_vendedor || pedido.vendedorId || ''));

    // fetch vendedor name optionally, or leave empty until loaded. As we already have 'vendedores', we can search it
    const vendReq = listaVendedor.find(v => String(v.codvendedor) === String(pedido.codusur_vendedor));
    if (vendReq) setNomeVendedor(vendReq.nome);

    setFilialPedido(String(pedido.codfilial || pedido.filial || ''));
    setStatusAtualPedido(String(pedido.status || 'EM_ABERTO').toUpperCase());
    setCodigoPlano(String(pedido.formaPagamento || ''));
    setNomePlano(pedido.nomeFormaPagamento || '');
    setDescontoPedido(pedido.desconto || 0);

    // Convertendo itens de banco para nosso layout state
    const formatItens = (pedido.itens || []).map((i: any) => {
      const prodId = i.produtoId || i.codproduto;
      return {
        produtoId: prodId ? String(prodId) : '',
        nomeProduto: i.nomeProduto || '',
        quantidade: Number(i.quantidade),
        preco: Number(i.preco || i.preco_unitario)
      }
    });
    setItensPedido(formatItens);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl md:text-3xl font-semibold text-primary">Pedidos</h2>
          <p className="text-sm text-muted-foreground mt-1">{rotuloFilial} • {filtrados.length} pedidos</p>
        </div>
        <Button onClick={() => {
          setIdPedidoEdicao(null);
          setNomeCliente("");
          setCodigoCliente("");
          setTelefoneCliente("");
          setEnderecoCliente("");

          const vendedorLogado = listaVendedor.find(v => 
            v.nome && usuario?.nome && v.nome.trim().toLowerCase() === usuario.nome.trim().toLowerCase()
          );

          if (vendedorLogado) {
            setCodigoVendedor(String(vendedorLogado.codvendedor));
            setNomeVendedor(vendedorLogado.nome);
          } else {
            setCodigoVendedor("");
            setNomeVendedor("");
          }

          setItensPedido([]);
          setDescontoPedido(0);
          setCodigoPlano("");
          setNomePlano("");
          setFilialPedido("");
          setStatusAtualPedido("EM_ABERTO");
          setDialogOpen(true);
        }}><Plus className="h-4 w-4 mr-2" /> Novo Pedido</Button>
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
        {/* VISUALIZAÇÃO MOBILE (CARDS) */}
        <div className="grid grid-cols-1 gap-4 md:hidden p-4 bg-transparent">
          {filtrados.map((pedido, i) => (
            <div key={pedido.id || `ped-m-${i}`} className="bg-background border border-border rounded-lg p-4 space-y-3 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-foreground text-sm">Pedido #{pedido.numero}</h4>
                  <p className="text-base font-medium text-foreground mt-1">{pedido.nomeCliente}</p>
                  <p className="text-xs text-muted-foreground">{pedido.telefoneCliente}</p>
                </div>
                <div className="text-right">
                  <div className="font-bold text-primary">R$ {Number(pedido.total || 0).toLocaleString("pt-BR")}</div>
                  <Badge variant="outline" className="text-[10px] mt-1">{pedido.nomeFilial}</Badge>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3">
                <span className="flex items-center gap-1">📅 {new Date(pedido.data).toLocaleDateString("pt-BR")}</span>
                <span className="font-medium text-foreground">{pedido.nomeFormaPagamento}</span>
              </div>
              
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <Select value={pedido.status} onValueChange={(v) => atualizarStatus(pedido.id, v as Pedido["status"])} disabled={pedido.status === 'FINALIZADO'}>
                  <SelectTrigger className="h-8 text-xs border bg-muted/30 w-auto px-2">
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
                
                <div className="flex gap-2">
                  <button
                    onClick={() => abrirModalEdicao(pedido)}
                    disabled={pedido.status === 'FINALIZADO'}
                    className={`p-2 rounded-md border border-border bg-background transition-colors flex items-center justify-center ${pedido.status === 'FINALIZADO' ? 'opacity-50 cursor-not-allowed text-muted-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                    title={pedido.status === 'FINALIZADO' ? "Pedidos finalizados não podem ser editados" : "Editar Pedido"}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      setPedidoParaDetalhes(pedido);
                      setDialogDetalhesOpen(true);
                    }}
                    className="p-2 rounded-md border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex items-center justify-center"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => gerarEspelhoPedido(pedido)}
                    className="p-2 rounded-md border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex items-center justify-center"
                    title="Emitir Espelho (PDF)"
                  >
                    <FileText className="h-4 w-4 text-blue-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* VISUALIZAÇÃO DESKTOP (TABELA) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nº</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Cliente</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Pagamento</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Data</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Filial</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((pedido, i) => (
                <tr key={pedido.id || `ped-${i}`} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{pedido.numero}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{pedido.nomeCliente}</div>
                    <div className="text-xs text-muted-foreground">{pedido.telefoneCliente}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">R$ {Number(pedido.total || 0).toLocaleString("pt-BR")}</td>
                  <td className="px-4 py-3 text-center text-muted-foreground">{pedido.nomeFormaPagamento}</td>
                  <td className="px-4 py-3 text-center">
                    <Select value={pedido.status} onValueChange={(v) => atualizarStatus(pedido.id, v as Pedido["status"])} disabled={pedido.status === 'FINALIZADO'}>
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
                    <Badge variant="outline" className="text-[10px]">{pedido.nomeFilial}</Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => abrirModalEdicao(pedido)}
                      disabled={pedido.status === 'FINALIZADO'}
                      className={`p-1.5 rounded-md transition-colors ${pedido.status === 'FINALIZADO' ? 'opacity-50 cursor-not-allowed text-muted-foreground' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`}
                      title={pedido.status === 'FINALIZADO' ? "Pedidos finalizados não podem ser editados" : "Editar Pedido"}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setPedidoParaDetalhes(pedido);
                        setDialogDetalhesOpen(true);
                      }}
                      className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="Ver Detalhes"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => gerarEspelhoPedido(pedido)}
                      className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="Emitir Espelho (PDF)"
                    >
                      <FileText className="h-4 w-4 text-blue-500" />
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
        <DialogContent 
          aria-describedby={undefined} 
          className="w-[95vw] md:max-w-4xl lg:max-w-5xl max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => {
            e.preventDefault();
            if (dialogClienteOpen || dialogVendedorOpen || dialogPlanoOpen || scannerOpen) return;
            if (window.confirm("Você tem um pedido em andamento. Deseja realmente fechar sem salvar?")) {
              setDialogOpen(false);
            }
          }}
          onEscapeKeyDown={(e) => {
            e.preventDefault();
            if (dialogClienteOpen || dialogVendedorOpen || dialogPlanoOpen || scannerOpen) return;
            if (window.confirm("Você tem um pedido em andamento. Deseja realmente fechar sem salvar?")) {
              setDialogOpen(false);
            }
          }}
        >
          <DialogHeader>
            <DialogTitle className="font-display text-xl">{idPedidoEdicao ? "Editar Pedido" : "Novo Pedido"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Filial</Label>
              <Select value={filialPedido} onValueChange={setFilialPedido}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {listaFiliais.map((b, i) => (
                    <SelectItem key={b.codfilial || `filial-${i}`} value={String(b.codfilial)}>{b.filial}</SelectItem>
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



              <div className="grid grid-cols-12 gap-2 md:gap-3 items-end mb-3">

                {/* CÓDIGO */}
                <div className="col-span-12 sm:col-span-6 md:col-span-3">
                  <Label>Cód. Barras</Label>
                  <div className="flex gap-2">
                    <Input
                      ref={refCodigo}
                      placeholder="Código"
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
                    <Button
                      type="button"
                      variant="outline"
                      className="px-2"
                      onClick={() => setDialogProdutoOpen(true)}
                    >
                      ...
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="px-2"
                      onClick={() => setScannerOpen(true)}
                      title="Ler Código de Barras"
                    >
                      <ScanBarcode className="h-4 w-4 text-primary" />
                    </Button>
                  </div>
                </div>

                {/* DESCRIÇÃO */}
                <div className="col-span-12 sm:col-span-6 md:col-span-3">
                  <Label>Descrição</Label>
                  <Input
                    value={
                      listarProdutos.find(p => String(p.codproduto) === produtoSelecionado)?.descricao || ""
                    }
                    readOnly
                  />
                </div>

                {/* EMBALAGEM */}
                <div className="col-span-4 sm:col-span-4 md:col-span-2">
                  <Label>Emb.</Label>
                  <Input
                    value={
                      listarProdutos.find(p => String(p.codproduto) === produtoSelecionado)?.embalagem || "UN"
                    }
                    readOnly
                  />
                </div>

                {/* QUANTIDADE */}
                <div className="col-span-4 sm:col-span-4 md:col-span-2">
                  <Label>Qtd.</Label>
                  <Input
                    ref={refQtd}
                    type="number"
                    value={qtdSelecionada}
                    placeholder="Qtd"
                    onChange={(e) => setQtdSelecionada(Number(e.target.value))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        refPreco.current?.focus();
                      }
                    }}
                  />
                </div>

                {/* PREÇO */}
                <div className="col-span-4 sm:col-span-4 md:col-span-2">
                  <Label>Preço</Label>
                  <Input
                    ref={refPreco}
                    type="number"
                    value={precoProduto}
                    onChange={(e) => setPrecoProduto(Number(e.target.value))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const sucesso = adicionarItem();
                        if (sucesso) {
                          refCodigo.current?.focus();
                        }
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
                  {itensPedido.map((item, i) => (
                    <div key={item.produtoId || `prod-${i}`} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm border-b pb-2 last:border-0 last:pb-0">
                      <span className="text-foreground font-medium flex-1 overflow-hidden text-ellipsis whitespace-nowrap" title={item.nomeProduto}>
                        {item.nomeProduto}
                      </span>
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col w-16">
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Qtd</span>
                          <input
                            type="number"
                            className="w-full bg-background border rounded-md text-sm font-medium outline-none text-center h-7"
                            value={item.quantidade}
                            onChange={(e) => alterarQtdItem(item.produtoId, Number(e.target.value))}
                            min={1}
                          />
                        </div>
                        <div className="flex items-center gap-4 text-right">
                          <div className="flex flex-col w-20">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Unitário</span>
                            <span className="text-sm font-medium text-foreground h-7 flex items-center justify-end">R$ {Number(item.preco || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex flex-col w-24">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Total</span>
                            <span className="text-sm font-bold text-primary h-7 flex items-center justify-end">R$ {((item.preco || 0) * (item.quantidade || 0)).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                        <button type="button" onClick={() => removerItem(item.produtoId)} className="text-destructive hover:text-destructive/80 p-1 ml-2 mt-4">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="border-t border-border pt-2 flex justify-between font-medium">
                    <span>Subtotal</span>
                    <span className="text-muted-foreground">R$ {(subtotalPedido || 0).toLocaleString("pt-BR")}</span>
                  </div>
                  
                  <div className="flex justify-between font-medium items-center">
                    <span className="text-sm">Desconto</span>
                    <div className="flex items-center">
                      <span className="mr-2 text-sm text-muted-foreground">R$</span>
                      <Input
                        type="number"
                        className="w-20 h-8 text-right bg-transparent"
                        value={descontoPedido}
                        onChange={(e) => setDescontoPedido(Number(e.target.value))}
                        min={0}
                      />
                    </div>
                  </div>

                  <div className="border-t border-border pt-2 flex justify-between font-bold text-lg">
                    <span>Total Final</span>
                    <span className="text-primary">R$ {(totalPedido || 0).toLocaleString("pt-BR")}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-1">
                <Label>Plano de Pagamento</Label>
                <div className="flex gap-2">
                  <Input
                    value={codigoPlano}
                    onChange={(e) => setCodigoPlano(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        buscarPlanoPorCodigo(e.currentTarget.value);
                      }
                    }}
                    placeholder="Código"
                    className="w-28"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogPlanoOpen(true)}
                  >
                    ...
                  </Button>
                  <Input
                    value={nomePlano}
                    readOnly
                    placeholder="Nome do Plano"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-1 flex flex-col justify-end pb-2">
                <div className="flex items-center space-x-2 p-2 border rounded-md bg-muted/30">
                  <Switch
                    checked={statusAtualPedido === "FINALIZADO"}
                    onCheckedChange={(checked) => setStatusAtualPedido(checked ? "FINALIZADO" : "EM_ABERTO")}
                  />
                  <Label 
                    className="cursor-pointer text-sm font-medium select-none flex-1" 
                    onClick={() => setStatusAtualPedido(statusAtualPedido === "FINALIZADO" ? "EM_ABERTO" : "FINALIZADO")}
                  >
                    Já foi pago? (Finalizar Pedido)
                  </Label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCriarPedido}>{idPedidoEdicao ? "Gravar Alterações" : "Criar Pedido"}</Button>
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
            {clientesFiltrados.map((c, i) => (
              <div
                key={c.codcliente || `cli-${i}`}
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
            {vendedorFiltrados.map((v, i) => (
              <div
                key={v.codvendedor || `vend-${i}`}
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
      {/* -------------- DIALOG PRODUTO -------------*/}
      <Dialog open={dialogProdutoOpen} onOpenChange={setDialogProdutoOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Selecionar Produto</DialogTitle>
          </DialogHeader>

          {/* BUSCA */}
          <Input
            placeholder="Buscar por código ou descrição..."
            value={buscarProduto}
            onChange={(e) => setBuscarproduto(e.target.value)}
          />

          {/* LISTA */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto mt-3">
            {ProdutosFiltrados.map((p, i) => (
              <div
                key={p.codproduto || `prod2-${i}`}
                className="p-3 border rounded cursor-pointer hover:bg-muted"
                onClick={() => {
                  setProdutoSelecionado(String(p.codproduto));
                  setBuscaProdutoInput(String(p.codproduto));
                  setPrecoProduto(Number(p.preco_normal) || 0);
                  setDialogProdutoOpen(false);
                  setTimeout(() => refQtd.current?.focus(), 100);
                }}
              >
                <div className="font-medium">{p.descricao}</div>
                <div className="text-xs text-muted-foreground flex justify-between mt-1">
                  <span>Código: {p.codproduto}</span>
                  <span className="font-medium text-foreground">R$ {Number(p.preco_normal || 0).toLocaleString("pt-BR")}</span>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* -------------- DIALOG PLANO DE PAGAMENTO -------------*/}
      <Dialog open={dialogPlanoOpen} onOpenChange={setDialogPlanoOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Selecionar Plano de Pagamento</DialogTitle>
          </DialogHeader>

          <Input
            placeholder="Buscar plano..."
            value={buscaPlano}
            onChange={(e) => setBuscaPlano(e.target.value)}
          />

          <div className="space-y-2 max-h-[400px] overflow-y-auto mt-3">
            {PlanosFiltrados.map((fp, i) => {
              const codPlano = fp.CODPLPAG || fp.codplpag || fp.codforma || fp.id || fp.codplano || `plano-${i}`;
              const desc = fp.DESCRICAO || fp.descricao || fp.nome || "Plano Indefinido";
              return (
                <div
                  key={codPlano}
                  className="p-3 border rounded cursor-pointer hover:bg-muted"
                  onClick={() => {
                    setCodigoPlano(String(codPlano));
                    setNomePlano(desc);
                    setDialogPlanoOpen(false);
                  }}
                >
                  <div className="font-medium">{desc}</div>
                  <div className="text-xs text-muted-foreground">
                    Código: {codPlano}
                  </div>
                </div>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* -------------- DIALOG DETALHES DO PEDIDO -------------*/}
      <Dialog open={dialogDetalhesOpen} onOpenChange={setDialogDetalhesOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido #{pedidoParaDetalhes?.numero}</DialogTitle>
          </DialogHeader>
          {pedidoParaDetalhes && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold">Cliente: <span className="font-normal text-muted-foreground">{pedidoParaDetalhes.nomeCliente}</span></p>
                <p className="text-sm font-semibold">Status: <span className="font-normal text-muted-foreground">{rotulosStatus[pedidoParaDetalhes.status] || pedidoParaDetalhes.status}</span></p>
                <p className="text-sm font-semibold">Pagamento: <span className="font-normal text-muted-foreground">{pedidoParaDetalhes.nomeFormaPagamento}</span></p>
              </div>

              {pedidoParaDetalhes.status === "CANCELADO" && pedidoParaDetalhes.motivo_cancelamento && (
                <div className="bg-red-50 p-3 rounded-md border border-red-100">
                  <h4 className="font-semibold text-red-800 text-sm mb-1">Informações do Cancelamento</h4>
                  <p className="text-sm text-red-700"><strong>Data:</strong> {new Date(pedidoParaDetalhes.data_cancelamento).toLocaleString("pt-BR")}</p>
                  <p className="text-sm text-red-700"><strong>Usuário:</strong> {pedidoParaDetalhes.usuarioCancelou || 'Não informado'}</p>
                  <p className="text-sm text-red-700"><strong>Motivo:</strong> {pedidoParaDetalhes.motivo_cancelamento}</p>
                </div>
              )}

              <div>
                <h4 className="font-medium border-b pb-1 mb-2">Itens do Pedido</h4>
                {(!pedidoParaDetalhes.itens || pedidoParaDetalhes.itens.length === 0) ? (
                  <p className="text-sm text-muted-foreground">Nenhum item encontrado.</p>
                ) : (
                  <ul className="space-y-2 max-h-[250px] overflow-y-auto">
                    {pedidoParaDetalhes.itens.map((item: any, idx: number) => {
                      const nome = item.nomeProduto || item.Produto?.descricao || `Produto ID: ${item.produtoId}`;
                      const qtd = item.quantidade || 1;
                      const preco = Number(item.preco || 0);
                      return (
                        <li key={idx} className="flex justify-between text-sm">
                          <span>{qtd}x {nome}</span>
                          <span className="font-medium text-muted-foreground">R$ {(qtd * preco).toLocaleString("pt-BR")}</span>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
              <div className="flex justify-between items-center border-t pt-3">
                <span className="font-semibold text-lg">Total</span>
                <span className="font-bold text-lg text-primary">R$ {Number(pedidoParaDetalhes.total || 0).toLocaleString("pt-BR")}</span>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-border mt-4">
                {pedidoParaDetalhes.status !== "CANCELADO" && (
                  <Button 
                    variant="destructive"
                    className="mr-auto"
                    onClick={() => {
                      setMotivoCancelamento("");
                      setDialogCancelarOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Cancelar Pedido
                  </Button>
                )}

                <Button onClick={() => {
                  let txt = `*Pedido #${pedidoParaDetalhes.numero}*\n`;
                  txt += `Cliente: ${pedidoParaDetalhes.nomeCliente}\n\n`;
                  txt += `*Itens:*\n`;
                  (pedidoParaDetalhes.itens || []).forEach((item: any) => {
                    const nome = item.nomeProduto || item.Produto?.descricao || `Produto ID: ${item.produtoId}`;
                    txt += `- ${item.quantidade}x ${nome} (R$ ${Number(item.preco).toLocaleString('pt-BR')})\n`;
                  });
                  txt += `\n*TOTAL: R$ ${Number(pedidoParaDetalhes.total).toLocaleString('pt-BR')}*`;
                  navigator.clipboard.writeText(txt);
                  toast.success("Resumo do pedido copiado para a área de transferência!");
                }}>
                  Copiar Detalhes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* DIALOG CANCELAR PEDIDO */}
      <Dialog open={dialogCancelarOpen} onOpenChange={setDialogCancelarOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Cancelar Pedido</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              ATENÇÃO: Se o pedido já estiver finalizado, o estoque será devolvido automaticamente.
              Esta operação não pode ser desfeita.
            </p>
            <div className="space-y-2">
              <Label>Motivo do Cancelamento <span className="text-red-500">*</span></Label>
              <Input 
                placeholder="Descreva o motivo (mínimo 15 caracteres)..." 
                value={motivoCancelamento} 
                onChange={e => setMotivoCancelamento(e.target.value)} 
              />
              <p className="text-xs text-muted-foreground text-right">
                {motivoCancelamento.length}/15 caracteres mínimos
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogCancelarOpen(false)} disabled={isSubmitting}>Voltar</Button>
            <Button variant="destructive" onClick={handleCancelarPedido} disabled={isSubmitting || motivoCancelamento.trim().length < 15}>
              {isSubmitting ? "Cancelando..." : "Confirmar Cancelamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BarcodeScannerModal 
        open={scannerOpen} 
        onOpenChange={setScannerOpen} 
        onScan={handleScanProduto} 
      />
    </div>
  );
};

export default Orders;
