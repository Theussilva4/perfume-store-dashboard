import { useState, useEffect, useRef } from "react";
import { ShoppingCart, Plus, Search, Eye, ClipboardList, Trash2, Camera, RefreshCw } from "lucide-react";
import { getCompras, createCompra, getCompraById, cancelarCompra } from "@/services/compraService";
import { getFornecedores } from "@/services/fornecedorService";
import { getProdutos } from "@/services/produtosService";
import { getFilial } from "@/services/filialService";
import { getEstoque, createEntrada, getEntradas } from "@/services/estoqueService";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBranch } from "@/contexts/BranchContext";
import { BarcodeScannerModal } from "@/components/BarcodeScannerModal";
import api from "@/services/api";

const Purchases = () => {
  const [listaCompras, setListaCompras] = useState<any[]>([]);
  const [listaFornecedores, setListaFornecedores] = useState<any[]>([]);
  const [listaProdutos, setListaProdutos] = useState<any[]>([]);
  const [listaFiliais, setListaFiliais] = useState<any[]>([]);
  const [listaEstoques, setListaEstoques] = useState<any[]>([]);
  
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogDetalhesOpen, setDialogDetalhesOpen] = useState(false);
  const [dialogCancelarOpen, setDialogCancelarOpen] = useState(false);
  const [motivoCancelamento, setMotivoCancelamento] = useState("");
  const [compraSelecionada, setCompraSelecionada] = useState<any | null>(null);
  const { filialSelecionada, rotuloFilial } = useBranch();
  
  // States para nova compra
  const [tipoEntrada, setTipoEntrada] = useState<"COMPRA" | "AJUSTE">("COMPRA");
  const [fornecedorBusca, setFornecedorBusca] = useState("");
  const [fornecedorUuid, setFornecedorUuid] = useState("");
  const [fornecedorCod, setFornecedorCod] = useState("");
  const [fornecedorNome, setFornecedorNome] = useState("");
  const [notaFiscalFornecedor, setNotaFiscalFornecedor] = useState("");
  const [dialogFornecedorOpen, setDialogFornecedorOpen] = useState(false);
  
  const [filialDestino, setFilialDestino] = useState("");
  const [statusCompra, setStatusCompra] = useState("CONCLUIDA");

  // Variaveis para Modal de Variação de Custo
  const [dialogCustoOpen, setDialogCustoOpen] = useState(false);
  const [variacoesCusto, setVariacoesCusto] = useState<any[]>([]);
  const [escolhasCusto, setEscolhasCusto] = useState<Record<string, "MANTER" | "ATUALIZAR" | "MEDIO">>({});
  
  const [produtoBusca, setProdutoBusca] = useState("");
  const [produtoSelecionadoId, setProdutoSelecionadoId] = useState("");
  const [qtdSelecionada, setQtdSelecionada] = useState(1);
  const [custoSelecionado, setCustoSelecionado] = useState(0);
  const [loteSelecionado, setLoteSelecionado] = useState("");
  const [validadeSelecionada, setValidadeSelecionada] = useState("");
  const [dialogProdutoOpen, setDialogProdutoOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  
  const [itensCompra, setItensCompra] = useState<any[]>([]);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setLoading(true);
    try {
      const [comprasAPI, entradasAPI, fornecedoresAPI, produtosAPI, filiaisAPI, estoquesAPI] = await Promise.all([
        getCompras(),
        getEntradas(),
        getFornecedores(),
        getProdutos(),
        getFilial(),
        getEstoque()
      ]);
      
      const comprasNormalizadas = Array.isArray(comprasAPI) ? comprasAPI.map((c: any) => ({...c, tipo_registro: "COMPRA"})) : [];
      const entradasNormalizadas = Array.isArray(entradasAPI) ? entradasAPI.map((e: any) => {
        const valorAjuste = (e.itens || []).reduce((acc: number, item: any) => acc + (Number(item.quantidade) * Number(item.produto?.custo || 0)), 0);
        return {
          uuid: `ajuste-${e.uuid || e.id}`,
          codigo_compra: `AJST-${e.id}`,
          data_compra: e.data_mov,
          status: "CONCLUIDA",
          valor_total: valorAjuste,
          msfornecedor: { nome: e.usuario_nome ? `Ajuste Manual (${e.usuario_nome})` : "Ajuste Manual" },
          created_at: e.data_mov,
          codfilial: e.codfilial,
          tipo_registro: "AJUSTE",
          itens: (e.itens || []).map((item: any) => ({
            codproduto: item.codproduto,
            msproduto: item.produto,
            quantidade: item.quantidade,
            custo_unitario: item.produto?.custo || 0,
            valor_total: Number(item.quantidade) * Number(item.produto?.custo || 0)
          }))
        };
      }) : [];

      const todas = [...comprasNormalizadas, ...entradasNormalizadas].sort((a, b) => 
        new Date(b.data_compra).getTime() - new Date(a.data_compra).getTime()
      );

      setListaCompras(todas);
      setListaFornecedores(Array.isArray(fornecedoresAPI) ? fornecedoresAPI : []);
      setListaProdutos(Array.isArray(produtosAPI) ? produtosAPI : []);
      setListaFiliais(Array.isArray(filiaisAPI) ? filiaisAPI : []);
      setListaEstoques(Array.isArray(estoquesAPI) ? estoquesAPI : []);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }

  async function recarregarProdutos() {
    try {
      toast.info("Atualizando produtos...", { duration: 1500 });
      const [produtosRaw, estRaw] = await Promise.all([getProdutos(), getEstoque()]);
      const safeEstoque = Array.isArray(estRaw) ? estRaw : [];
      const prodsList = Array.isArray(produtosRaw) ? produtosRaw.map((p: any) => ({
        ...p,
        precoVenda: p.preco_normal || p.custo,
        estoque: safeEstoque.filter((e: any) => String(e.codproduto) === String(p.codproduto)).reduce((acc: number, item: any) => acc + Number(item.quantidade), 0)
      })) : [];
      setListaProdutos(prodsList);
      toast.success("Produtos atualizados!");
    } catch (e) {
      toast.error("Erro ao recarregar produtos");
    }
  }

  const limpar = (v: string) => v.replace(/\D/g, "");

  const comprasFiltradas = listaCompras.filter(c => {
    // filtro de filial
    const matchFilial = filialSelecionada === "todas" || 
      String(c.codfilial) === String(filialSelecionada) ||
      String(c.msfilial?.codfilial) === String(filialSelecionada);
      
    // filtro de texto
    const fornecedor = (c.msfornecedor?.nome || "").toLowerCase();
    const termo = search.toLowerCase();
    const matchSearch = fornecedor.includes(termo) || 
      String(c.codigo_compra || "").toLowerCase().includes(termo) ||
      String(c.numero_documento || "").toLowerCase().includes(termo);
    
    return matchFilial && matchSearch;
  });

  const handleBuscaRapidaProduto = () => {
    if (!produtoBusca.trim()) return;
    const termo = produtoBusca.toLowerCase().trim();
    const prod = listaProdutos.find(p => 
      String(p.codproduto) === termo || 
      (p.codigo_barras && p.codigo_barras.toLowerCase() === termo) ||
      (p.ean && p.ean.toLowerCase() === termo) ||
      p.descricao.toLowerCase().includes(termo)
    );
    
    if (prod) {
      setProdutoSelecionadoId(String(prod.codproduto));
      setCustoSelecionado(prod.custo || 0);
      toast.success("Produto selecionado!");
    } else {
      toast.error("Produto não encontrado!");
      setProdutoSelecionadoId("");
    }
  };

  const handleBuscaRapidaFornecedor = () => {
    if (!fornecedorBusca.trim()) return;
    const termo = fornecedorBusca.toLowerCase().trim();
    const forn = listaFornecedores.find(f => 
      String(f.codfornecedor) === termo || 
      String(f.id) === termo ||
      (f.cnpj && f.cnpj.replace(/\D/g, "") === termo.replace(/\D/g, "")) ||
      f.nome.toLowerCase().includes(termo)
    );
    
    if (forn) {
      setFornecedorUuid(forn.uuid || "");
      setFornecedorCod(String(forn.codfornecedor || forn.id || ""));
      setFornecedorNome(forn.nome);
      toast.success("Fornecedor selecionado!");
    } else {
      toast.error("Fornecedor não encontrado!");
      setFornecedorUuid("");
      setFornecedorCod("");
      setFornecedorNome("");
    }
  };

  const adicionarItem = () => {
    const produto = listaProdutos.find(p => String(p.codproduto) === produtoSelecionadoId);
    if (!produto) return;
    
    const existente = itensCompra.find(i => i.codproduto === String(produto.codproduto));
      if (existente && existente.lote === loteSelecionado && existente.validade === validadeSelecionada) {
        setItensCompra(prev => prev.map(i => 
          i.codproduto === String(produto.codproduto) && i.lote === loteSelecionado && i.validade === validadeSelecionada
            ? { ...i, quantidade: i.quantidade + qtdSelecionada, custo_unitario: custoSelecionado } 
            : i
        ));
      } else {
        setItensCompra(prev => [...prev, {
          codproduto: String(produto.codproduto),
          nomeProduto: produto.descricao,
          quantidade: qtdSelecionada,
          custo_unitario: custoSelecionado,
          custo_atual: produto.custo || 0,
          estoque_atual: produto.estoque || 0,
          lote: loteSelecionado,
          validade: validadeSelecionada
        }]);
      }
    
    setProdutoBusca("");
    setProdutoSelecionadoId("");
    setQtdSelecionada(1);
    setCustoSelecionado(0);
    setLoteSelecionado("");
    setValidadeSelecionada("");
  };

  const removerItem = (id: string) => {
    setItensCompra(prev => prev.filter(i => i.codproduto !== id));
  };

  const handleScanProduto = (decodedText: string) => {
    setProdutoBusca(decodedText);
    toast.success("Código lido: " + decodedText);
  };

  const handleSalvarCompra = async () => {
    if (tipoEntrada === "COMPRA" && !fornecedorUuid) return toast.error("Selecione um fornecedor");
    if (!filialDestino || filialDestino === "todas") return toast.error("Selecione uma filial de destino");
    if (itensCompra.length === 0) return toast.error("Adicione itens");
    
    setIsSubmitting(true);
    const atualizacaoCustoCompra = localStorage.getItem("atualizacaoCustoCompra") || "PERGUNTAR";

    if (tipoEntrada === "COMPRA" && atualizacaoCustoCompra === "PERGUNTAR") {
      const variacoes = itensCompra.filter(item => Number(item.custo_unitario) !== Number(item.custo_atual));
      if (variacoes.length > 0) {
        setVariacoesCusto(variacoes);
        const inicialEscolhas: Record<string, "MANTER" | "ATUALIZAR" | "MEDIO"> = {};
        variacoes.forEach(v => inicialEscolhas[v.codproduto] = "MANTER");
        setEscolhasCusto(inicialEscolhas);
        setDialogCustoOpen(true);
        setIsSubmitting(false);
        return; // Interrompe para esperar a decisao do usuario
      }
    }
    
    await enviarCompraPayload();
  };

  const enviarCompraPayload = async (atualizacoesCusto?: any[]) => {
    setIsSubmitting(true);
    try {
      if (tipoEntrada === "COMPRA") {
        const payload = {
          codfornecedor: parseInt(fornecedorCod),
          codfilial: parseInt(filialDestino),
          status: statusCompra,
          numero_documento: notaFiscalFornecedor || undefined,
          itens: itensCompra.map(i => ({
            codproduto: parseInt(i.codproduto),
            quantidade: Number(i.quantidade),
            custo_unitario: Number(i.custo_unitario),
            lote: i.lote || undefined,
            validade: i.validade || undefined
          })),
          atualizacoesCusto
        };
        await createCompra(payload);
        toast.success("Compra registrada com sucesso!");
      } else {
        const payload = {
          filialDestino: parseInt(filialDestino),
          origem: "AJUSTE",
          itens: itensCompra.map(i => ({
            codproduto: parseInt(i.codproduto),
            quantidade: Number(i.quantidade),
            lote: i.lote || undefined,
            validade: i.validade || undefined
          }))
        };
        await createEntrada(payload);
        toast.success("Ajuste de estoque registrado com sucesso!");
      }
      
      // Limpar form
      setFornecedorUuid("");
      setFornecedorCod("");
      setFornecedorNome("");
      setNotaFiscalFornecedor("");
      setFilialDestino("");
      setItensCompra([]);
      setDialogOpen(false);
      carregarDados();
    } catch (e) {
      toast.error("Erro ao registrar");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmarVariacoesCusto = async () => {
    const atualizacoesCusto = variacoesCusto.map(v => {
      const metodo = escolhasCusto[v.codproduto];
      let novo_custo = v.custo_atual;
      if (metodo === "ATUALIZAR") novo_custo = v.custo_unitario;
      else if (metodo === "MEDIO") {
        novo_custo = ((v.estoque_atual * v.custo_atual) + (v.quantidade * v.custo_unitario)) / ((v.estoque_atual || 0) + v.quantidade);
      }
      return {
        codproduto: parseInt(v.codproduto),
        metodo,
        novo_custo
      };
    });
    setDialogCustoOpen(false);
    await enviarCompraPayload(atualizacoesCusto);
  };

  const abrirDetalhes = async (compra: any) => {
    try {
      if (compra.tipo_registro === "AJUSTE") {
        setCompraSelecionada({
          ...compra,
          mscompra_item: compra.itens
        });
        setDialogDetalhesOpen(true);
        return;
      }
      const detalhes = await getCompraById(compra.uuid);
      setCompraSelecionada(detalhes);
      setDialogDetalhesOpen(true);
    } catch (error) {
      toast.error("Erro ao buscar detalhes da compra");
    }
  };

  const handleCancelarCompra = async () => {
    if (motivoCancelamento.trim().length < 15) {
      return toast.error("O motivo do cancelamento deve ter pelo menos 15 caracteres.");
    }

    setIsSubmitting(true);
    try {
      await cancelarCompra(compraSelecionada.uuid, motivoCancelamento);
      toast.success("Compra cancelada e estoque estornado com sucesso!");
      setDialogCancelarOpen(false);
      setMotivoCancelamento("");
      setDialogDetalhesOpen(false);
      carregarDados();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.error || "Erro ao cancelar a compra");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImportarXml = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("xml", file);

    const promise = api.post("/compras/importar-xml", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    }).then(res => {
      carregarDados();
      return res.data.message;
    });

    toast.promise(promise, {
      loading: "Lendo XML e pré-cadastrando produtos...",
      success: (msg) => msg || "Nota importada com sucesso!",
      error: (err: any) => err.response?.data?.error || "Erro ao importar XML."
    });

    e.target.value = ""; // reset
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl md:text-3xl font-semibold text-primary">Compras e Entrada</h2>
          <p className="text-sm text-muted-foreground mt-1">{rotuloFilial} • {comprasFiltradas.length} compras</p>
        </div>
        <div className="flex gap-2">
          <label className="cursor-pointer">
            <input type="file" accept=".xml" className="hidden" onChange={handleImportarXml} />
            <div className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
              <Plus className="h-4 w-4 mr-2" /> Importar XML (NF-e)
            </div>
          </label>
          <Button variant="outline" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Manual
          </Button>
        </div>

        {/* DIALOG VARIACOES DE CUSTO */}
        <Dialog open={dialogCustoOpen} onOpenChange={setDialogCustoOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Variação de Custo Encontrada</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground mb-4">
                Os produtos abaixo possuem custo diferente do cadastrado no sistema. Escolha como atualizar:
              </p>
              <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                {variacoesCusto.map(item => (
                  <div key={item.codproduto} className="border p-4 rounded-md space-y-2">
                    <p className="font-semibold">{item.nomeProduto}</p>
                    <div className="flex gap-4 text-sm text-muted-foreground mb-2">
                      <span>Custo Atual: <strong className="text-foreground">R$ {Number(item.custo_atual).toLocaleString('pt-BR', {minimumFractionDigits:2})}</strong></span>
                      <span>Novo Custo (NF): <strong className="text-orange-500">R$ {Number(item.custo_unitario).toLocaleString('pt-BR', {minimumFractionDigits:2})}</strong></span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <Button 
                        type="button"
                        variant={escolhasCusto[item.codproduto] === "MEDIO" ? "default" : "outline"} 
                        onClick={() => setEscolhasCusto(prev => ({...prev, [item.codproduto]: "MEDIO"}))}
                        className="text-xs"
                      >
                        Custo Médio
                      </Button>
                      <Button 
                        type="button"
                        variant={escolhasCusto[item.codproduto] === "ATUALIZAR" ? "default" : "outline"} 
                        onClick={() => setEscolhasCusto(prev => ({...prev, [item.codproduto]: "ATUALIZAR"}))}
                        className="text-xs"
                      >
                        Usar Novo Custo
                      </Button>
                      <Button 
                        type="button"
                        variant={escolhasCusto[item.codproduto] === "MANTER" ? "default" : "outline"} 
                        onClick={() => setEscolhasCusto(prev => ({...prev, [item.codproduto]: "MANTER"}))}
                        className="text-xs"
                      >
                        Manter Atual
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogCustoOpen(false)} disabled={isSubmitting}>Cancelar</Button>
              <Button onClick={confirmarVariacoesCusto} disabled={isSubmitting}>
                Confirmar e Registrar Compra
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por fornecedor ou código..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="pl-10" 
          />
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {/* VISUALIZAÇÃO MOBILE (CARDS) */}
        <div className="grid grid-cols-1 gap-4 md:hidden p-4 bg-transparent">
          {comprasFiltradas.map((compra, i) => (
            <div key={compra.uuid || `compra-m-${i}`} className="bg-background border border-border rounded-lg p-4 space-y-3 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-foreground text-sm flex gap-2 items-center">
                    #{compra.codigo_compra}
                    {compra.numero_documento && <Badge variant="secondary" className="text-[10px]">NF: {compra.numero_documento}</Badge>}
                  </h4>
                  <p className="text-base font-medium text-foreground mt-1">{compra.msfornecedor?.nome || 'N/A'}</p>
                  <div className="flex flex-col gap-0.5 mt-2">
                    <span className="text-xs text-muted-foreground">Entrada: {new Date(compra.created_at).toLocaleString("pt-BR")}</span>
                    {compra.numero_documento && <span className="text-xs text-muted-foreground">Emissão: {new Date(compra.data_compra).toLocaleDateString("pt-BR")}</span>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-primary">R$ {Number(compra.valor_total || 0).toLocaleString("pt-BR")}</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <Badge variant="outline" className={
                  compra.status === 'FINALIZADA' || compra.status === 'CONCLUIDA' ? 'text-green-600 border-green-600 bg-green-50' : 
                  compra.status === 'CANCELADA' ? 'text-red-600 border-red-600 bg-red-50' : ''
                }>
                  {compra.status}
                </Badge>
                
                <button
                  onClick={() => abrirDetalhes(compra)}
                  className="p-2 rounded-md border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex items-center justify-center"
                >
                  <Eye className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* VISUALIZAÇÃO DESKTOP (TABELA) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Código</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Data</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fornecedor</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {comprasFiltradas.map((compra, i) => (
                <tr key={compra.uuid || `compra-${i}`} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">
                    <div className="flex flex-col">
                      <span>{compra.codigo_compra}</span>
                      {compra.numero_documento && <span className="text-xs text-muted-foreground">NF: {compra.numero_documento}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span>{new Date(compra.created_at).toLocaleString("pt-BR")}</span>
                      {compra.numero_documento && <span className="text-xs text-muted-foreground">Emi: {new Date(compra.data_compra).toLocaleDateString("pt-BR")}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">{compra.msfornecedor?.nome || 'N/A'}</td>
                  <td className="px-4 py-3 text-right font-medium">R$ {Number(compra.valor_total || 0).toLocaleString("pt-BR")}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="outline" className={
                      compra.status === 'FINALIZADA' || compra.status === 'CONCLUIDA' ? 'text-green-600 border-green-600 bg-green-50' : 
                      compra.status === 'CANCELADA' ? 'text-red-600 border-red-600 bg-red-50' : ''
                    }>
                      {compra.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => abrirDetalhes(compra)}
                      className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="Ver Detalhes"
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

      {comprasFiltradas.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Nenhuma compra encontrada.</p>
        </div>
      )}

      {/* DIALOG DE NOVA COMPRA */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent 
          className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Registrar Compra / Entrada</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Tipo de Entrada</Label>
              <Select value={tipoEntrada} onValueChange={(v) => setTipoEntrada(v as "COMPRA" | "AJUSTE")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="COMPRA">Compra Comercial (de Fornecedor)</SelectItem>
                  <SelectItem value="AJUSTE">Ajuste Manual (Entrada avulsa)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Filial de Destino</Label>
                <Select value={filialDestino} onValueChange={setFilialDestino}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {listaFiliais.map((f, i) => (
                      <SelectItem key={i} value={String(f.codfilial)}>{f.filial}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={statusCompra} onValueChange={setStatusCompra}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDENTE">Pendente</SelectItem>
                    <SelectItem value="CONCLUIDA">Concluída (Gera Estoque)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {tipoEntrada === "COMPRA" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fornecedor (Cód/CNPJ/Nome)</Label>
                  <div className="flex flex-col gap-2">
                    {!fornecedorCod ? (
                      <div className="flex gap-2">
                        <Input
                          value={fornecedorBusca}
                          onChange={(e) => setFornecedorBusca(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleBuscaRapidaFornecedor();
                            }
                          }}
                          placeholder="Busca rápida (Enter)..."
                          className="flex-1"
                        />
                        <Button type="button" variant="outline" onClick={() => setDialogFornecedorOpen(true)} title="Lista de Fornecedores">
                          ...
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Input 
                          value={fornecedorNome} 
                          readOnly 
                          placeholder="Fornecedor Selecionado"
                          className="flex-1 bg-muted/50 border-primary/20 text-primary font-medium"
                        />
                        <Button type="button" variant="ghost" onClick={() => {
                          setFornecedorUuid("");
                          setFornecedorCod("");
                          setFornecedorNome("");
                        }} title="Remover Fornecedor">
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Nº da Nota / Documento</Label>
                  <Input 
                    value={notaFiscalFornecedor} 
                    onChange={e => setNotaFiscalFornecedor(e.target.value)} 
                    placeholder="Ex: 123456" 
                  />
                </div>
              </div>
            )}
            
            <div className="bg-muted/50 p-4 rounded-md space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-primary" />
                Adicionar Produtos
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div className="md:col-span-8 space-y-2">
                  <Label>Produto (Cód. Barras ou Busca)</Label>
                  <div className="flex flex-col gap-2">
                    {!produtoSelecionadoId ? (
                      <div className="flex gap-2">
                        <Input
                          value={buscaProdutoLocal}
                          onChange={(e) => setBuscaProdutoLocal(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleBuscarProdutoLocal();
                            }
                          }}
                          placeholder="Digite código de barras, referência ou nome (Enter)..."
                          className="flex-1"
                        />
                        <Button type="button" variant="outline" onClick={() => setDialogProdutoOpen(true)} title="Lista de Produtos">
                          <Search className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Input 
                          value={listaProdutos.find(p => String(p.codproduto) === produtoSelecionadoId)?.descricao || ""} 
                          readOnly 
                          placeholder="Produto Selecionado"
                          className="flex-1 bg-muted/50 border-primary/20 text-primary font-medium"
                        />
                        <Button type="button" variant="ghost" onClick={() => setProdutoSelecionadoId("")} title="Remover Produto">
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className={`md:col-span-4 grid ${tipoEntrada === "COMPRA" ? "grid-cols-2" : "grid-cols-1"} gap-2`}>
                  <div>
                    <Label>Qtd</Label>
                    <Input type="number" value={qtdSelecionada} onChange={e => setQtdSelecionada(Number(e.target.value))} min={1} />
                  </div>
                  {tipoEntrada === "COMPRA" && (
                    <div>
                      <Label>Custo Unit.</Label>
                      <Input type="number" step="0.01" value={custoSelecionado} onChange={e => setCustoSelecionado(Number(e.target.value))} min={0} />
                    </div>
                  )}
                </div>
                
                <div className="md:col-span-6 grid grid-cols-2 gap-2">
                  <div>
                    <Label>Lote</Label>
                    <Input value={loteSelecionado} onChange={e => setLoteSelecionado(e.target.value)} placeholder="Ex: L123" />
                  </div>
                  <div>
                    <Label>Validade</Label>
                    <Input type="date" value={validadeSelecionada} onChange={e => setValidadeSelecionada(e.target.value)} />
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <Button type="button" onClick={adicionarItem} disabled={!produtoSelecionadoId} className="w-full">
                    Add
                  </Button>
                </div>
              </div>

              {itensCompra.length > 0 && (
                <div className="bg-muted/30 rounded-md p-3 space-y-3">
                  {itensCompra.map((item, i) => (
                    <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between text-sm border-b pb-3 last:border-0 last:pb-0 gap-2">
                      <div className="flex-1 font-medium">{item.nomeProduto}</div>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                        <div className="bg-background px-2 py-1 rounded-md border border-border">
                          <span className="text-muted-foreground mr-1">Qtd:</span>
                          <span className="font-bold">{item.quantidade}</span>
                        </div>
                        
                        <div className="text-muted-foreground">
                          <span className="sm:hidden mr-1">Custo:</span>
                          R$ {item.custo_unitario.toLocaleString('pt-BR')}
                        </div>
                        <div className="font-bold text-foreground">
                          <span className="sm:hidden mr-1">Total:</span>
                          R$ {(item.quantidade * item.custo_unitario).toLocaleString('pt-BR')}
                        </div>
                        
                        {(item.lote || item.validade) && (
                          <div className="flex flex-col text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                            {item.lote && <span>Lote: {item.lote}</span>}
                            {item.validade && <span>Val: {new Date(item.validade).toLocaleDateString('pt-BR', {timeZone:'UTC'})}</span>}
                          </div>
                        )}
                        
                        <button onClick={() => removerItem(item.codproduto)} className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-md transition-colors sm:ml-auto">
                          Remover
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="border-t pt-3 flex justify-between font-bold text-base">
                    <span>{tipoEntrada === "COMPRA" ? "Total da Compra" : "Total do Ajuste (Custo)"}</span>
                    <span className="text-primary">
                      R$ {itensCompra.reduce((s, i) => s + (i.quantidade * i.custo_unitario), 0).toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSubmitting}>Cancelar</Button>
            <Button onClick={handleSalvarCompra} disabled={isSubmitting}>
              {isSubmitting ? "Registrando..." : (tipoEntrada === "COMPRA" ? "Registrar Compra" : "Registrar Ajuste")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG SELECIONAR FORNECEDOR */}
      <Dialog open={dialogFornecedorOpen} onOpenChange={setDialogFornecedorOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Selecionar Fornecedor</DialogTitle></DialogHeader>
          <Input 
            placeholder="Buscar..." 
            value={fornecedorBusca} 
            onChange={e => setFornecedorBusca(e.target.value)} 
          />
          <div className="max-h-60 overflow-y-auto space-y-2 mt-2">
            {listaFornecedores
              .filter(f => f.nome.toLowerCase().includes(fornecedorBusca.toLowerCase()))
              .map(f => (
                <div 
                  key={f.uuid} 
                  className="p-2 border rounded cursor-pointer hover:bg-muted"
                  onClick={() => {
                    setFornecedorUuid(f.uuid);
                    setFornecedorCod(f.codfornecedor);
                    setFornecedorNome(f.nome);
                    setDialogFornecedorOpen(false);
                  }}
                >
                  <div className="font-medium">{f.nome}</div>
                  <div className="text-xs text-muted-foreground">{f.cnpj}</div>
                </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG SELECIONAR PRODUTO */}
      <Dialog open={dialogProdutoOpen} onOpenChange={setDialogProdutoOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Selecionar Produto</DialogTitle></DialogHeader>
          <div className="flex gap-2">
            <Input 
              placeholder="Buscar por nome, código ou código de barras..." 
              value={produtoBusca} 
              onChange={e => setProdutoBusca(e.target.value)} 
              className="flex-1"
            />
            <Button onClick={() => setScannerOpen(true)} variant="outline" className="px-3">
              <Camera className="h-4 w-4" />
            </Button>
          </div>
            <div className="max-h-[60vh] overflow-y-auto space-y-2">
              {listaProdutos
                .filter(p => {
                  const allowBuyFromAnySupplier = localStorage.getItem("allowBuyFromAnySupplier") !== "false";
                  if (fornecedorCod && !allowBuyFromAnySupplier) {
                    if (p.codfornecedor !== Number(fornecedorCod)) return false;
                  }
                  return p.descricao?.toLowerCase().includes(produtoBusca.toLowerCase()) || 
                         String(p.codproduto).includes(produtoBusca) || 
                         (p.codigo_barras && String(p.codigo_barras).toLowerCase().includes(produtoBusca.toLowerCase()))
                })
                .map((p) => {
                // Calcular estoque total do produto
                const estoqueTotal = listaEstoques
                  .filter(e => String(e.codproduto) === String(p.codproduto))
                  .reduce((acc, curr) => acc + curr.quantidade, 0);

                return (
                  <div 
                    key={p.codproduto} 
                    className="p-3 border rounded cursor-pointer hover:bg-muted"
                    onClick={() => {
                      setProdutoSelecionadoId(String(p.codproduto));
                      setCustoSelecionado(Number(p.custo_unitario) || 0);
                      setDialogProdutoOpen(false);
                    }}
                  >
                    <div className="font-medium">{p.descricao}</div>
                    <div className="flex justify-between items-center mt-1">
                      <div className="text-xs text-muted-foreground">Cód: {p.codproduto} | Custo: R$ {Number(p.custo || p.preco_normal || 0).toLocaleString("pt-BR")}</div>
                      <Badge variant="outline" className={estoqueTotal < 0 ? 'text-red-600 border-red-600 bg-red-50 font-bold' : 'text-muted-foreground'}>
                        Estoque: {estoqueTotal}
                      </Badge>
                    </div>
                  </div>
                );
            })}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* DIALOG DETALHES COMPRA */}
      <Dialog open={dialogDetalhesOpen} onOpenChange={setDialogDetalhesOpen}>
        <DialogContent className="w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Detalhes da Compra #{compraSelecionada?.codigo_compra}</DialogTitle></DialogHeader>
          {compraSelecionada && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold">Fornecedor: <span className="font-normal text-muted-foreground">{compraSelecionada.msfornecedor?.nome}</span></p>
                <p className="text-sm font-semibold">Status: <span className="font-normal text-muted-foreground">{compraSelecionada.status}</span></p>
                <p className="text-sm font-semibold">Filial: <span className="font-normal text-muted-foreground">{compraSelecionada.msfilial?.filial || compraSelecionada.codfilial}</span></p>
                <p className="text-sm font-semibold">Data: <span className="font-normal text-muted-foreground">{new Date(compraSelecionada.data_compra || compraSelecionada.created_at).toLocaleString('pt-BR')}</span></p>
              </div>
              <div>
                <h4 className="font-medium border-b pb-1 mb-2">Itens da Compra</h4>
                <div className="w-full">
                  {/* Mobile View */}
                  <div className="md:hidden flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                    {(compraSelecionada.mscompra_item || []).map((item: any, idx: number) => (
                      <div key={idx} className="bg-muted/20 border border-border rounded-md p-3 text-sm flex flex-col gap-1">
                        <div className="font-medium">{item.msproduto?.descricao || "Desconhecido"} <span className="text-muted-foreground text-xs font-normal ml-1">(Cód: {item.codproduto})</span></div>
                        <div className="flex justify-between items-center text-xs mt-1">
                          <span className="text-muted-foreground">Qtd: <span className="font-medium text-foreground">{item.quantidade}</span></span>
                          <span className="text-muted-foreground">Unit: R$ {Number(item.custo_unitario).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                          <span className="font-semibold text-primary">Total: R$ {(item.quantidade * item.custo_unitario).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    ))}
                    {(compraSelecionada.mscompra_item || []).length === 0 && (
                      <p className="text-muted-foreground text-sm py-4 text-center">Nenhum item registrado.</p>
                    )}
                  </div>

                  {/* Desktop View */}
                  <div className="hidden md:block overflow-x-auto max-h-[250px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-background">
                        <tr className="border-b text-left text-muted-foreground text-xs">
                          <th className="pb-2 font-medium pr-2">Cód</th>
                          <th className="pb-2 font-medium">Produto</th>
                          <th className="pb-2 font-medium text-right px-2">Qtd</th>
                          <th className="pb-2 font-medium text-right px-2">Custo Un.</th>
                          <th className="pb-2 font-medium text-right pl-2">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {(compraSelecionada.mscompra_item || []).map((item: any, idx: number) => (
                          <tr key={idx} className="hover:bg-muted/30">
                            <td className="py-2 text-muted-foreground pr-2">{item.codproduto}</td>
                            <td className="py-2 font-medium">{item.msproduto?.descricao || "Desconhecido"}</td>
                            <td className="py-2 text-right px-2">{item.quantidade}</td>
                            <td className="py-2 text-right text-muted-foreground whitespace-nowrap px-2">
                              R$ {Number(item.custo_unitario).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2 text-right font-medium whitespace-nowrap pl-2">
                              R$ {(item.quantidade * item.custo_unitario).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center border-t pt-3">
                <span className="font-semibold text-lg">Total</span>
                <span className="font-bold text-lg text-primary">R$ {Number(compraSelecionada.valor_total || 0).toLocaleString("pt-BR")}</span>
              </div>
              {compraSelecionada.status !== "CANCELADA" && compraSelecionada.tipo_registro !== "AJUSTE" && (
                <div className="flex justify-end pt-4 border-t border-border mt-4">
                  <Button 
                    variant="destructive" 
                    onClick={() => {
                      setMotivoCancelamento("");
                      setDialogCancelarOpen(true);
                    }}
                    className="w-full sm:w-auto"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Cancelar Compra (Estornar)
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* DIALOG CANCELAR COMPRA */}
      <Dialog open={dialogCancelarOpen} onOpenChange={setDialogCancelarOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Cancelar Compra</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              ATENÇÃO: Esta ação irá estornar o estoque de todos os produtos recebidos nesta nota.
              Essa operação não pode ser desfeita.
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
            <Button variant="outline" onClick={() => setDialogCancelarOpen(false)} disabled={isSubmitting}>Sair</Button>
            <Button variant="destructive" onClick={handleCancelarCompra} disabled={isSubmitting || motivoCancelamento.trim().length < 15}>
              {isSubmitting ? "Cancelando..." : "Confirmar Cancelamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* MODAL SCANNER */}
      <BarcodeScannerModal 
        open={scannerOpen} 
        onOpenChange={setScannerOpen} 
        onScan={handleScanProduto} 
      />
    </div>
  );
};

export default Purchases;


