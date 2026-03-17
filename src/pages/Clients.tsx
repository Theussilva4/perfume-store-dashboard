import { useState } from "react";
import { clientes } from "@/data/mockData";
import { Input } from "@/components/ui/input";
import { Search, Users } from "lucide-react";

const Clients = () => {
  const [search, setSearch] = useState("");

  const filtrados = clientes.filter((c) =>
    c.nome.toLowerCase().includes(search.toLowerCase()) || c.telefone.includes(search)
  );

  const ordenados = [...filtrados].sort((a, b) => b.totalGasto - a.totalGasto);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h2 className="font-display text-2xl md:text-3xl font-semibold text-primary">Clientes</h2>
        <p className="text-sm text-muted-foreground mt-1">{clientes.length} clientes registrados</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome ou telefone..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ordenados.map((cliente) => (
          <div key={cliente.id} className="bg-card rounded-lg border border-border p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-primary">{cliente.nome.charAt(0)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm text-foreground truncate">{cliente.nome}</h3>
              <p className="text-xs text-muted-foreground">{cliente.telefone}</p>
              <div className="flex gap-4 mt-3">
                <div>
                  <p className="text-lg font-semibold text-foreground">{cliente.quantidadePedidos}</p>
                  <p className="text-[10px] text-muted-foreground">pedidos</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-primary">R$ {cliente.totalGasto.toLocaleString("pt-BR")}</p>
                  <p className="text-[10px] text-muted-foreground">total comprado</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtrados.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum cliente encontrado.</p>
        </div>
      )}
    </div>
  );
};

export default Clients;
