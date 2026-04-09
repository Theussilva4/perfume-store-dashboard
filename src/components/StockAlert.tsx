const StockAlert = ({ produtos = [] }: { produtos?: any[] }) => {
  const lowStock = (produtos || []).slice(0, 7).map(item => ({
     name: item.descricao || item.nomeProduto || `Produto ${item.codproduto}`,
     estoque: Number(item.estoque || item.quantidade || 0)
  }));

  return (
    <div className="bg-card rounded-sm p-6 animate-fade-in-up animate-delay-4">
      <h3 className="text-xs text-muted-foreground font-body uppercase tracking-widest mb-5">
        Estoque Baixo
      </h3>
      <div className="flex flex-col gap-3">
        {lowStock.length === 0 ? (
           <span className="text-sm text-muted-foreground">Estoque regularizado.</span>
        ) : lowStock.map((item, idx) => (
          <div key={item.name || idx} className="flex items-center justify-between">
            <span className="text-sm text-foreground font-body">{item.name}</span>
            <span className={`text-xs font-body font-medium ${
              item.estoque <= 2 ? "text-destructive" : "text-primary"
            }`}>
              {item.estoque} un.
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StockAlert;
