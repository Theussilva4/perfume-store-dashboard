import { useState, useEffect } from "react";
import { getKits, createKit, updateKit, deleteKit } from "@/services/kitsService";
import { getProdutos } from "@/services/produtosService";
import { Produto } from "@/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Search, Plus, Trash2, Pencil, PackageOpen, AlertCircle, ScanBarcode } from "lucide-react";
import { BarcodeScannerModal } from "@/components/BarcodeScannerModal";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

export default function Kits() {
  const [kits, setKits] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [search, setSearch] = useState("");
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editandoKit, setEditandoKit] = useState<any>(null);
  
  // Formulário
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [precoKit, setPrecoKit] = useState<number | "">("");
  const [precoKitCartao, setPrecoKitCartao] = useState<number | "">("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [itens, setItens] = useState<{ produto: Produto, quantidade: number }[]>([]);

  // Pesquisa de produto no form
  const [produtoBusca, setProdutoBusca] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      const [kitsData, prodsData] = await Promise.all([getKits(), getProdutos()]);
      setKits(kitsData);
      setProdutos(Array.isArray(prodsData) ? prodsData.filter(p => p.status !== "I").map(p => ({
        ...p,
        precoVenda: p.preco_normal || 0
      })) : []);
    } catch (err) {
      toast.error("Erro ao carregar dados.");
    }
  }

  const filtrados = kits.filter(k => 
    k.nome.toLowerCase().includes(search.toLowerCase()) || 
    (k.descricao && k.descricao.toLowerCase().includes(search.toLowerCase()))
  );

  const abrirNovo = () => {
    setEditandoKit(null);
    setNome("");
    setDescricao("");
    setPrecoKit("");
    setPrecoKitCartao("");
    setDataInicio("");
    setDataFim("");
    setAtivo(true);
    setItens([]);
    setProdutoBusca("");
    setDialogOpen(true);
  };

  const abrirEdicao = (kit: any) => {
    setEditandoKit(kit);
    setNome(kit.nome);
    setDescricao(kit.descricao || "");
    setPrecoKit(Number(kit.preco_kit));
    setPrecoKitCartao(kit.preco_kit_cartao ? Number(kit.preco_kit_cartao) : "");
    setDataInicio(kit.data_inicio ? kit.data_inicio.split("T")[0] : "");
    setDataFim(kit.data_fim ? kit.data_fim.split("T")[0] : "");
    setAtivo(kit.ativo === "S");
    
    // Mapear itens para o formato do state
    const kitItens = kit.itens.map((ki: any) => {
      const prodCompleto = produtos.find(p => p.codproduto === ki.produto_id) || {
        codproduto: ki.produto.codproduto,
        descricao: ki.produto.descricao,
        precoVenda: ki.produto.preco_venda
      };
      return {
        produto: prodCompleto,
        quantidade: ki.quantidade
      };
    });
    
    setItens(kitItens);
    setProdutoBusca("");
    setDialogOpen(true);
  };

  const adicionarProduto = (p: Produto) => {
    const existe = itens.find(i => i.produto.codproduto === p.codproduto);
    if (existe) {
      setItens(itens.map(i => i.produto.codproduto === p.codproduto ? { ...i, quantidade: i.quantidade + 1 } : i));
    } else {
      setItens([...itens, { produto: p, quantidade: 1 }]);
    }
    setProdutoBusca("");
  };

  const removerItem = (cod: number) => {
    setItens(itens.filter(i => i.produto.codproduto !== cod));
  };

  const alterarQtdItem = (cod: number, delta: number) => {
    setItens(itens.map(i => {
      if (i.produto.codproduto === cod) {
        const novaQtd = i.quantidade + delta;
        return { ...i, quantidade: novaQtd > 0 ? novaQtd : 1 };
      }
      return i;
    }));
  };

  const salvarKit = async () => {
    if (!nome || !precoKit || itens.length === 0) {
      toast.warning("Nome, preço do kit e pelo menos um produto são obrigatórios.");
      return;
    }

    const payload = {
      nome,
      descricao,
      preco_kit: Number(precoKit),
      preco_kit_cartao: precoKitCartao ? Number(precoKitCartao) : null,
      data_inicio: dataInicio || null,
      data_fim: dataFim || null,
      ativo: ativo ? "S" : "N",
      itens: itens.map(i => ({ produto_id: i.produto.codproduto, quantidade: i.quantidade }))
    };

    try {
      if (editandoKit) {
        const resp = await updateKit(editandoKit.id, payload);
        if (resp.aviso) toast.info(resp.aviso, { duration: 6000 });
        else toast.success("Kit atualizado com sucesso!");
      } else {
        await createKit(payload);
        toast.success("Kit criado com sucesso!");
      }
      setDialogOpen(false);
      carregarDados();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Erro ao salvar o kit");
    }
  };

  const inativarKit = async (id: number) => {
    if(confirm("Deseja realmente inativar este kit? Ele não aparecerá mais para vendas.")) {
      try {
        await deleteKit(id);
        toast.success("Kit inativado!");
        carregarDados();
      } catch (err) {
        toast.error("Erro ao inativar kit.");
      }
    }
  };

  // Cálculos de rodapé
  const precoTotalProdutos = itens.reduce((acc, i) => acc + (Number(i.produto.precoVenda || 0) * i.quantidade), 0);
  const valorKit = Number(precoKit || 0);
  const economia = precoTotalProdutos - valorKit;
  const economiaPerc = precoTotalProdutos > 0 ? (economia / precoTotalProdutos) * 100 : 0;

  // Produtos filtrados para a busca no form
  const produtosBuscaResult = produtoBusca.length > 1 
    ? produtos.filter(p => {
        const descr = p.descricao || "";
        const cb = p.codigo_barras || p.codigoBarras || "";
        return descr.toLowerCase().includes(produtoBusca.toLowerCase()) || String(cb).includes(produtoBusca);
      }).slice(0, 5)
    : [];

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto pb-24">
      <div className="flex justify-between items-center bg-white p-5 rounded-xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <PackageOpen className="h-6 w-6 text-purple-600" /> Kits Comerciais
          </h1>
          <p className="text-slate-500 text-sm">Crie pacotes promocionais para vender produtos juntos</p>
        </div>
        <Button onClick={abrirNovo} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="mr-2 h-4 w-4" /> Novo Kit
        </Button>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Buscar kit por nome..." 
            className="pl-9 bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtrados.map((k) => (
          <Card key={k.id} className={`overflow-hidden flex flex-col ${k.ativo === 'N' ? 'opacity-60 grayscale' : ''}`}>
            <div className="bg-slate-50 p-4 border-b border-slate-100">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-slate-800 line-clamp-1">{k.nome}</h3>
                <Badge variant={k.ativo === 'S' ? 'default' : 'secondary'} className={k.ativo === 'S' ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' : ''}>
                  {k.ativo === 'S' ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              {k.descricao && <p className="text-sm text-slate-500 line-clamp-2 mb-3">{k.descricao}</p>}
              <div className="flex gap-2">
                <Badge variant="outline" className="bg-white" title="Preço Normal">
                  R$ {Number(k.preco_kit).toFixed(2)}
                </Badge>
                {k.preco_kit_cartao > 0 && (
                  <Badge variant="outline" className="bg-white" title="Preço Cartão">
                    💳 R$ {Number(k.preco_kit_cartao).toFixed(2)}
                  </Badge>
                )}
                {k.economia > 0 && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    -{k.economia_percentual.toFixed(1)}%
                  </Badge>
                )}
              </div>
            </div>
            
            <CardContent className="p-4 flex-1">
              <div className="space-y-2 mb-4">
                <p className="text-xs font-semibold text-slate-500 uppercase">Composição ({k.itens.length} itens)</p>
                <ul className="text-sm space-y-1 text-slate-700">
                  {k.itens.slice(0, 3).map((ki: any) => (
                    <li key={ki.id} className="flex justify-between">
                      <span className="truncate pr-2">{ki.quantidade}x {ki.produto.descricao}</span>
                    </li>
                  ))}
                  {k.itens.length > 3 && (
                    <li className="text-xs text-slate-400 italic">...e mais {k.itens.length - 3} itens</li>
                  )}
                </ul>
              </div>

              {k.tem_vendas && (
                <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 p-2 rounded mb-4">
                  <AlertCircle className="h-3 w-3" /> Kit possui vendas vinculadas
                </div>
              )}
            </CardContent>

            <div className="p-4 border-t border-slate-100 bg-white flex justify-end gap-2 mt-auto">
              {k.ativo === 'S' && (
                <Button variant="ghost" size="sm" onClick={() => inativarKit(k.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => abrirEdicao(k)}>
                <Pencil className="h-4 w-4 mr-1" /> Editar
              </Button>
            </div>
          </Card>
        ))}
        {filtrados.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl border border-slate-100 shadow-sm">
            Nenhum kit encontrado.
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editandoKit ? "Editar Kit Comercial" : "Novo Kit Comercial"}</DialogTitle>
            <DialogDescription>
              {editandoKit?.tem_vendas ? 
                "⚠️ Este kit já possui vendas. Você pode alterar dados cadastrais, mas a composição de produtos está bloqueada para preservar o histórico." 
                : "Agrupe produtos e defina um preço especial de venda."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            {/* Lado Esquerdo: Dados do Kit */}
            <div className="space-y-4 border-r pr-4">
              <div className="space-y-2">
                <Label>Nome do Kit *</Label>
                <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Kit Dia dos Pais" />
              </div>
              
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Detalhes opcionais da promoção..." className="resize-none" rows={3} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Preço do Kit (R$) *</Label>
                  <Input type="number" value={precoKit} onChange={e => setPrecoKit(e.target.value ? Number(e.target.value) : "")} placeholder="199.90" />
                </div>
                <div className="space-y-2">
                  <Label>Preço Cartão (R$)</Label>
                  <Input type="number" value={precoKitCartao} onChange={e => setPrecoKitCartao(e.target.value ? Number(e.target.value) : "")} placeholder="210.00" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data Início (Opcional)</Label>
                  <Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Data Fim (Opcional)</Label>
                  <Input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="space-y-0.5">
                  <Label className="text-sm font-semibold">Status do Kit</Label>
                  <p className="text-xs text-slate-500">Se inativo, não aparece no PDV.</p>
                </div>
                <Switch checked={ativo} onCheckedChange={setAtivo} />
              </div>
            </div>

            {/* Lado Direito: Composição */}
            <div className="space-y-4 flex flex-col h-full">
              <div className="space-y-2">
                <Label>Produtos do Kit *</Label>
                
                {!editandoKit?.tem_vendas && (
                  <div className="relative">
                    <Input 
                      placeholder="Buscar produto por nome ou EAN..." 
                      value={produtoBusca}
                      onChange={e => setProdutoBusca(e.target.value)}
                      className="pr-10"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-primary"
                      onClick={() => setScannerOpen(true)}
                      title="Ler Código de Barras"
                    >
                      <ScanBarcode className="h-5 w-5" />
                    </Button>
                    {produtosBuscaResult.length > 0 && (
                      <div className="absolute z-10 w-full bg-white border border-slate-200 rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto">
                        {produtosBuscaResult.map(p => (
                          <div 
                            key={p.codproduto} 
                            className="p-2 hover:bg-slate-50 cursor-pointer flex justify-between items-center text-sm"
                            onClick={() => adicionarProduto(p)}
                          >
                            <span className="truncate pr-2">{p.descricao}</span>
                            <span className="font-semibold text-slate-600">R$ {Number(p.precoVenda || 0).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex-1 bg-slate-50 rounded-md border border-slate-200 p-2 overflow-y-auto min-h-[200px]">
                {itens.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 p-4 text-center text-sm">
                    <PackageOpen className="h-8 w-8 mb-2 opacity-50" />
                    Nenhum produto adicionado. Busque acima para compor o kit.
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {itens.map(item => (
                      <li key={item.produto.codproduto} className="bg-white p-2 rounded shadow-sm border border-slate-100 flex items-center justify-between">
                        <div className="flex-1 min-w-0 pr-2">
                          <p className="text-sm font-medium text-slate-800 truncate" title={item.produto.descricao}>{item.produto.descricao}</p>
                          <p className="text-xs text-slate-500">Unitário: R$ {Number(item.produto.precoVenda || 0).toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center border rounded">
                            <button 
                              className="px-2 py-1 bg-slate-50 hover:bg-slate-100 disabled:opacity-50" 
                              onClick={() => alterarQtdItem(item.produto.codproduto, -1)}
                              disabled={editandoKit?.tem_vendas || item.quantidade <= 1}
                            >-</button>
                            <span className="px-2 text-sm min-w-[2rem] text-center">{item.quantidade}</span>
                            <button 
                              className="px-2 py-1 bg-slate-50 hover:bg-slate-100 disabled:opacity-50" 
                              onClick={() => alterarQtdItem(item.produto.codproduto, 1)}
                              disabled={editandoKit?.tem_vendas}
                            >+</button>
                          </div>
                          {!editandoKit?.tem_vendas && (
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500" onClick={() => removerItem(item.produto.codproduto)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Rodapé de Cálculos Automáticos */}
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 space-y-2">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Soma dos Produtos:</span>
                  <span className={economia > 0 ? "line-through opacity-70" : "font-semibold"}>R$ {precoTotalProdutos.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-slate-800">
                  <span>Preço do Kit:</span>
                  <span>R$ {valorKit.toFixed(2)}</span>
                </div>
                {economia > 0 && (
                  <div className="flex justify-between text-sm text-green-600 font-semibold pt-1 border-t border-purple-100/50 mt-1">
                    <span>Economia para o cliente:</span>
                    <span>R$ {economia.toFixed(2)} ({economiaPerc.toFixed(1)}%)</span>
                  </div>
                )}
                {economia < 0 && (
                  <div className="flex justify-between text-sm text-red-600 font-semibold pt-1 border-t border-purple-100/50 mt-1">
                    <span>Atenção:</span>
                    <span>Kit está mais caro que os produtos!</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button className="bg-purple-600 hover:bg-purple-700" onClick={salvarKit}>Salvar Kit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BarcodeScannerModal 
        open={scannerOpen} 
        onOpenChange={setScannerOpen} 
        onScan={(text) => {
          setProdutoBusca(text);
          setScannerOpen(false);
          toast.success("Código lido com sucesso!");
        }} 
      />
    </div>
  );
}

