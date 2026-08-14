import { useState, useEffect } from "react";
import { format, differenceInDays } from "date-fns";
import { 
  AlertTriangle, 
  CalendarClock, 
  Clock, 
  Package, 
  RefreshCw, 
  Trash2,
  Plus,
  Search
} from "lucide-react";
import { toast } from "sonner";

import { useBranch } from "@/contexts/BranchContext";
import api from "@/services/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function Expirations() {
  const { filialSelecionada, rotuloFilial } = useBranch();
  
  const [lotes, setLotes] = useState<any[]>([]);
  const [pendencias, setPendencias] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("rastreados");

  // Dialog de Descarte
  const [dialogDescarteOpen, setDialogDescarteOpen] = useState(false);
  const [loteSelecionado, setLoteSelecionado] = useState<any>(null);
  const [descarteQtd, setDescarteQtd] = useState(1);
  const [descarteMotivo, setDescarteMotivo] = useState("");
  const [descarteObs, setDescarteObs] = useState("");

  const codfilial = filialSelecionada !== "todas" ? Number(filialSelecionada) : undefined;

  // Dialog de Atribuição
  const [dialogAtribuirOpen, setDialogAtribuirOpen] = useState(false);
  const [pendenciaSelecionada, setPendenciaSelecionada] = useState<any>(null);
  const [atribQtd, setAtribQtd] = useState(1);
  const [atribLote, setAtribLote] = useState("");
  const [atribValidade, setAtribValidade] = useState("");

  const carregarDados = async () => {
    setLoading(true);
    try {
      const codfilial = filialSelecionada !== "todas" ? Number(filialSelecionada) : undefined;
      const q = filialSelecionada !== "todas" ? `?codfilial=${codfilial}` : "";
      
      const resLotes = await api.get(`/estoque/validades/lotes${q}`);
      setLotes(resLotes.data || []);

      if (filialSelecionada !== "todas") {
        const resPendencias = await api.get(`/estoque/validades/pendencias?codfilial=${codfilial}`);
        setPendencias(resPendencias.data || []);
      } else {
        setPendencias([]);
      }
    } catch (error) {
      toast.error("Erro ao carregar dados de validade.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [filialSelecionada]);

  // Cálculos dos Cards
  const hoje = new Date();
  let vencidos = 0;
  let venceEm30 = 0;
  let venceEm90 = 0;

  lotes.forEach(l => {
    if (!l.validade) return;
    const dataValidade = new Date(l.validade);
    const diff = differenceInDays(dataValidade, hoje);
    
    if (diff < 0) {
      vencidos++;
    } else if (diff <= 30) {
      venceEm30++;
    } else if (diff <= 90) {
      venceEm90++;
    }
  });

  const totalPendencias = pendencias.reduce((acc, p) => acc + p.qtd_pendente, 0);

  // Filtros
  const lotesFiltrados = lotes.filter(l => {
    const term = searchTerm.toLowerCase();
    return l.msproduto?.descricao?.toLowerCase().includes(term) || 
           l.lote?.toLowerCase().includes(term) ||
           String(l.codproduto).includes(term);
  });

  const pendenciasFiltradas = pendencias.filter(p => {
    const term = searchTerm.toLowerCase();
    return p.msproduto?.descricao?.toLowerCase().includes(term) || 
           String(p.codproduto).includes(term);
  });

  // Funções de Ação
  const handleDescartarLote = async () => {
    if (!descarteMotivo) return toast.error("Selecione um motivo.");
    if (descarteQtd < 1 || descarteQtd > loteSelecionado.quantidade) {
      return toast.error("Quantidade inválida.");
    }

    try {
      await api.post("/estoque/validades/descartar", {
        id_lote: loteSelecionado.id,
        quantidade: descarteQtd,
        motivo: descarteMotivo,
        observacao: descarteObs
      });
      toast.success("Lote descartado com sucesso!");
      setDialogDescarteOpen(false);
      carregarDados();
    } catch (error: any) {
      toast.error(error.response?.data?.erro || "Erro ao descartar lote.");
    }
  };

  const handleAtribuirLote = async () => {
    if (!atribValidade) return toast.error("Informe a data de validade.");
    if (atribQtd < 1 || atribQtd > pendenciaSelecionada.qtd_pendente) {
      return toast.error(`Quantidade máxima permitida: ${pendenciaSelecionada.qtd_pendente}`);
    }

    try {
      await api.post("/estoque/validades/atribuir", {
        codproduto: pendenciaSelecionada.codproduto,
        codfilial: filialSelecionada !== "todas" ? Number(filialSelecionada) : 1, 
        quantidade: atribQtd,
        lote: atribLote || "MANUAL",
        validade: atribValidade
      });
      toast.success("Validade atribuída com sucesso!");
      setDialogAtribuirOpen(false);
      carregarDados();
    } catch (error: any) {
      toast.error(error.response?.data?.erro || "Erro ao atribuir validade.");
    }
  };

  const formatarData = (isoStr: string) => {
    if (!isoStr) return "-";
    // Forçar UTC para evitar timezone descendo um dia
    const date = new Date(isoStr);
    return format(new Date(date.getTime() + date.getTimezoneOffset() * 60000), "dd/MM/yyyy");
  };

  const getStatusBadge = (isoStr: string) => {
    if (!isoStr) return <Badge variant="outline">Indefinido</Badge>;
    const diff = differenceInDays(new Date(isoStr), hoje);
    if (diff < 0) return <Badge className="bg-red-500 hover:bg-red-600 border-0">Vencido</Badge>;
    if (diff <= 30) return <Badge className="bg-orange-500 hover:bg-orange-600 border-0">&lt; 30 dias</Badge>;
    if (diff <= 90) return <Badge className="bg-yellow-500 hover:bg-yellow-600 border-0">&lt; 90 dias</Badge>;
    return <Badge className="bg-green-500 hover:bg-green-600 border-0">OK</Badge>;
  };

  return (
    <div className="space-y-6 animate-fade-in-up pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl md:text-3xl font-semibold text-primary">Controle de Validades</h2>
          <p className="text-sm text-muted-foreground mt-1">Gestão FEFO e Rastreabilidade</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={carregarDados} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border rounded-xl p-4 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-full">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Vencidos</p>
            <h3 className="text-2xl font-bold text-red-600">{vencidos} lotes</h3>
          </div>
        </div>

        <div className="bg-white border rounded-xl p-4 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-full">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Até 30 dias</p>
            <h3 className="text-2xl font-bold text-orange-600">{venceEm30} lotes</h3>
          </div>
        </div>

        <div className="bg-white border rounded-xl p-4 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-yellow-100 text-yellow-600 rounded-full">
            <CalendarClock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">De 31 a 90 dias</p>
            <h3 className="text-2xl font-bold text-yellow-600">{venceEm90} lotes</h3>
          </div>
        </div>

        <div className="bg-white border rounded-xl p-4 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-gray-100 text-gray-600 rounded-full">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Sem Rastreabilidade</p>
            <h3 className="text-2xl font-bold text-gray-700">{totalPendencias} un</h3>
          </div>
        </div>
      </div>

      {/* TABS E TABELAS */}
      <div className="bg-card rounded-xl border shadow-sm">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b px-4 py-2 flex flex-col sm:flex-row justify-between items-center gap-4">
            <TabsList className="bg-muted">
              <TabsTrigger value="rastreados">Lotes Rastreados</TabsTrigger>
              <TabsTrigger value="pendencias" className="relative">
                Pendências
                {pendencias.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar produto ou lote..." 
                className="pl-9 bg-background" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <TabsContent value="rastreados" className="p-0 m-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-4 py-3 text-left font-medium">Produto</th>
                    <th className="px-4 py-3 text-left font-medium">Lote</th>
                    <th className="px-4 py-3 text-center font-medium">Qtd</th>
                    <th className="px-4 py-3 text-center font-medium">Validade</th>
                    <th className="px-4 py-3 text-center font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {lotesFiltrados.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum lote encontrado</td></tr>
                  ) : (
                    lotesFiltrados.map((lote) => (
                      <tr key={lote.id} className="hover:bg-muted/20">
                        <td className="px-4 py-3 font-medium">
                          {lote.msproduto?.descricao}
                          <div className="text-xs text-muted-foreground">Cód: {lote.codproduto}</div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground font-mono">{lote.lote}</td>
                        <td className="px-4 py-3 text-center font-semibold">{lote.quantidade}</td>
                        <td className="px-4 py-3 text-center font-medium">{formatarData(lote.validade)}</td>
                        <td className="px-4 py-3 text-center">{getStatusBadge(lote.validade)}</td>
                        <td className="px-4 py-3 text-right">
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => {
                              setLoteSelecionado(lote);
                              setDescarteQtd(1);
                              setDescarteMotivo("");
                              setDescarteObs("");
                              setDialogDescarteOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Descartar</span>
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="pendencias" className="p-0 m-0">
            {filialSelecionada === "todas" ? (
              <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center">
                <AlertTriangle className="h-10 w-10 text-orange-400 mb-3" />
                <h3 className="text-lg font-medium text-foreground">Selecione uma filial</h3>
                <p>Para visualizar as pendências de rastreabilidade, selecione uma filial específica no topo da página.</p>
              </div>
            ) : (
              <>
                <div className="p-4 bg-muted/20 text-sm text-muted-foreground border-b">
                  Produtos que controlam validade e possuem saldo global no estoque maior do que o saldo rastreado em lotes.
                </div>
                <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-4 py-3 text-left font-medium">Produto</th>
                    <th className="px-4 py-3 text-center font-medium">Estoque Total</th>
                    <th className="px-4 py-3 text-center font-medium">Já Rastreado</th>
                    <th className="px-4 py-3 text-center font-medium text-orange-600">Pendente</th>
                    <th className="px-4 py-3 text-right font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pendenciasFiltradas.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Nenhuma pendência encontrada. Parabéns! 🎉</td></tr>
                  ) : (
                    pendenciasFiltradas.map((pend) => (
                      <tr key={pend.codproduto} className="hover:bg-muted/20">
                        <td className="px-4 py-3 font-medium">
                          {pend.msproduto?.descricao}
                          <div className="text-xs text-muted-foreground">Cód: {pend.codproduto}</div>
                        </td>
                        <td className="px-4 py-3 text-center font-medium">{pend.quantidade}</td>
                        <td className="px-4 py-3 text-center text-muted-foreground">{pend.qtd_rastreada}</td>
                        <td className="px-4 py-3 text-center font-bold text-orange-600">{pend.qtd_pendente}</td>
                        <td className="px-4 py-3 text-right">
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => {
                              setPendenciaSelecionada(pend);
                              setAtribQtd(pend.qtd_pendente);
                              setAtribLote("");
                              setAtribValidade("");
                              setDialogAtribuirOpen(true);
                            }}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Atribuir Lote
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* DIALOG DE DESCARTE */}
      <Dialog open={dialogDescarteOpen} onOpenChange={setDialogDescarteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Descartar / Baixar Lote</DialogTitle>
            <DialogDescription>
              Remover mercadoria do lote <strong>{loteSelecionado?.lote}</strong> do produto {loteSelecionado?.msproduto?.descricao}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Quantidade a Descartar (Máx: {loteSelecionado?.quantidade})</Label>
              <Input 
                type="number" 
                min={1} 
                max={loteSelecionado?.quantidade}
                value={descarteQtd} 
                onChange={(e) => setDescarteQtd(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Motivo</Label>
              <Select value={descarteMotivo} onValueChange={setDescarteMotivo}>
                <SelectTrigger><SelectValue placeholder="Selecione o motivo..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Vencido">Vencido</SelectItem>
                  <SelectItem value="Danificado">Danificado</SelectItem>
                  <SelectItem value="Quebrado">Quebrado</SelectItem>
                  <SelectItem value="Perda">Perda</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {descarteMotivo === "Outro" && (
              <div className="space-y-2">
                <Label>Observação</Label>
                <Textarea 
                  placeholder="Especifique o motivo do descarte..." 
                  value={descarteObs}
                  onChange={(e) => setDescarteObs(e.target.value)}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogDescarteOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDescartarLote}>Confirmar Descarte</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG DE ATRIBUIÇÃO */}
      <Dialog open={dialogAtribuirOpen} onOpenChange={setDialogAtribuirOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atribuir Validade (Estoque Legado)</DialogTitle>
            <DialogDescription>
              {pendenciaSelecionada?.msproduto?.descricao}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-orange-50 border border-orange-200 text-orange-800 p-3 rounded-md text-sm">
              Você pode atribuir validade para no máximo <strong>{pendenciaSelecionada?.qtd_pendente} unidades</strong>.
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantidade</Label>
                <Input 
                  type="number" 
                  min={1} 
                  max={pendenciaSelecionada?.qtd_pendente}
                  value={atribQtd} 
                  onChange={(e) => setAtribQtd(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Data de Validade</Label>
                <Input 
                  type="date" 
                  value={atribValidade} 
                  onChange={(e) => setAtribValidade(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Lote (Opcional)</Label>
              <Input 
                placeholder="Deixe em branco para 'MANUAL'" 
                value={atribLote} 
                onChange={(e) => setAtribLote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogAtribuirOpen(false)}>Cancelar</Button>
            <Button onClick={handleAtribuirLote}>Salvar Validade</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
