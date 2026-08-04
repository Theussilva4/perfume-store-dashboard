import { useState, useEffect, useRef } from "react";
import { getProdutos } from "@/services/produtosService";
import { getExtratoEstoque } from "@/services/estoqueService";
import { Produto } from "@/types";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BarcodeScannerModal } from "@/components/BarcodeScannerModal";
import { FileText, Search, PackageSearch, Camera } from "lucide-react";
import { toast } from "sonner";

export default function StockAnalytics() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [produtoId, setProdutoId] = useState<string>("");
  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");
  
  const [extrato, setExtrato] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Search dialog
  const [dialogProdutoOpen, setDialogProdutoOpen] = useState(false);
  const [produtoBusca, setProdutoBusca] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    carregarProdutos();
  }, []);

  useEffect(() => {
    if (dialogProdutoOpen && inputRef.current) {
      // Pequeno timeout para dar tempo do modal abrir antes de focar
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [dialogProdutoOpen]);

  async function carregarProdutos() {
    try {
      const prodsData = await getProdutos();
      setProdutos(Array.isArray(prodsData) ? prodsData : []);
    } catch (err) {
      toast.error("Erro ao carregar produtos.");
    }
  }

  const gerarExtrato = async () => {
    if (!produtoId) {
      toast.error("Selecione um produto primeiro.");
      return;
    }
    setLoading(true);
    try {
      const data = await getExtratoEstoque(produtoId, dataInicial, dataFinal);
      setExtrato(data);
    } catch (error: any) {
      toast.error(error.response?.data?.erro || "Erro ao gerar extrato.");
    } finally {
      setLoading(false);
    }
  };

  const formataMoeda = (valor: number) => {
    if (valor === null || valor === undefined) return "-";
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };

  const produtoSelecionado = produtos.find(p => String(p.codproduto) === produtoId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Analítico de Estoque</h1>
        <p className="text-muted-foreground">Extrato detalhado de movimentações por produto.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-2 space-y-2">
              <Label>Produto</Label>
              <Button type="button" variant="outline" onClick={() => setDialogProdutoOpen(true)} className="w-full justify-between h-10">
                {produtoSelecionado ? `${produtoSelecionado.codproduto} - ${produtoSelecionado.descricao}` : "Selecionar Produto..."}
                <Search className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Data Inicial (Opcional)</Label>
              <Input type="date" value={dataInicial} onChange={(e) => setDataInicial(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Data Final (Opcional)</Label>
              <Input type="date" value={dataFinal} onChange={(e) => setDataFinal(e.target.value)} />
            </div>

            <Button onClick={gerarExtrato} disabled={loading} className="w-full md:w-auto md:col-span-4 mt-2">
              <FileText className="mr-2 h-4 w-4" />
              {loading ? "Gerando..." : "Gerar Relatório"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {extrato && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl">Extrato de Produtos</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Produto: <span className="font-semibold text-foreground">{produtoSelecionado?.codproduto} - {produtoSelecionado?.descricao}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Data de Emissão: {format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
                <p className="text-sm font-medium mt-1">Saldo Inicial do Período: {extrato.saldo_inicial}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Data Mov</th>
                    <th className="px-4 py-3 font-medium">Hora</th>
                    <th className="px-4 py-3 font-medium">Operação</th>
                    <th className="px-4 py-3 font-medium">Motivo/Ajuste</th>
                    <th className="px-4 py-3 font-medium">Num. Doc</th>
                    <th className="px-4 py-3 font-medium">Cliente/Fornecedor/Func</th>
                    <th className="px-4 py-3 font-medium">Pr. Unit.</th>
                    <th className="px-4 py-3 font-medium text-center">Qt. Entrada</th>
                    <th className="px-4 py-3 font-medium text-center">Qt. Saída</th>
                    <th className="px-4 py-3 font-medium text-right">Saldo Est.</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {extrato.movimentacoes.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center">
                          <PackageSearch className="h-8 w-8 mb-2 opacity-50" />
                          <p>Nenhuma movimentação encontrada neste período.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    extrato.movimentacoes.map((mov: any) => (
                      <tr key={mov.id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-2">{format(new Date(mov.data_mov), 'dd/MM/yyyy')}</td>
                        <td className="px-4 py-2">{format(new Date(mov.data_mov), 'HH:mm')}</td>
                        <td className="px-4 py-2">
                           <Badge variant={mov.operacao.startsWith('E') ? 'default' : 'destructive'} className="whitespace-nowrap">
                             {mov.operacao}
                           </Badge>
                        </td>
                        <td className="px-4 py-2 truncate max-w-[150px]" title={mov.motivo}>{mov.motivo || "-"}</td>
                        <td className="px-4 py-2">{mov.documento || "-"}</td>
                        <td className="px-4 py-2 truncate max-w-[200px]" title={mov.envolvido}>{mov.envolvido || "-"}</td>
                        <td className="px-4 py-2">{formataMoeda(mov.precoUnitario)}</td>
                        <td className="px-4 py-2 text-center font-medium text-green-600">{mov.qt_entrada > 0 ? mov.qt_entrada : "-"}</td>
                        <td className="px-4 py-2 text-center font-medium text-red-600">{mov.qt_saida > 0 ? mov.qt_saida : "-"}</td>
                        <td className="px-4 py-2 text-right font-bold">{mov.saldo_est}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-8 border-t pt-4">
              <h3 className="text-lg font-bold mb-4">Resumo Final</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <table className="w-full text-sm text-left border">
                    <thead className="bg-muted text-muted-foreground border-b">
                      <tr>
                        <th className="px-4 py-2 font-medium">Operação</th>
                        <th className="px-4 py-2 font-medium text-right">Qtde Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      <tr>
                        <td className="px-4 py-2 font-medium">E Entrada (Total)</td>
                        <td className="px-4 py-2 text-right text-green-600 font-bold">{extrato.totais.entradas}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-medium">S Saída (Total)</td>
                        <td className="px-4 py-2 text-right text-red-600 font-bold">{extrato.totais.saidas}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col items-end justify-center space-y-2 bg-muted/30 p-4 rounded-md border">
                  <div className="flex justify-between w-full max-w-[250px]">
                    <span className="text-muted-foreground">Saldo Inicial do Período:</span>
                    <span className="font-medium">{extrato.saldo_inicial}</span>
                  </div>
                  <div className="flex justify-between w-full max-w-[250px]">
                    <span className="text-muted-foreground">Total de Entradas:</span>
                    <span className="font-medium text-green-600">+{extrato.totais.entradas}</span>
                  </div>
                  <div className="flex justify-between w-full max-w-[250px] border-b pb-2">
                    <span className="text-muted-foreground">Total de Saídas:</span>
                    <span className="font-medium text-red-600">-{extrato.totais.saidas}</span>
                  </div>
                  <div className="flex justify-between w-full max-w-[250px] pt-2">
                    <span className="text-lg font-bold">Saldo Sistema:</span>
                    <span className="text-lg font-bold">{extrato.saldo_final}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* DIALOG DE BUSCA DE PRODUTO */}
      <Dialog open={dialogProdutoOpen} onOpenChange={setDialogProdutoOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Buscar Produto</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2">
            <Input 
              ref={inputRef}
              placeholder="Digite o nome, código ou EAN..." 
              value={produtoBusca}
              onChange={(e) => setProdutoBusca(e.target.value)}
              className="flex-1"
            />
            <Button variant="outline" onClick={() => setScannerOpen(true)}>
              <Camera className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 mt-4 pr-2 max-h-[60vh]">
            {produtos
              .filter(p => {
                if (p.status && p.status !== "A") return false;
                const termo = produtoBusca.toLowerCase();
                return p.descricao?.toLowerCase().includes(termo) || 
                       String(p.codproduto).includes(termo) || 
                       (p.codigo_barras && String(p.codigo_barras).toLowerCase().includes(termo))
              })
              .slice(0, 50)
              .map((p) => (
                <div 
                  key={p.codproduto} 
                  className="p-3 border rounded cursor-pointer hover:bg-muted"
                  onClick={() => {
                    setProdutoId(String(p.codproduto));
                    setDialogProdutoOpen(false);
                    setProdutoBusca(""); // limpa a busca pra próxima
                  }}
                >
                  <div className="font-medium">{p.descricao}</div>
                  <div className="flex justify-between items-center mt-1">
                    <div className="text-xs text-muted-foreground">
                      Cód: {p.codproduto} | Cód. Barras: {p.codigo_barras || 'N/A'} {p.marca ? `| ${p.marca}` : ''}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </DialogContent>
      </Dialog>

      <BarcodeScannerModal 
        isOpen={scannerOpen} 
        onClose={() => setScannerOpen(false)} 
        onScan={(code) => {
          setProdutoBusca(code);
          setScannerOpen(false);
          toast.success("Código lido: " + code);
        }} 
      />
    </div>
  );
}