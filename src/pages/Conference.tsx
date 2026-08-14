import { useState, useEffect } from "react";
import { Search, CheckCircle2, ChevronRight, AlertCircle, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useBranch } from "@/contexts/BranchContext";
import api from "@/services/api";

const Conference = () => {
  const [compras, setCompras] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const { filialSelecionada } = useBranch();
  
  // Modal de conferência
  const [dialogOpen, setDialogOpen] = useState(false);
  const [compraAtiva, setCompraAtiva] = useState<any>(null);
  const [itensConferencia, setItensConferencia] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [divergenciaDialogOpen, setDivergenciaDialogOpen] = useState(false);
  const [itensDivergentes, setItensDivergentes] = useState<any[]>([]);

  useEffect(() => {
    carregarCompras();
  }, [filialSelecionada]);

  const carregarCompras = async () => {
    setLoading(true);
    try {
      const res = await api.get("/compras");
      // Filtra apenas compras com status EM_CONFERENCIA
      let filtradas = res.data.filter((c: any) => c.status === "EM_CONFERENCIA");
      
      if (filialSelecionada !== "todas") {
        filtradas = filtradas.filter((c: any) => String(c.codfilial) === String(filialSelecionada));
      }
      
      setCompras(filtradas);
    } catch (e) {
      toast.error("Erro ao carregar notas pendentes.");
    } finally {
      setLoading(false);
    }
  };

  const iniciarConferencia = async (compra: any) => {
    setCompraAtiva(compra);
    try {
      const res = await api.get(`/compras/${compra.uuid}`);
      // Prepara os itens para conferência
      const itensMapeados = res.data.mscompra_item.map((item: any) => ({
        ...item,
        quantidade_conferida: 0,
        lote_conferido: "",
        validade_conferida: "",
        cEAN: item.msproduto.codigo_barras || "",
        precisaEAN: item.msproduto.ativo === 'P' || item.msproduto.ativo === 'R', // Produto pendente/revisão precisa do EAN se não tiver
        divergencia: false
      }));
      setItensConferencia(itensMapeados);
      setDialogOpen(true);
    } catch (e) {
      toast.error("Erro ao carregar detalhes da compra.");
    }
  };

  const handleItemChange = (codproduto: number, field: string, value: any) => {
    setItensConferencia(prev => prev.map(item => {
      if (item.codproduto === codproduto) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const prepararConferencia = () => {
    // Validar EAN obrigatório
    const pendencias = itensConferencia.filter(i => i.precisaEAN && (!i.cEAN || i.cEAN.trim() === ""));
    if (pendencias.length > 0) {
      toast.error("Preencha o código de barras (EAN) de todos os produtos pendentes!");
      return;
    }

    // Verificar divergências
    const divergentes = itensConferencia.filter(i => Number(i.quantidade_conferida) !== Number(i.quantidade));
    if (divergentes.length > 0) {
      setItensDivergentes(divergentes);
      setDivergenciaDialogOpen(true);
      return;
    }

    // Se não tiver divergência, finaliza direto
    finalizarConferencia();
  };

  const finalizarConferencia = async () => {
    setIsSubmitting(true);
    setDivergenciaDialogOpen(false);
    try {
      const payload = {
        codfilial: parseInt(filialSelecionada === "todas" ? "1" : filialSelecionada),
        itens: itensConferencia.map(i => ({
          codproduto: i.codproduto,
          quantidade: Number(i.quantidade_conferida),
          lote: i.lote_conferido || null,
          validade: i.validade_conferida || null,
          cEAN: i.precisaEAN ? i.cEAN : undefined,
          custo_unitario: i.custo_unitario
        }))
      };

      const res = await api.post(`/compras/${compraAtiva.uuid}/finalizar-conferencia`, payload);
      toast.success(res.data.message);
      
      setDialogOpen(false);
      carregarCompras();
    } catch (e: any) {
      toast.error(e.response?.data?.error || "Erro ao finalizar conferência.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const comprasFiltradas = compras.filter(c => 
    c.codigo_compra?.toLowerCase().includes(search.toLowerCase()) ||
    c.msfornecedor?.nome?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl md:text-3xl font-semibold text-primary">Conferência (Bônus)</h2>
          <p className="text-sm text-muted-foreground mt-1">Notas fiscais aguardando conferência cega</p>
        </div>
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
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Carregando...</div>
        ) : comprasFiltradas.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center">
            <CheckCircle2 className="h-12 w-12 text-green-500/50 mb-3" />
            <p className="text-lg font-semibold">Tudo certo por aqui!</p>
            <p className="text-sm">Nenhuma nota aguardando conferência no momento.</p>
          </div>
        ) : (
          <div className="divide-y">
            {comprasFiltradas.map(compra => (
              <div key={compra.uuid} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                <div>
                  <h4 className="font-semibold text-foreground">NF {compra.numero_documento || compra.codigo_compra}</h4>
                  <p className="text-sm text-muted-foreground">{compra.msfornecedor?.nome}</p>
                  <p className="text-xs text-muted-foreground mt-1">Data: {new Date(compra.data_compra).toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="text-orange-600 border-orange-600 bg-orange-50">
                    Aguardando Conferência
                  </Badge>
                  <Button onClick={() => iniciarConferencia(compra)}>
                    Conferir <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Conferência Cega</DialogTitle>
            <DialogDescription>
              Nota: {compraAtiva?.numero_documento} • Fornecedor: {compraAtiva?.msfornecedor?.nome}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-6">
            <div className="bg-orange-50 text-orange-800 p-4 rounded-md border border-orange-200 flex items-start gap-3 text-sm">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <p>
                <strong>Atenção:</strong> Você está no modo de conferência cega. As quantidades originais da NF não são exibidas. Preencha a quantidade contada fisicamente. 
              </p>
            </div>

            <div className="space-y-4">
              {itensConferencia.map((item) => (
                <div key={item.codproduto} className="border p-4 rounded-lg bg-card space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold">{item.msproduto.descricao}</h4>
                      <p className="text-sm text-muted-foreground">Custo: R$ {Number(item.custo_unitario).toFixed(2)}</p>
                    </div>
                  </div>

                  {item.precisaEAN && (
                    <div className="bg-red-50 text-red-800 p-3 rounded border border-red-200 text-sm">
                      <p className="font-semibold mb-2">⚠ Este produto foi pré-cadastrado sem Código de Barras (EAN)!</p>
                      <Label>Por favor, bipe ou digite o código de barras da embalagem:</Label>
                      <Input 
                        value={item.cEAN}
                        onChange={e => handleItemChange(item.codproduto, 'cEAN', e.target.value)}
                        placeholder="Ex: 7891234567890"
                        className="mt-1 bg-white"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Quantidade Física *</Label>
                      <Input 
                        type="number"
                        min="0"
                        value={item.quantidade_conferida || ''}
                        onChange={e => handleItemChange(item.codproduto, 'quantidade_conferida', e.target.value)}
                        placeholder="Ex: 12"
                      />
                    </div>
                    <div>
                      <Label>Lote (Opcional)</Label>
                      <Input 
                        type="text"
                        value={item.lote_conferido || ''}
                        onChange={e => handleItemChange(item.codproduto, 'lote_conferido', e.target.value)}
                        placeholder="Ex: L12345"
                      />
                    </div>
                    <div>
                      <Label>Validade (Opcional)</Label>
                      <Input 
                        type="date"
                        value={item.validade_conferida || ''}
                        onChange={e => handleItemChange(item.codproduto, 'validade_conferida', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSubmitting}>Cancelar</Button>
            <Button onClick={prepararConferencia} disabled={isSubmitting}>
              {isSubmitting ? "Processando..." : "Concluir Conferência"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Alerta de Divergência */}
      <Dialog open={divergenciaDialogOpen} onOpenChange={setDivergenciaDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <ClipboardList className="w-5 h-5" />
              Divergência Encontrada!
            </DialogTitle>
            <DialogDescription>
              A quantidade conferida não bate com a quantidade da nota para alguns itens.
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-[300px] overflow-y-auto space-y-3 my-4">
            {itensDivergentes.map(item => (
              <div key={item.codproduto} className="p-3 bg-destructive/5 border border-destructive/20 rounded-md">
                <p className="font-medium text-sm">{item.msproduto.descricao}</p>
                <div className="flex justify-between mt-2 text-sm">
                  <span className="text-muted-foreground">No XML: {item.quantidade}</span>
                  <span className="text-destructive font-bold">Conferido: {item.quantidade_conferida || 0}</span>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setDivergenciaDialogOpen(false)} className="flex-1">
              Voltar e Recontar
            </Button>
            <Button variant="destructive" onClick={finalizarConferencia} disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "Salvando..." : "Forçar Quantidade"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Conference;
