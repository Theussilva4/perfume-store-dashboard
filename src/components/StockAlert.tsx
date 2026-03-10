const lowStock = [
  { name: "Santal 33", estoque: 3 },
  { name: "Oud Wood Tom Ford", estoque: 2 },
  { name: "Flowerbomb Viktor&Rolf", estoque: 5 },
  { name: "Noir de Noir", estoque: 1 },
];

const StockAlert = () => {
  return (
    <div className="bg-card rounded-sm p-6 animate-fade-in-up animate-delay-4">
      <h3 className="text-xs text-muted-foreground font-body uppercase tracking-widest mb-5">
        Estoque Baixo
      </h3>
      <div className="flex flex-col gap-3">
        {lowStock.map((item) => (
          <div key={item.name} className="flex items-center justify-between">
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
