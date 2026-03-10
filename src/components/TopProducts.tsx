const products = [
  { name: "Baccarat Rouge 540", vendidos: 47, receita: "R$ 23.500" },
  { name: "Bleu de Chanel", vendidos: 38, receita: "R$ 15.200" },
  { name: "Santal 33", vendidos: 31, receita: "R$ 18.600" },
  { name: "Aventus Creed", vendidos: 28, receita: "R$ 22.400" },
  { name: "Light Blue D&G", vendidos: 24, receita: "R$ 7.200" },
];

const TopProducts = () => {
  const maxSold = Math.max(...products.map((p) => p.vendidos));

  return (
    <div className="bg-card rounded-sm p-6 animate-fade-in-up animate-delay-5">
      <h3 className="text-xs text-muted-foreground font-body uppercase tracking-widest mb-5">
        Mais Vendidos
      </h3>
      <div className="flex flex-col gap-4">
        {products.map((product, i) => (
          <div key={product.name} className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground font-body font-medium">
                {product.name}
              </span>
              <span className="text-xs text-muted-foreground font-body">
                {product.vendidos} un.
              </span>
            </div>
            <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${(product.vendidos / maxSold) * 100}%`,
                  animationDelay: `${0.6 + i * 0.1}s`,
                }}
              />
            </div>
            <span className="text-xs text-muted-foreground font-body">
              {product.receita}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopProducts;
