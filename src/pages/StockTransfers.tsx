import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRightLeft, Search, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useBranch } from "@/contexts/BranchContext";
import api from "@/services/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function StockTransfers() {
  const { filialSelecionada, filiais } = useBranch();
  const { toast } = useToast();

  const [origem, setOrigem] = useState("2"); // Default to Casa
  const [destino, setDestino] = useState("1"); // Default to Loja

  const [searchTerm, setSearchTerm] = useState("");
  const [produtos, setProdutos] = useState<any[]>([]);
  const [transferList, setTransferList] = useState<any[]>([]);

  // Pesquisa de produto
  const handleSearch = async () => {
    if (searchTerm.length < 3) return;
    try {
      const response = await api.get(`/produtos/busca?q=${searchTerm}`);
      setProdutos(response.data);
    } catch (error) {
      console.error(error);
      toast({ title: "Erro na busca", variant: "destructive" });
    }
  };

  const handleAddToTransfer = async (produto: any) => {
    const exists = transferList.find((item) => item.codproduto === produto.codproduto);
    if (exists) {
      setTransferList(
        transferList.map((item) =>
          item.codproduto === produto.codproduto
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        )
      );
    } else {
      try {
        const response = await api.get(`/estoque/lotes/${produto.codproduto}?codfilial=${origem}`);
        const lotes = response.data;
        setTransferList([...transferList, { ...produto, quantidade: 1, lotesDisponiveis: lotes }]);
      } catch (error) {
        console.error(error);
        toast({ title: "Erro ao buscar lotes", variant: "destructive" });
        setTransferList([...transferList, { ...produto, quantidade: 1, lotesDisponiveis: [] }]);
      }
    }
    setSearchTerm("");
    setProdutos([]);
  };

  const updateQuantity = (codproduto: number, quantidade: number) => {
    if (quantidade <= 0) return;
    setTransferList(
      transferList.map((item) =>
        item.codproduto === codproduto ? { ...item, quantidade } : item
      )
    );
  };

  const removeProduto = (codproduto: number) => {
    setTransferList(transferList.filter((item) => item.codproduto !== codproduto));
  };

  const handleConfirmarTransferencias = async () => {
    if (transferList.length === 0) {
      toast({ title: "Adicione produtos para transferir", variant: "destructive" });
      return;
    }

    if (origem === destino) {
      toast({ title: "Origem e destino devem ser diferentes", variant: "destructive" });
      return;
    }

    try {
      for (const item of transferList) {
        await api.post("/estoque/transferencias", {
          codproduto: item.codproduto,
          filialOrigem: origem,
          filialDestino: destino,
          quantidade: item.quantidade
        });
      }

      toast({ title: "Transferência(s) realizada(s) com sucesso!" });
      setTransferList([]);
    } catch (error: any) {
      console.error(error);
      toast({ 
        title: "Erro ao transferir", 
        description: error.response?.data?.erro || "Erro inesperado",
        variant: "destructive" 
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">Transferência de Estoque</h2>
        <p className="text-muted-foreground">
          Transfira produtos entre Casa e Loja (utiliza método FIFO).
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Configurar Fluxo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Filial de Origem (Saída)</Label>
                <Select value={origem} onValueChange={(val) => { setOrigem(val); setTransferList([]); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a origem" />
                  </SelectTrigger>
                  <SelectContent>
                    {filiais.map(f => (
                      <SelectItem key={f.id} value={f.id.toString()}>{f.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Filial de Destino (Entrada)</Label>
                <Select value={destino} onValueChange={setDestino}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o destino" />
                  </SelectTrigger>
                  <SelectContent>
                    {filiais.map(f => (
                      <SelectItem key={f.id} value={f.id.toString()}>{f.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Adicionar Produtos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input 
                placeholder="Busque por código, nome..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch}><Search className="w-4 h-4" /></Button>
            </div>

            {produtos.length > 0 && (
              <div className="border rounded-md max-h-[200px] overflow-y-auto mt-2">
                {produtos.map(p => (
                  <div key={p.codproduto} className="p-2 border-b flex justify-between items-center hover:bg-muted">
                    <div>
                      <p className="font-medium text-sm">{p.descricao}</p>
                      <p className="text-xs text-muted-foreground">Código: {p.codproduto}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleAddToTransfer(p)}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Itens a Transferir</CardTitle>
        </CardHeader>
        <CardContent>
          {transferList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-md">
              Nenhum produto selecionado para transferência.
            </div>
          ) : (
            <div className="space-y-4">
              {transferList.map((item) => (
                <div key={item.codproduto} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex-1">
                    <p className="font-medium">{item.descricao}</p>
                    <p className="text-sm text-muted-foreground mb-1">Cód: {item.codproduto}</p>
                    {item.lotesDisponiveis && item.lotesDisponiveis.length > 0 ? (
                      <div className="text-xs text-muted-foreground bg-muted p-2 rounded-md max-w-sm mt-1">
                        <p className="font-medium text-foreground mb-1">Disponível na Origem (Ordem FEFO):</p>
                        {item.lotesDisponiveis.map((l: any) => (
                          <div key={l.id} className="flex justify-between">
                            <span>Lote: {l.lote === "SEM_LOTE" ? "Sem Lote" : l.lote}</span>
                            <span>
                              {l.validade ? new Date(l.validade).toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' }) : "-"}
                            </span>
                            <span className="font-medium text-primary">{l.quantidade} un</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-destructive">Sem lotes disponíveis na origem</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label>Qtd:</Label>
                      <Input 
                        type="number" 
                        min="1" 
                        value={item.quantidade} 
                        onChange={(e) => updateQuantity(item.codproduto, Number(e.target.value))}
                        className="w-20"
                      />
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeProduto(item.codproduto)} className="text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <div className="flex justify-end pt-4">
                <Button onClick={handleConfirmarTransferencias} className="w-full md:w-auto">
                  <ArrowRightLeft className="w-4 h-4 mr-2" />
                  Confirmar Transferência de {transferList.length} item(s)
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
