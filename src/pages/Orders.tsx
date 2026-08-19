import { useState, useRef, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { generatePixPayload } from "@/utils/pix";
import { pedidos as pedidosIniciais, produtos, rotulosStatus, coresStatus, rotulosFormaPagamento, rotulosFilial, Pedido, ItemPedido } from "@/data/mockData";
import { getFilial } from '@/services/filialService'
import { getCliente } from '@/services/clienteService'
import { getVendedores } from '@/services/vendedorService'
import { getProdutos } from '@/services/produtosService'
import { getFormasPagamento } from '@/services/formaPagamentoService'
import { createPedido, getPedidos, updatePedido, alterarStatusPedido, cancelarPedido } from '@/services/pedidosService'
import { getKits } from '@/services/kitsService'
import { getEstoque } from "@/services/estoqueService";
import api from "@/services/api";
import { useBranch } from "@/contexts/BranchContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Search, Eye, ClipboardList, Trash2, Pencil, ScanBarcode, FileText, RefreshCw, PackageOpen, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

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
  const [estoquesAPI, setEstoquesAPI] = useState<any[]>([]);

  const [idPedidoEdicao, setIdPedidoEdicao] = useState<string | null>(null);
  const [statusAtualPedido, setStatusAtualPedido] = useState("EM_ABERTO");
  const [codigoPlano, setCodigoPlano] = useState("");
  const [nomePlano, setNomePlano] = useState("");
  const [pagamentosVenda, setPagamentosVenda] = useState<{ codplano: string, nome: string, valor: number, parcelas: number, acrescimo_aplicado?: number, bandeira?: string, vencimento?: string }[]>([]);
  const [valorPagamentoAtual, setValorPagamentoAtual] = useState<string>("");
  const [parcelas, setParcelas] = useState("1");
  const [observacoes, setObservacoes] = useState("");
  const [mostrarPix, setMostrarPix] = useState(false);
  const [dialogPlanoOpen, setDialogPlanoOpen] = useState(false);
  const [dialogCaixaFechadoOpen, setDialogCaixaFechadoOpen] = useState(false);
  const [validationError, setValidationError] = useState<{title: string, message: string} | null>(null);
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
  
  const hoje = new Date();
  hoje.setMinutes(hoje.getMinutes() - hoje.getTimezoneOffset());
  const hojeStr = hoje.toISOString().split('T')[0];
  const [dataInicio, setDataInicio] = useState(hojeStr);
  const [dataFim, setDataFim] = useState(hojeStr);

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
  const [acrescimoPedido, setAcrescimoPedido] = useState(0);
  const [valorFrete, setValorFrete] = useState(0);
  const [qtdSelecionada, setQtdSelecionada] = useState(1);
  const [loading, setLoading] = useState(false);
  const [totalCalculadoPedido, setTotalCalculadoPedido] = useState(0);
  const [modoCobrancaCartao, setModoCobrancaCartao] = useState("PERCENTUAL");
  const [bandeiraSelecionada, setBandeiraSelecionada] = useState("");
  const [regrasBandeiras, setRegrasBandeiras] = useState<any>({});
  const [perguntarVencimentoCrediario, setPerguntarVencimentoCrediario] = useState(false);
  const [dataVencimentoCrediario, setDataVencimentoCrediario] = useState("");

  const [kitsAtivos, setKitsAtivos] = useState<any[]>([]);
  const [kitsDetectados, setKitsDetectados] = useState<{ id: number, nome: string, economia: number, qtd: number, aplicado: boolean }[]>([]);
  const [descontoKits, setDescontoKits] = useState(0);

  // Reseta o botão de PIX ao mudar de plano ou fechar o modal
  useEffect(() => {
    setMostrarPix(false);
  }, [nomePlano, dialogOpen]);

  const [erro, setErro] = useState<string | null>(null);
  const refCodigo = useRef<HTMLInputElement>(null);
  const refQtd = useRef<HTMLInputElement>(null);
  const refPreco = useRef<HTMLInputElement>(null);

  useEffect(() => {
    carregarDados();
  }, []);

  // Recalcular os itens do carrinho ao mudar o plano de pagamento
  useEffect(() => {
    if (itensPedido.length > 0 && listarProdutos.length > 0) {
      if (pagamentosVenda.length > 0) return; // Travar preço se já iniciou múltiplos pagamentos
      
      const planoAtivo = listaFormasPagamento.find(fp => String(fp.CODPLPAG || fp.codplpag || fp.codforma || fp.id || fp.codplano) === String(codigoPlano));
      const isCartao = ["CARTAO", "CARTAO_CREDITO", "CARTAO_DEBITO", "CREDIARIO"].includes(planoAtivo?.tipo_pagamento);
      
      setItensPedido(prev => prev.map(item => {
        const prod = listarProdutos.find(p => String(p.codproduto) === item.produtoId);
        if (prod) {
          const precoCartao = Number(prod.preco_cartao || 0);
          const precoNormal = Number(prod.preco_calculado || 0);
          
          // Se for cartão E houver preço de cartão definido, usa o preço de cartão SOMENTE SE for PRECO_FIXO.
          let precoIdeal = precoNormal;
          if (isCartao && modoCobrancaCartao === "PRECO_FIXO" && precoCartao > 0) {
            precoIdeal = precoCartao;
          }
          
          if (item.preco !== precoIdeal) {
            return { ...item, preco: precoIdeal };
          }
        }
        return item;
      }));
    }
  }, [nomePlano, codigoPlano, listarProdutos, pagamentosVenda.length, modoCobrancaCartao]);

  // Motor de Auto-detecção de Kits
  useEffect(() => {
    if (kitsAtivos.length === 0 || itensPedido.length === 0) {
      setKitsDetectados([]);
      return;
    }

    const mapCart = new Map<string, number>();
    itensPedido.forEach(i => {
      mapCart.set(String(i.produtoId), (mapCart.get(String(i.produtoId)) || 0) + i.quantidade);
    });

    const detected: any[] = [];
    const sortedKits = [...kitsAtivos].sort((a, b) => b.economia - a.economia);

    sortedKits.forEach(kit => {
      if (!kit.itens || kit.itens.length === 0) return;
      let maxAplicacoes = 99999;

      for (const item of kit.itens) {
        const prodId = String(item.produto_id);
        const qtdCarrinho = mapCart.get(prodId) || 0;
        const qtdKit = item.quantidade;
        if (qtdKit > 0) {
          const aplicacoesPossiveis = Math.floor(qtdCarrinho / qtdKit);
          if (aplicacoesPossiveis < maxAplicacoes) {
            maxAplicacoes = aplicacoesPossiveis;
          }
        }
      }

      if (maxAplicacoes > 0 && maxAplicacoes !== 99999) {
        for (const item of kit.itens) {
          const prodId = String(item.produto_id);
          const current = mapCart.get(prodId) || 0;
          mapCart.set(prodId, current - (item.quantidade * maxAplicacoes));
        }
        
        detected.push({
          id: kit.id,
          nome: kit.nome,
          economia: kit.economia * maxAplicacoes,
          qtd: maxAplicacoes
        });
      }
    });

    setKitsDetectados(prev => {
      const prevMap = new Map(prev.map(p => [p.id, p.aplicado]));
      return detected.map(d => ({
        ...d,
        aplicado: prevMap.get(d.id) === true
      }));
    });
  }, [itensPedido, kitsAtivos]);

  useEffect(() => {
    const desconto = kitsDetectados.filter(k => k.aplicado).reduce((sum, k) => sum + k.economia, 0);
    setDescontoKits(desconto);
  }, [kitsDetectados]);

  async function carregarDados() {
    setLoading(true);
    setErro(null);

    try {
      // 1. Fetch only what is needed for the orders list immediately
      const responses = await Promise.all([
        getFilial(),
        getPedidos({ dataInicio, dataFim }),
        getFormasPagamento(),
      ]);

      const [filiais, pedidosAPI, formasPgtoAPI] = responses;
      setListaFiliais(filiais);
      setListaFormasPagamento(formasPgtoAPI || []);

      const pedidosCompletos = (pedidosAPI || []).map((p: any) => {
        const codCliente = p.codcliente || p.codcliente;
        const numPedido = p.numpedido || p.numero || p.id || Math.floor(Math.random() * 1000); 
        const filialReq = (filiais || []).find((f: any) => String(f.codfilial) === String(p.codfilial || p.filial));

        const itensTratados = (p.itens || p.mspedido_item || []).map((item: any, itemIdx: number) => {
          const idProd = item.codproduto ?? item.CODPRODUTO ?? item.produtoId ?? item.id_produto ?? item.coditem ?? `indefinido-${p.id}-${itemIdx}`;
          const nomeProd = item.msproduto?.descricao || item.nomeProduto || item.Produto?.descricao || item.NOMEPRODUTO || `Produto ID: ${idProd}`;
          const qtd = Number(item.quantidade ?? item.QUANTIDADE ?? 1);
          const preco = Number(item.preco_unitario ?? item.PRECO_UNITARIO ?? item.preco ?? 0);

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
        const vendedorNome = p.msusuario_mspedido_codusur_vendedorTomsusuario?.nome || p.vendedor?.nome || p.nomeVendedor || "Vendedor";

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
          formaPagamento: codForma,
          nomeFormaPagamento: planoPgtoReq ? (planoPgtoReq.DESCRICAO || planoPgtoReq.descricao || planoPgtoReq.nome) : (p.formaPagamento || 'Não Informado'),
          parcelas: p.parcelas || 1,
          observacoes: p.observacoes || "",
          status: p.status || p.STATUS || "EM_DIGITACAO",
          nomeCliente: p.mscliente?.nome || p.nomeCliente || p.cliente?.nome || 'Cliente não encontrado',
          telefoneCliente: p.mscliente?.telefone || p.telefoneCliente || p.cliente?.telefone || '',
          motivo_cancelamento: p.motivo_cancelamento,
          data_cancelamento: p.data_cancelamento,
          usuarioCancelou: p.msusuario_mspedido_codusur_cancelouTomsusuario?.nome,
          nomeVendedor: vendedorNome,
          vendedorId: p.codusur_vendedor || p.vendedorId || "",
          itens: itensTratados
        };
      });

      setListaPedidos(pedidosCompletos);

      // 2. Fetch the heavy data in the background (non-blocking)
      Promise.all([
        getCliente(),
        getVendedores(),
        getProdutos(),
        comercialService.listarTabela(),
        getEstoque(),
        getKits(),
        api.get("/configuracoes").catch(() => ({ data: {} }))
      ]).then(([clientes, vendedores, produtosRAW, tabelaPrecos, est, kitsData, configRes]) => {
        if (configRes && configRes.data) {
          setModoCobrancaCartao(configRes.data.modo_cobranca_cartao || "PERCENTUAL");
          setPerguntarVencimentoCrediario(configRes.data.perguntar_vencimento_crediario === true);
        }
        setListarClientes(clientes);
        setListarVendedor(vendedores);
        setEstoquesAPI(Array.isArray(est) ? est : []);
        setKitsAtivos(Array.isArray(kitsData) ? kitsData.filter((k: any) => k.ativo === "S") : []);
        
        const tabelaPrecosSafe = Array.isArray(tabelaPrecos) ? tabelaPrecos : [];
        const produtosList = (produtosRAW || []).map((p: any) => {
          const tb = tabelaPrecosSafe.find((t: any) => String(t.codproduto) === String(p.codproduto));
          return {
            ...p,
            preco_calculado: tb?.precificacao?.precoFinal || p.preco_normal || 0,
            tem_preco_tabela: !!(tb?.precificacao?.precoFinal),
            desconto_maximo: tb?.precificacao?.descontoMaximo || 0
          };
        });
        setListarProdutos(produtosList);
      }).catch(err => console.error("Background data fetch error:", err));

    } catch (e) {
      toast.error("Erro ao carregar os dados iniciais.");
    } finally {
      setLoading(false);
    }
  }

  async function recarregarProdutos() {
    try {
      toast.info("Atualizando produtos...", { duration: 1500 });
      const [produtosRAW, tabelaPrecos, est] = await Promise.all([
        getProdutos(),
        comercialService.listarTabela(),
        getEstoque()
      ]);
      setEstoquesAPI(Array.isArray(est) ? est : []);
      const tabelaPrecosSafe = Array.isArray(tabelaPrecos) ? tabelaPrecos : [];
      const produtosList = (produtosRAW || []).map((p: any) => {
        const tb = tabelaPrecosSafe.find((t: any) => String(t.codproduto) === String(p.codproduto));
        return {
          ...p,
          preco_calculado: tb?.precificacao?.precoFinal || p.preco_normal || 0,
          tem_preco_tabela: !!(tb?.precificacao?.precoFinal),
          desconto_maximo: tb?.precificacao?.descontoMaximo || 0
        };
      });
      setListarProdutos(produtosList);
      toast.success("Produtos atualizados com sucesso!");
    } catch (e) {
      toast.error("Erro ao recarregar produtos.");
    }
  }

  async function buscarPedidosFiltrados() {
    setLoading(true);
    setErro(null);
    try {
      const pedidosAPI = await getPedidos({ dataInicio, dataFim });
      const pedidosCompletos = (pedidosAPI || []).map((p: any) => {
        const codCliente = p.codcliente || p.codcliente;
        const numPedido = p.numpedido || p.numero || p.id || Math.floor(Math.random() * 1000); 
        const clienteReq = listaClientes.find((c: any) => String(c.codcliente) === String(codCliente));
        const filialReq = (listaFiliais || []).find((f: any) => String(f.codfilial) === String(p.codfilial || p.filial));

        const itensTratados = (p.itens || p.mspedido_item || []).map((item: any, itemIdx: number) => {
          const idProd = item.codproduto ?? item.CODPRODUTO ?? item.produtoId ?? item.id_produto ?? item.coditem ?? `indefinido-${p.id}-${itemIdx}`;
          const nomeProd = item.msproduto?.descricao || item.nomeProduto || item.Produto?.descricao || item.NOMEPRODUTO || `Produto ID: ${idProd}`;
          const qtd = Number(item.quantidade ?? item.QUANTIDADE ?? 1);
          const preco = Number(item.preco_unitario ?? item.PRECO_UNITARIO ?? item.preco ?? 0);

          return {
            ...item,
            produtoId: String(idProd),
            nomeProduto: nomeProd,
            quantidade: qtd,
            preco: preco
          };
        });

        const codForma = p.CODPLPAG || p.codplpag || p.codforma || p.forma_pagamento || p.formaPagamento;
        const planoPgtoReq = (listaFormasPagamento || []).find((fp: any) => String(fp.CODPLPAG || fp.codplpag || fp.codforma || fp.id || fp.codplano) === String(codForma));
        const vendedorNome = p.msusuario_mspedido_codusur_vendedorTomsusuario?.nome || p.vendedor?.nome || p.nomeVendedor || "Vendedor";

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
          formaPagamento: codForma,
          nomeFormaPagamento: planoPgtoReq ? (planoPgtoReq.DESCRICAO || planoPgtoReq.descricao || planoPgtoReq.nome) : (p.formaPagamento || 'Não Informado'),
          parcelas: p.parcelas || 1,
          observacoes: p.observacoes || "",
          status: p.status || p.STATUS || "EM_DIGITACAO",
          nomeCliente: p.mscliente?.nome || p.nomeCliente || p.cliente?.nome || 'Cliente não encontrado',
          telefoneCliente: p.mscliente?.telefone || p.telefoneCliente || p.cliente?.telefone || '',
          motivo_cancelamento: p.motivo_cancelamento,
          data_cancelamento: p.data_cancelamento,
          usuarioCancelou: p.msusuario_mspedido_codusur_cancelouTomsusuario?.nome,
          nomeVendedor: vendedorNome,
          vendedorId: p.codusur_vendedor || p.vendedorId || "",
          itens: itensTratados
        };
      });

      setListaPedidos(pedidosCompletos);
    } catch (e) {
      toast.error("Erro ao buscar pedidos para a data informada.");
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

  function formatarCpfCnpj(valor: string | null | undefined) {
    if (!valor) return "Não informado";
    valor = String(valor).replace(/\D/g, "");

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
      setParcelas("1");
      setBandeiraSelecionada("");
      let bnd = {};
      if (plano.regras_parcelamento) {
        try {
           const parsed = JSON.parse(plano.regras_parcelamento);
           if (parsed && parsed.bandeiras) {
             bnd = parsed.bandeiras;
           }
        } catch(e){}
      }
      setRegrasBandeiras(bnd);
      if (Object.keys(bnd).length > 0) {
        setBandeiraSelecionada(Object.keys(bnd)[0]);
      }
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
          preco_cartao: Number(produto.preco_cartao || produto.preco_normal || 0),
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
      const allowWithoutPrice = localStorage.getItem("allowProductsWithoutPrice") === "true";
      if (!produto.tem_preco_tabela && !allowWithoutPrice) {
        toast.error("Produto sem preço cadastrado na Tabela Comercial.");
        return;
      }
      const planoAtivo = listaFormasPagamento.find(fp => String(fp.CODPLPAG || fp.codplpag || fp.codforma || fp.id || fp.codplano) === String(codigoPlano));
      const isCartao = ["CARTAO", "CARTAO_CREDITO", "CARTAO_DEBITO", "CREDIARIO"].includes(planoAtivo?.tipo_pagamento) && pagamentosVenda.length === 0;
      const precoCartao = Number(produto.preco_cartao || 0);
      const precoNormal = Number(produto.preco_calculado || 0);
      const precoFinal = (isCartao && modoCobrancaCartao === "PRECO_FIXO" && precoCartao > 0) ? precoCartao : precoNormal;

      setProdutoSelecionado(String(produto.codproduto));
      setPrecoProduto(precoFinal);
    } else {
      toast.error("Produto não encontrado");
    }
  }

  const handleScanProduto = (text: string) => {
    setBuscaProdutoInput(text);
    const produtoEncontrado = listarProdutos.find(p => String(p.codigo_barras) === text || String(p.codigoBarras) === text || String(p.codproduto) === text);
    if(produtoEncontrado) {
       const allowWithoutPrice = localStorage.getItem("allowProductsWithoutPrice") === "true";
       if (!produtoEncontrado.tem_preco_tabela && !allowWithoutPrice) {
         toast.error("Produto sem preço cadastrado na Tabela Comercial.");
         return;
       }
       const planoAtivo = listaFormasPagamento.find(fp => String(fp.CODPLPAG || fp.codplpag || fp.codforma || fp.id || fp.codplano) === String(codigoPlano));
       const isCartao = ["CARTAO", "CARTAO_CREDITO", "CARTAO_DEBITO", "CREDIARIO"].includes(planoAtivo?.tipo_pagamento) && pagamentosVenda.length === 0;
       const precoCartao = Number(produtoEncontrado.preco_cartao || 0);
       const precoNormal = Number(produtoEncontrado.preco_calculado || 0);
       const precoFinal = (isCartao && modoCobrancaCartao === "PRECO_FIXO" && precoCartao > 0) ? precoCartao : precoNormal;

       setProdutoSelecionado(String(produtoEncontrado.codproduto));
       setPrecoProduto(precoFinal);
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
  const totalPedido = Number(subtotalPedido) - Number(descontoPedido) - Number(descontoKits) + Number(acrescimoPedido) + Number(valorFrete);

  const toggleKitAplicado = (kitId: number) => {
    setKitsDetectados(prev => prev.map(k => k.id === kitId ? { ...k, aplicado: !k.aplicado } : k));
  };

  const handleCriarPedido = async () => {
    if (!codigoCliente) {
      setValidationError({ title: "Faltam informações", message: "Por favor, selecione um cliente para o pedido." });
      return;
    }
    if (!codigoVendedor) {
      setValidationError({ title: "Faltam informações", message: "Por favor, selecione um vendedor." });
      return;
    }
    if (!filialPedido || filialPedido === "todas") {
      setValidationError({ title: "Faltam informações", message: "Selecione uma filial específica de destino." });
      return;
    }
    if (pagamentosVenda.length === 0 && statusAtualPedido === "FINALIZADO") {
      setValidationError({ title: "Faltam informações", message: "Para finalizar a venda, lance pelo menos um pagamento." });
      return;
    }
    if (itensPedido.length === 0) {
      setValidationError({ title: "Pedido Vazio", message: "Adicione pelo menos um item ao pedido." });
      return;
    }

    try {
      // Separar itens avulsos dos itens que compõem os kits aplicados
      const subtotalBase = itensPedido.reduce((s, i) => s + i.preco * i.quantidade, 0);
      
      let acrescimoFinal = Number(acrescimoPedido);
      
      const totalDoPedidoFinal = Number(subtotalBase) - Number(descontoPedido) - Number(descontoKits) + acrescimoFinal + Number(valorFrete);

      if (statusAtualPedido === "FINALIZADO") {
        const somaPag = pagamentosVenda.reduce((acc, p) => acc + p.valor, 0);
        if (somaPag === 0 && totalDoPedidoFinal > 0) {
          setValidationError({ title: "Pagamento não encontrado", message: "Para finalizar a venda, você deve lançar o(s) pagamento(s)." });
          return;
        }
        if (Math.abs(somaPag - totalDoPedidoFinal) > 0.05 && totalDoPedidoFinal > 0) {
          setValidationError({ title: "Valores Incorretos", message: `A soma dos pagamentos (R$ ${somaPag.toFixed(2)}) não bate com o Total (R$ ${totalDoPedidoFinal.toFixed(2)}). Corrija antes de finalizar.` });
          return;
        }
      }

      let itensAvulsos = [...itensPedido];
      const kitsParaEnviar = kitsDetectados.filter(k => k.aplicado).map(k => ({
        kitId: k.id,
        quantidade: k.qtd
      }));

      // Remover os itens que pertencem aos kits aplicados
      kitsAtivos.forEach(kitData => {
        const kitAplicado = kitsParaEnviar.find(k => k.kitId === kitData.id);
        if (kitAplicado) {
          // Para cada item deste kit, abater da lista de avulsos
          kitData.itens.forEach((kitItem: any) => {
            const qtdParaRemover = kitItem.quantidade * kitAplicado.quantidade;
            let qtdRemovida = 0;
            
            for (let i = 0; i < itensAvulsos.length; i++) {
              if (qtdRemovida >= qtdParaRemover) break;
              if (String(itensAvulsos[i].produtoId) === String(kitItem.produto_id)) {
                const qtdDisponivel = itensAvulsos[i].quantidade;
                const faltaRemover = qtdParaRemover - qtdRemovida;
                
                if (qtdDisponivel <= faltaRemover) {
                  qtdRemovida += qtdDisponivel;
                  itensAvulsos[i] = { ...itensAvulsos[i], quantidade: 0 };
                } else {
                  qtdRemovida += faltaRemover;
                  itensAvulsos[i] = { ...itensAvulsos[i], quantidade: qtdDisponivel - faltaRemover };
                }
              }
            }
          });
        }
      });
      
      // Limpar itens avulsos que ficaram com quantidade 0
      itensAvulsos = itensAvulsos.filter(i => i.quantidade > 0);

      const payload = {
        codcliente: Number(codigoCliente),
        codvendedor: codigoVendedor ? Number(codigoVendedor) : undefined,
        codusur_criou: usuario?.codusur ? Number(usuario.codusur) : undefined,
        codfilial: filialPedido ? Number(filialPedido) : undefined,
        formaPagamento: pagamentosVenda.length > 0 ? pagamentosVenda[0].codplano : codigoPlano,
        pagamentos: pagamentosVenda.map(p => ({
          codplano_pagamento: Number(p.codplano),
          valor: Number(p.valor),
          parcelas: Number(p.parcelas) || 1,
          bandeira: p.bandeira,
          snapshot_acrescimo_aplicado: p.acrescimo_aplicado,
          vencimento: p.vencimento
        })),
        parcelas: Number(parcelas) || 1,
        vencimento: dataVencimentoCrediario,
        observacoes,
        status: statusAtualPedido,
        desconto: Number(descontoPedido) - Number(acrescimoFinal), // ajustado
        acrescimo: acrescimoFinal,
        valor_frete: Number(valorFrete) || 0,
        produtos: itensAvulsos.map(i => ({
          produtoId: Number(i.produtoId),
          quantidade: Number(i.quantidade),
          preco_unitario: Number(i.preco)
        })),
        kits: kitsParaEnviar
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
      setAcrescimoPedido(0);
      setValorFrete(0);
      setCodigoPlano("");
      setNomePlano("");
      setParcelas("1");
      setObservacoes("");
      setFilialPedido("");

    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.detalhe || error.response?.data?.erro || error.response?.data?.message || "Erro ao gravar pedido no banco de dados.";
      if (msg.toLowerCase().includes("caixa aberto")) {
        setDialogCaixaFechadoOpen(true);
      } else {
        toast.error(msg);
      }
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
      setParcelas(String(pedido.parcelas || 1));
      setStatusAtualPedido(pedido.status || "EM_DIGITACAO");
      setCodigoPlano(String(pedido.formaPagamento || ''));
      setNomePlano(pedido.nomeFormaPagamento || '');
      setPagamentosVenda(pedido.pagamentos_multiplos ? pedido.pagamentos_multiplos.map((p: any) => ({
        codplano: String(p.codplano_pagamento),
        nome: listaFormasPagamento.find(f => String(f.CODPLPAG || f.id || f.codplano) === String(p.codplano_pagamento))?.DESCRICAO || `Plano ${p.codplano_pagamento}`,
        valor: Number(p.valor),
        parcelas: 1
      })) : []);
      
      const descBanco = Number(pedido.desconto || 0);
      if (descBanco < 0) {
        setDescontoPedido(0);
        setAcrescimoPedido(Math.abs(descBanco));
      } else {
        setDescontoPedido(descBanco);
        setAcrescimoPedido(0);
      }
      setValorFrete(pedido.valor_frete || 0);
    setObservacoes(pedido.observacoes || "");

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
            (usuario?.codvendedor && Number(v.codvendedor) === Number(usuario.codvendedor)) ||
            (usuario?.nome && v.nome.trim().toLowerCase() === usuario.nome.trim().toLowerCase())
          );

          if (vendedorLogado) {
            setCodigoVendedor(String(vendedorLogado.codvendedor));
            setNomeVendedor(vendedorLogado.nome);
            if (vendedorLogado.codfilial) {
              setFilialPedido(String(vendedorLogado.codfilial));
            } else {
              setFilialPedido("");
            }
          } else {
            setCodigoVendedor("");
            setNomeVendedor("");
            setFilialPedido("");
          }

          setItensPedido([]);
          setDescontoPedido(0);
          setAcrescimoPedido(0);
          setValorFrete(0);
          setCodigoPlano("");
          setNomePlano("");
          setPagamentosVenda([]);
          setValorPagamentoAtual("");
          setParcelas("1");
          setObservacoes("");
          setStatusAtualPedido("EM_DIGITACAO");
          setDialogOpen(true);
        }}><Plus className="h-4 w-4 mr-2" /> Novo Pedido</Button>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por cliente ou n..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <div className="flex items-center gap-2">
            <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="w-auto" title="Data Inicial" />
            <span className="text-muted-foreground">a</span>
            <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="w-auto" title="Data Final" />
          </div>
          <Button onClick={() => buscarPedidosFiltrados()} variant="secondary" className="w-full sm:w-auto">
            Buscar
          </Button>
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
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Vendedor</th>
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
                  <td className="px-4 py-3 text-muted-foreground">{pedido.nomeVendedor || "-"}</td>
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
          className="w-[98vw] sm:w-[95vw] md:max-w-4xl lg:max-w-5xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-3 sm:p-6"
          onPointerDownOutside={(e) => {
            e.preventDefault();
            if (dialogClienteOpen || dialogVendedorOpen || dialogPlanoOpen || dialogProdutoOpen || scannerOpen) return;
            if (itensPedido.length > 0) {
              if (window.confirm("Você tem um pedido em andamento com produtos. Deseja realmente fechar sem salvar?")) {
                setDialogOpen(false);
              }
            } else {
              setDialogOpen(false);
            }
          }}
          onEscapeKeyDown={(e) => {
            e.preventDefault();
            if (dialogClienteOpen || dialogVendedorOpen || dialogPlanoOpen || dialogProdutoOpen || scannerOpen) return;
            if (itensPedido.length > 0) {
              if (window.confirm("Você tem um pedido em andamento com produtos. Deseja realmente fechar sem salvar?")) {
                setDialogOpen(false);
              }
            } else {
              setDialogOpen(false);
            }
          }}
        >
          <DialogHeader className="px-1 pt-2 sm:p-0">
            <DialogTitle className="font-display text-xl">{idPedidoEdicao ? "Editar Pedido" : "Novo Pedido"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 sm:space-y-5 px-1 sm:px-0">
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
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-2 sm:mb-3">Dados do Cliente</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
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
                      placeholder="Cód"
                      className="w-16 sm:w-28"
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
                      className="flex-1 min-w-0"
                    />
                  </div>
                </div>
                <div className="space-y-2">
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
                      placeholder="Cód"
                      className="w-16 sm:w-28"
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
                      className="flex-1 min-w-0"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-2 sm:mb-3">Produtos</p>



              <div className="grid grid-cols-12 gap-2 items-end mb-3 bg-muted/20 p-2 sm:p-0 sm:bg-transparent rounded-md">

                {/* CÓDIGO */}
                <div className="col-span-12 md:col-span-3 space-y-1">
                  <Label className="text-xs sm:text-sm">Cód. Barras</Label>
                  <div className="flex gap-1 sm:gap-2">
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
                      className="min-w-0 flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="px-2"
                      onClick={() => setDialogProdutoOpen(true)}
                    >
                      <Search className="h-4 w-4" />
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
                    <Button
                      type="button"
                      variant="outline"
                      className="px-2 hidden sm:flex"
                      onClick={recarregarProdutos}
                      title="Atualizar lista de produtos"
                    >
                      <RefreshCw className="h-4 w-4 text-green-600" />
                    </Button>
                  </div>
                </div>

                {/* DESCRIÇÃO */}
                <div className="col-span-12 md:col-span-3 space-y-1">
                  <Label className="text-xs sm:text-sm">Descrição</Label>
                  <Input
                    value={
                      listarProdutos.find(p => String(p.codproduto) === produtoSelecionado)?.descricao || ""
                    }
                    readOnly
                    className="truncate"
                  />
                </div>

                {/* EMBALAGEM */}
                <div className="col-span-3 sm:col-span-4 md:col-span-2 space-y-1">
                  <Label className="text-xs sm:text-sm text-center block">Emb.</Label>
                  <Input
                    value={
                      listarProdutos.find(p => String(p.codproduto) === produtoSelecionado)?.embalagem || "UN"
                    }
                    readOnly
                    className="text-center px-1"
                  />
                </div>

                {/* QUANTIDADE */}
                <div className="col-span-4 sm:col-span-4 md:col-span-2 space-y-1">
                  <Label className="text-xs sm:text-sm text-center block">Qtd.</Label>
                  <Input
                    ref={refQtd}
                    type="number"
                    value={qtdSelecionada}
                    placeholder="Qtd"
                    className="text-center px-1"
                    onChange={(e) => setQtdSelecionada(Number(e.target.value))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        refPreco.current?.focus();
                      }
                    }}
                  />
                </div>

                {/* PREÇO */}
                <div className="col-span-5 sm:col-span-4 md:col-span-2 space-y-1">
                  <Label className="text-xs sm:text-sm text-center block">Preço</Label>
                  <Input
                    ref={refPreco}
                    type="number"
                    value={precoProduto}
                    className="text-right px-1 sm:px-3"
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
                      <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4 w-full sm:w-auto">
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
                        <div className="flex items-center gap-3 sm:gap-4 text-right">
                          <div className="flex flex-col w-16 sm:w-20">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Unitário</span>
                            <span className="text-xs sm:text-sm font-medium text-foreground h-7 flex items-center justify-end">R$ {Number(item.preco || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex flex-col w-20 sm:w-24">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Total</span>
                            <span className="text-xs sm:text-sm font-bold text-primary h-7 flex items-center justify-end">R$ {((item.preco || 0) * (item.quantidade || 0)).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                        <button type="button" onClick={() => removerItem(item.produtoId)} className="text-destructive hover:text-destructive/80 p-1 sm:ml-2 mt-4">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {kitsDetectados.length > 0 && (
                    <div className="border border-primary/30 bg-primary/10 rounded-md p-3 mb-4 mt-2 space-y-2">
                      <h4 className="text-xs font-bold text-primary uppercase flex items-center gap-1"><PackageOpen className="h-4 w-4" /> Kits Detectados</h4>
                      {kitsDetectados.map(kit => (
                        <div key={kit.id} className="flex justify-between items-center bg-white p-2 rounded shadow-sm border border-primary/20">
                          <div>
                            <p className="text-sm font-semibold text-slate-800">🎉 {kit.nome} {kit.qtd > 1 && `(x${kit.qtd})`}</p>
                            <p className="text-xs text-green-600 font-medium">Economia: R$ {kit.economia.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                          </div>
                          <Button 
                            size="sm" 
                            variant={kit.aplicado ? "outline" : "default"} 
                            className={kit.aplicado ? "text-primary border-primary/30 hover:bg-primary/10" : "bg-primary hover:bg-primary/90"}
                            onClick={() => toggleKitAplicado(kit.id)}
                          >
                            {kit.aplicado ? "Remover" : "Aplicar"}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="border-t border-border pt-2 flex justify-between font-medium">
                    <span>Subtotal</span>
                    <span className="text-muted-foreground">R$ {(subtotalPedido || 0).toLocaleString("pt-BR")}</span>
                  </div>
                  
                  <div className="flex justify-between font-medium items-center">
                    <span className="text-sm">Desconto Extra</span>
                    <div className="flex items-center">
                      <span className="mr-2 text-sm text-muted-foreground">R$</span>
                      <Input
                        type="number"
                        className="w-20 h-8 text-right bg-transparent border-slate-200"
                        value={descontoPedido}
                        onChange={(e) => setDescontoPedido(Number(e.target.value))}
                        min={0}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between font-medium items-center">
                    <span className="text-sm">Acréscimo Extra (Taxas)</span>
                    <div className="flex items-center">
                      <span className="mr-2 text-sm text-muted-foreground">R$</span>
                      <Input
                        type="number"
                        className="w-20 h-8 text-right bg-transparent border-slate-200"
                        value={acrescimoPedido}
                        onChange={(e) => setAcrescimoPedido(Number(e.target.value))}
                        min={0}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between font-medium items-center">
                    <span className="text-sm">Frete (Entrega)</span>
                    <div className="flex items-center">
                      <span className="mr-2 text-sm text-muted-foreground">R$</span>
                      <Input
                        type="number"
                        className="w-20 h-8 text-right bg-transparent border-slate-200"
                        value={valorFrete}
                        onChange={(e) => setValorFrete(Number(e.target.value))}
                        min={0}
                      />
                    </div>
                  </div>

                  {descontoKits > 0 && (
                    <div className="flex justify-between font-medium items-center text-primary">
                      <span className="text-sm flex items-center gap-1"><PackageOpen className="h-3 w-3" /> Desconto de Kits</span>
                      <span className="text-sm font-bold">- R$ {descontoKits.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}

                  <div className="border-t border-border pt-2 flex flex-col gap-1">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total Final</span>
                      <span className="text-primary">R$ {(totalPedido || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {(() => {
              const planoSelecionado = listaFormasPagamento.find(
                (fp) => String(fp.CODPLPAG || fp.codplpag || fp.codforma || fp.id || fp.codplano) === String(codigoPlano)
              );
              
              const minParcela = Number(planoSelecionado?.valor_minimo_parcela) || 0;
              const maxTotal = planoSelecionado?.max_parcelas || 1;
              let maxAllowedByTotal = minParcela > 0 ? Math.floor(totalPedido / minParcela) : 999;
              
              // Verifica se o plano tem regras (degraus) customizadas
              if (planoSelecionado?.regras_parcelamento) {
                try {
                  const regras = typeof planoSelecionado.regras_parcelamento === 'string' 
                    ? JSON.parse(planoSelecionado.regras_parcelamento) 
                    : planoSelecionado.regras_parcelamento;
                    
                  if (Array.isArray(regras) && regras.length > 0) {
                    // Ordenar do maior valor para o menor
                    const regrasOrdenadas = [...regras].sort((a, b) => Number(b.valor) - Number(a.valor));
                    
                    let achouRegra = false;
                    for (const regra of regrasOrdenadas) {
                      if (totalPedido >= Number(regra.valor)) {
                        maxAllowedByTotal = Number(regra.parcelas);
                        achouRegra = true;
                        break;
                      }
                    }
                    
                    // Se não atingiu o menor valor cadastrado nas regras, o padrão é 1x
                    if (!achouRegra) {
                      maxAllowedByTotal = 1;
                    }
                  }
                } catch (e) {
                  console.error("Erro ao aplicar regras_parcelamento", e);
                }
              }

              const maxRealAllowed = Math.min(maxTotal, Math.max(1, maxAllowedByTotal));
              
              const opcoesParcelamento = Array.from({ length: maxRealAllowed }, (_, i) => i + 1);

              const somaPagamentos = pagamentosVenda.reduce((acc, p) => acc + p.valor, 0);
              const faltaPagar = Math.max(0, totalPedido - somaPagamentos);
              
              // Cálculo de acréscimo se o plano tem taxa ou for cartão
              let valorSugerido = faltaPagar;
              let taxaAtual = 0;
              const isCartao = ["CARTAO", "CARTAO_CREDITO", "CARTAO_DEBITO", "CREDIARIO"].includes(planoSelecionado?.tipo_pagamento);
              if (planoSelecionado?.tem_acrescimo || isCartao) {
                taxaAtual = Number(planoSelecionado?.taxa_acrescimo || 0);
                
                // Sobrescreve com regra específica da bandeira/parcela se PERCENTUAL
                if (modoCobrancaCartao === "PERCENTUAL" && planoSelecionado?.regras_parcelamento) {
                  try {
                    const parsed = JSON.parse(planoSelecionado.regras_parcelamento);
                    let regrasParaUso: any = [];
                    if (parsed && parsed.bandeiras && bandeiraSelecionada) {
                       regrasParaUso = parsed.bandeiras[bandeiraSelecionada] || [];
                    } else if (Array.isArray(parsed)) {
                       regrasParaUso = parsed;
                    }
                    if (regrasParaUso.length > 0) {
                      const parcelaEscolhida = Number(parcelas || 1);
                      const regraEncontrada = regrasParaUso.find((r:any) => Number(r.parcelas) === parcelaEscolhida);
                      if (regraEncontrada) {
                        taxaAtual = Number(regraEncontrada.acrescimo_percentual || 0);
                      }
                    }
                  } catch(e){}
                }

                // Cálculo do valor sugerido com acréscimo
                if (modoCobrancaCartao === "PERCENTUAL") {
                  if (taxaAtual > 0 && taxaAtual < 100 && faltaPagar > 0) {
                    valorSugerido = faltaPagar / (1 - (taxaAtual / 100));
                  }
                } else {
                  // PRECO_FIXO behavior
                  const subtotalCartao = itensPedido.reduce((acc, item) => acc + (Number(item.preco_cartao) || Number(item.preco)) * item.quantidade, 0);
                  const diferencaCartaoTotal = subtotalCartao - subtotalPedido; 
                  const acrescimoJaAplicado = pagamentosVenda.reduce((acc, p) => acc + (p.acrescimo_aplicado || 0), 0);
                  const acrescimoPendente = Math.max(0, diferencaCartaoTotal - acrescimoJaAplicado);
                  
                  valorSugerido = faltaPagar + acrescimoPendente;
                }
              }

              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-slate-50 p-4 border rounded-md">
                    <div className="space-y-2 md:col-span-5">
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
                          className="w-24"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setDialogPlanoOpen(true)}
                          className="px-2"
                        >
                          <Search className="h-4 w-4" />
                        </Button>
                        <Input
                          value={nomePlano}
                          readOnly
                          placeholder="Nome do Plano"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    {planoSelecionado?.tipo_pagamento === "CARTAO" && regrasBandeiras && Object.keys(regrasBandeiras).length > 0 && (
                      <div className="space-y-2 md:col-span-3">
                        <Label>Bandeira</Label>
                        <Select value={bandeiraSelecionada} onValueChange={setBandeiraSelecionada}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.keys(regrasBandeiras).map((b) => (
                              <SelectItem key={b} value={b}>{b}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                        <div className="space-y-2 md:col-span-3">
                          <Label>Valor</Label>
                      <Input
                        type="number"
                        placeholder="R$"
                        value={valorPagamentoAtual !== "" ? valorPagamentoAtual : (valorSugerido > 0 ? valorSugerido.toFixed(2) : "")}
                        onChange={(e) => setValorPagamentoAtual(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && codigoPlano && (valorPagamentoAtual || valorSugerido > 0)) {
                            const valorAdicionar = Number(valorPagamentoAtual || valorSugerido);
                            if (valorAdicionar > 0) {
                              let acrescimoDesteLancamento = 0;
                              
                              let taxaUsada = Number(planoSelecionado?.taxa_acrescimo || 0);
                              
                              if (modoCobrancaCartao === "PERCENTUAL" && planoSelecionado?.regras_parcelamento) {
                                try {
                                  const parsed = JSON.parse(planoSelecionado.regras_parcelamento);
                                  let regrasParaUso = [];
                                  if (parsed && parsed.bandeiras && bandeiraSelecionada) {
                                     regrasParaUso = parsed.bandeiras[bandeiraSelecionada] || [];
                                  } else if (Array.isArray(parsed)) {
                                     regrasParaUso = parsed;
                                  }
                                  if (regrasParaUso.length > 0) {
                                    const parcelaEscolhida = Number(parcelas || 1);
                                    const regraEncontrada = regrasParaUso.find((r:any) => Number(r.parcelas) === parcelaEscolhida);
                                    if (regraEncontrada) {
                                      taxaUsada = Number(regraEncontrada.acrescimo_percentual || 0);
                                    }
                                  }
                                } catch(e){}
                              }

                              const isCartao = ["CARTAO", "CARTAO_CREDITO", "CARTAO_DEBITO", "CREDIARIO"].includes(planoSelecionado?.tipo_pagamento);
                              if ((planoSelecionado?.tem_acrescimo || isCartao) && (taxaUsada > 0 || modoCobrancaCartao !== "PERCENTUAL")) {
                                const taxa = taxaUsada;
                                
                                // Se for pagamento único usando o valor exato do cartão
                                if (pagamentosVenda.length === 0 && Number(valorAdicionar.toFixed(2)) === Number(valorSugerido.toFixed(2))) {
                                  acrescimoDesteLancamento = valorSugerido - faltaPagar;
                                } else {
                                  // Pagamento split (ou valor menor/maior informado) - juros proporcional
                                  // Gross = Net + Acrescimo  => Net = Gross * (1 - taxa/100) => Acrescimo = Gross * (taxa/100)
                                  if (modoCobrancaCartao === "PERCENTUAL") {
                                    acrescimoDesteLancamento = valorAdicionar * (taxa / 100);
                                  } else {
                                    // Para modo Tabela Cartão, o sugerido já tem o juro da tabela. Apenas pegamos a proporção
                                    acrescimoDesteLancamento = (valorAdicionar / valorSugerido) * (valorSugerido - faltaPagar);
                                  }
                                  if (Number(valorAdicionar.toFixed(2)) === Number(valorSugerido.toFixed(2))) {
                                    acrescimoDesteLancamento = valorSugerido - faltaPagar;
                                  }
                                }
                              }
                              
                              setAcrescimoPedido(prev => prev + acrescimoDesteLancamento);
                              setPagamentosVenda([...pagamentosVenda, { codplano: codigoPlano, nome: nomePlano, valor: valorAdicionar, parcelas: Number(parcelas), acrescimo_aplicado: acrescimoDesteLancamento, bandeira: bandeiraSelecionada, vencimento: dataVencimentoCrediario }]);
                              
                              setCodigoPlano("");
                              setNomePlano("");
                              setValorPagamentoAtual("");
                              setParcelas("1");
                              setDataVencimentoCrediario("");
                            }
                          }
                        }}
                      />
                    </div>

                    {maxRealAllowed > 1 && (
                      <div className="space-y-2 md:col-span-2">
                        <Label>Parcelas</Label>
                        <Select value={parcelas} onValueChange={setParcelas}>
                          <SelectTrigger>
                            <SelectValue placeholder="1x" />
                          </SelectTrigger>
                          <SelectContent>
                            {opcoesParcelamento.map(n => (
                              <SelectItem key={n} value={String(n)}>
                                {n}x
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    {planoSelecionado?.tipo_pagamento === 'CREDIARIO' && perguntarVencimentoCrediario && (
                      <div className="space-y-2 md:col-span-2">
                        <Label>1º Vencimento</Label>
                        <Input 
                          type="date" 
                          value={dataVencimentoCrediario} 
                          onChange={e => setDataVencimentoCrediario(e.target.value)} 
                        />
                      </div>
                    )}

                    <div className="md:col-span-2">
                      <Button
                        type="button"
                        className="w-full"
                        variant="secondary"
                        disabled={!codigoPlano}
                        onClick={() => {
                          const valorAdicionar = Number(valorPagamentoAtual || valorSugerido);
                          if (valorAdicionar > 0) {
                            let acrescimoDesteLancamento = 0;
                            let taxaUsada = Number(planoSelecionado?.taxa_acrescimo || 0);
                            
                            if (modoCobrancaCartao === "PERCENTUAL" && planoSelecionado?.regras_parcelamento) {
                              try {
                                const parsed = JSON.parse(planoSelecionado.regras_parcelamento);
                                let regrasParaUso = [];
                                if (parsed && parsed.bandeiras && bandeiraSelecionada) {
                                   regrasParaUso = parsed.bandeiras[bandeiraSelecionada] || [];
                                } else if (Array.isArray(parsed)) {
                                   regrasParaUso = parsed;
                                }
                                if (regrasParaUso.length > 0) {
                                  const parcelaEscolhida = Number(parcelas || 1);
                                  const regraEncontrada = regrasParaUso.find((r:any) => Number(r.parcelas) === parcelaEscolhida);
                                  if (regraEncontrada) {
                                    taxaUsada = Number(regraEncontrada.acrescimo_percentual || 0);
                                  }
                                }
                              } catch(e){}
                            }

                            const isCartao = ["CARTAO", "CARTAO_CREDITO", "CARTAO_DEBITO", "CREDIARIO"].includes(planoSelecionado?.tipo_pagamento);
                            if ((planoSelecionado?.tem_acrescimo || isCartao) && (taxaUsada > 0 || modoCobrancaCartao !== "PERCENTUAL")) {
                              const taxa = taxaUsada;
                              if (pagamentosVenda.length === 0 && Number(valorAdicionar.toFixed(2)) === Number(valorSugerido.toFixed(2))) {
                                acrescimoDesteLancamento = valorSugerido - faltaPagar;
                              } else {
                                if (modoCobrancaCartao === "PERCENTUAL") {
                                  acrescimoDesteLancamento = valorAdicionar * (taxa / 100);
                                } else {
                                  acrescimoDesteLancamento = (valorAdicionar / valorSugerido) * (valorSugerido - faltaPagar);
                                }
                                if (Number(valorAdicionar.toFixed(2)) === Number(valorSugerido.toFixed(2))) {
                                  acrescimoDesteLancamento = valorSugerido - faltaPagar;
                                }
                              }
                            }
                            setAcrescimoPedido(prev => prev + acrescimoDesteLancamento);
                            setPagamentosVenda([...pagamentosVenda, { codplano: codigoPlano, nome: nomePlano, valor: valorAdicionar, parcelas: Number(parcelas), acrescimo_aplicado: acrescimoDesteLancamento, bandeira: bandeiraSelecionada, vencimento: dataVencimentoCrediario }]);
                            setCodigoPlano("");
                            setNomePlano("");
                            setValorPagamentoAtual("");
                            setParcelas("1");
                            setDataVencimentoCrediario("");
                          } else {
                            toast.error("Insira um valor válido");
                          }
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" /> Lançar
                      </Button>
                    </div>
              </div>



                  {pagamentosVenda.length > 0 && (
                    <div className="bg-white border rounded-md overflow-hidden">
                      <div className="bg-slate-100 px-3 py-2 border-b text-sm font-semibold flex justify-between">
                        <span>Pagamentos Lançados</span>
                        <span className="text-primary">Soma: R$ {somaPagamentos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="divide-y">
                        {pagamentosVenda.map((pag, idx) => (
                          <div key={idx} className="flex justify-between items-center p-3 text-sm">
                            <div>
                              <span className="font-medium">{pag.nome}</span>
                              <span className="text-muted-foreground ml-2">({pag.parcelas}x)</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-bold">R$ {pag.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const pagARemover = pagamentosVenda[idx];
                                  if (pagARemover.acrescimo_aplicado && pagARemover.acrescimo_aplicado > 0) {
                                    setAcrescimoPedido(prev => Math.max(0, prev - pagARemover.acrescimo_aplicado));
                                  }
                                  const novos = [...pagamentosVenda];
                                  novos.splice(idx, 1);
                                  setPagamentosVenda(novos);
                                }}
                                className="text-destructive hover:text-destructive/80 p-1"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      {faltaPagar > 0 && (
                        <div className="bg-red-50 p-3 text-red-700 font-bold text-center border-t border-red-100 flex justify-between">
                          <span>Falta Pagar:</span>
                          <span>R$ {faltaPagar.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}
                      {somaPagamentos > totalPedido && (
                        <div className="bg-blue-50 p-3 text-blue-700 font-bold text-center border-t border-blue-100 flex justify-between">
                          <span>Troco:</span>
                          <span>R$ {(somaPagamentos - totalPedido).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {(() => {
              const pixPayment = pagamentosVenda.find(p => p.nome.toLowerCase().includes("pix"));
              const isPixSelected = nomePlano.toLowerCase().includes("pix");
              
              if (!pixPayment && !isPixSelected) {
                return null;
              }
              
              let valorPix = 0;
              if (pixPayment) {
                valorPix = pixPayment.valor;
              } else if (isPixSelected && totalPedido > 0) {
                const somaPagamentosAtual = pagamentosVenda.reduce((acc, p) => acc + p.valor, 0);
                valorPix = Math.max(0, totalPedido - somaPagamentosAtual);
                if (valorPagamentoAtual) {
                  valorPix = Number(valorPagamentoAtual);
                }
              }

              if (valorPix <= 0) return null;
              
              const payload = generatePixPayload(valorPix);
              
              return (
                <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-primary/50 bg-primary/5 rounded-lg mt-4 animate-in fade-in zoom-in-95 duration-300">
                  <div className="flex items-center gap-2 mb-3">
                    <ScanBarcode className="w-6 h-6 text-primary" />
                    <h3 className="font-bold text-lg text-primary">Pagamento via PIX</h3>
                  </div>
                  
                  {!mostrarPix ? (
                    <Button 
                      variant="default" 
                      onClick={() => setMostrarPix(true)}
                    >
                      Gerar QR Code PIX
                    </Button>
                  ) : (
                    <>
                      <div className="bg-white p-2 rounded-xl shadow-sm mb-3 animate-in zoom-in-95 duration-200">
                        <QRCodeSVG value={payload} size={160} level="M" />
                      </div>
                      
                      <p className="text-base font-bold text-foreground">Valor: R$ {valorPix.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                      <p className="text-xs text-muted-foreground mt-1 text-center max-w-[250px]">
                        Peça para o cliente escanear o QR Code acima pelo aplicativo do banco.
                      </p>
                      
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="mt-3"
                        onClick={() => {
                          navigator.clipboard.writeText(payload);
                          toast.success("Código PIX Copia e Cola copiado!");
                        }}
                      >
                        Copiar PIX Copia e Cola
                      </Button>
                    </>
                  )}
                </div>
              );
            })()}
            
            <div className="space-y-2 mt-4">
              <Label>Observações do Pedido</Label>
              <Textarea
                placeholder="Digite aqui alguma observação sobre a venda ou entrega..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
            
            <div className="mt-4 flex items-center space-x-2 p-3 border rounded-md bg-muted/30">
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
                <div className="font-medium text-base">{p.descricao}</div>
                <div className="text-sm text-muted-foreground flex justify-between mt-1 items-center">
                  <span>Código: {p.codproduto}</span>
                  <span className="font-bold text-primary text-base">
                    R$ {Number(p.preco_normal || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
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
                    setParcelas("1");
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
                      const preco = Number(item.preco_unitario || item.preco || 0);
                      return (
                        <li key={idx} className="flex justify-between items-start gap-2 text-sm border-b border-border/40 pb-1 last:border-0">
                          <span className="line-clamp-2">{qtd}x {nome}</span>
                          <span className="font-medium text-muted-foreground whitespace-nowrap">R$ {(qtd * preco).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
              
              <div className="space-y-1 border-t pt-3">
                  {/* Calcula o subtotal a partir dos itens */}
                  {(() => {
                    const subtotal = pedidoParaDetalhes.itens?.reduce((acc: number, item: any) => acc + (Number(item.preco_unitario || item.preco || 0) * (item.quantidade || 1)), 0) || 0;
                    return (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Subtotal dos Itens</span>
                        <span>R$ {subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                      </div>
                    );
                  })()}
                  
                  {Number(pedidoParaDetalhes.valor_frete) > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Frete (Entrega)</span>
                      <span>R$ {Number(pedidoParaDetalhes.valor_frete).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}

                  {Number(pedidoParaDetalhes.desconto) > 0 && (
                    <div className="flex justify-between items-center text-sm text-green-600">
                      <span className="text-muted-foreground">Desconto</span>
                      <span>- R$ {Number(pedidoParaDetalhes.desconto).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
              </div>

              <div className="flex justify-between items-center border-t pt-2 mt-2">
                <span className="font-semibold text-lg">Total Final</span>
                <span className="font-bold text-lg text-primary">R$ {Number(pedidoParaDetalhes.total || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
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

      {/* DIALOG CAIXA FECHADO */}
      <Dialog open={dialogCaixaFechadoOpen} onOpenChange={setDialogCaixaFechadoOpen}>
        <DialogContent className="max-w-md p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-red-100 p-4 rounded-full">
              <AlertCircle size={48} className="text-red-600" />
            </div>
          </div>
          <DialogHeader>
            <DialogTitle className="text-center text-xl">Atenção! Caixa Fechado</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600">
              Você precisa ter um caixa aberto para finalizar uma venda e registrar pagamentos.
            </p>
            <p className="text-sm text-gray-500 mt-4">
              Abra seu caixa primeiro ou limpe os pagamentos inseridos para salvar este pedido como "Pendente".
            </p>
          </div>
          <DialogFooter className="sm:justify-center">
            <Button onClick={() => setDialogCaixaFechadoOpen(false)} className="w-full sm:w-auto bg-primary hover:bg-primary/90">
              Ok, Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG DE VALIDAÇÃO (Campos Faltando) */}
      <Dialog open={validationError !== null} onOpenChange={(open) => !open && setValidationError(null)}>
        <DialogContent className="max-w-md p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-yellow-100 p-4 rounded-full">
              <AlertCircle size={48} className="text-yellow-600" />
            </div>
          </div>
          <DialogHeader>
            <DialogTitle className="text-center text-xl">{validationError?.title}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600 text-lg">
              {validationError?.message}
            </p>
          </div>
          <DialogFooter className="sm:justify-center">
            <Button onClick={() => setValidationError(null)} className="w-full sm:w-auto bg-primary hover:bg-primary/90">
              Ok, Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;


