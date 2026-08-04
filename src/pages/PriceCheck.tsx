import { useState, useEffect, useRef } from "react";
import { Search, Camera, Package, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getProdutos } from "@/services/produtosService";
import { getEstoque } from "@/services/estoqueService";
import { BarcodeScannerModal } from "@/components/BarcodeScannerModal";
import { toast } from "sonner";
import { useBranch } from "@/contexts/BranchContext";

const PriceCheck = () => {
  const [search, setSearch] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [produtosAPI, setProdutosAPI] = useState<any[]>([]);
  const [estoquesAPI, setEstoquesAPI] = useState<any[]>([]);
  const { rotuloFilial, filialSelecionada } = useBranch();
  
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    carregarDados();
    // Auto-focus no input de busca para facilitar o uso do leitor de código de barras USB
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  async function carregarDados() {
    setLoading(true);
    try {
      const [prod, est] = await Promise.all([getProdutos(), getEstoque()]);
      setProdutosAPI(Array.isArray(prod) ? prod : []);
      setEstoquesAPI(Array.isArray(est) ? est : []);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar banco de produtos");
    } finally {
      setLoading(false);
    }
  }

  const obterEstoque = (codproduto: number) => {
    const estoquesDoProduto = estoquesAPI.filter(e => e.codproduto === codproduto);
    if (filialSelecionada === "todas") {
      return estoquesDoProduto.reduce((acc, curr) => acc + curr.quantidade, 0);
    }
    const estoqueFilial = estoquesDoProduto.find(e => String(e.codfilial) === String(filialSelecionada));
    return estoqueFilial ? estoqueFilial.quantidade : 0;
  };

  const resultados = search.length > 2 || /^\d+$/.test(search) ? produtosAPI.filter(p => {
    const termo = search.toLowerCase();
    const matchCod = String(p.codproduto) === termo;
    const matchCodBarras = p.codigo_barras && String(p.codigo_barras).toLowerCase().includes(termo);
    const matchDesc = p.descricao && p.descricao.toLowerCase().includes(termo);
    const matchRef = p.referencia && p.referencia.toLowerCase().includes(termo);
    return matchCod || matchCodBarras || matchDesc || matchRef;
  }) : [];

  const handleScan = (decodedText: string) => {
    setSearch(decodedText);
    toast.success("Código lido: " + decodedText);
  };

  return (
    <div className="space-y-6 animate-fade-in-up max-w-4xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-primary">Consulta de Preço</h2>
        <p className="text-muted-foreground">{rotuloFilial}</p>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 md:p-8 shadow-sm">
        <div className="flex gap-3 max-w-2xl mx-auto relative">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder="Digite o nome, código ou leia o código de barras..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 h-14 text-lg md:text-xl rounded-xl shadow-inner focus-visible:ring-primary"
            />
          </div>
          <Button 
            onClick={() => setScannerOpen(true)} 
            className="h-14 w-14 rounded-xl flex-shrink-0"
            variant="default"
          >
            <Camera className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando catálogo...</div>
      ) : search.length > 0 && resultados.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground bg-card border border-border rounded-xl">
          Nenhum produto encontrado para "{search}"
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {resultados.map((p) => {
            const estoque = obterEstoque(p.codproduto);
            const preco = Number(p.preco_normal || p.custo || 0);
            
            return (
              <div key={p.codproduto} className="bg-card rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-primary"></div>
                
                <div className="flex justify-between items-start mb-4 gap-4">
                  <div className="flex gap-4 w-full">
                    <div className="w-20 h-20 rounded-md bg-white overflow-hidden flex-shrink-0 flex items-center justify-center border border-border shadow-sm">
                      {p.imagem_url ? (
                        <img 
                          src={p.imagem_url.replace('/upload/', '/upload/w_200,h_200,c_fit/')} 
                          alt={p.descricao}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <Package className="h-8 w-8 text-muted-foreground/50" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-xl text-foreground mb-2 leading-tight">{p.descricao}</h3>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span className="bg-muted px-2 py-1 rounded font-medium">Cód: {p.codproduto}</span>
                        {p.codigo_barras && <span className="bg-muted px-2 py-1 rounded font-medium">EAN: {p.codigo_barras}</span>}
                        {p.marca && <span className="bg-muted px-2 py-1 rounded font-medium">{p.marca}</span>}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mt-6 pt-4 border-t border-border gap-4">
                  <div className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto">
                    <div>
                      <span className="text-sm text-muted-foreground block mb-1">💵 À Vista (Pix/Dinheiro)</span>
                      <span className="font-display font-bold text-3xl md:text-4xl text-primary">
                        R$ {preco.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    {p.preco_cartao > 0 && (
                      <div>
                        <span className="text-sm text-muted-foreground block mb-1">💳 Cartão de Crédito</span>
                        <span className="font-display font-bold text-3xl md:text-4xl text-blue-600">
                          R$ {Number(p.preco_cartao).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-left sm:text-right flex flex-col items-start sm:items-end w-full sm:w-auto">
                    <span className="text-xs text-muted-foreground block mb-1">Disponibilidade</span>
                    {estoque > 0 ? (
                      <div className="flex items-center gap-1.5 text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="font-bold">{estoque} em estoque</span>
                      </div>
                    ) : estoque < 0 ? (
                      <div className="flex items-center gap-1.5 text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="font-bold">Negativo ({estoque})</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="font-bold">Sem Estoque</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <BarcodeScannerModal 
        open={scannerOpen} 
        onOpenChange={setScannerOpen} 
        onScan={handleScan} 
      />
    </div>
  );
};

export default PriceCheck;
