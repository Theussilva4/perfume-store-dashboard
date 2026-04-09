const TopProducts = ({ pedidos = [], produtos = [] }: { pedidos?: any[], produtos?: any[] }) => {
  // Calculando dinamicamente com base em pedidos recebidos pra filial atual
  const vendasMap: Record<string, { vendidos: number, receita: number, name: string }> = {};
  
  pedidos.forEach(p => {
    (p.itens || p.mspedido_item || []).forEach((item: any) => {
      const idProd = item.codproduto ?? item.CODPRODUTO ?? item.produtoId ?? item.id_produto;
      if (!idProd) return;
      if (!vendasMap[idProd]) {
         const pDetail = produtos.find(pt => String(pt.codproduto) === String(idProd));
         vendasMap[idProd] = {
           name: pDetail?.descricao || item.nomeProduto || `Produto ID: ${idProd}`,
           vendidos: 0,
           receita: 0
         };
      }
      
      const qtd = Number(item.quantidade ?? item.QUANTIDADE ?? 1);
      const prc = Number(item.preco_unitario ?? item.PRECO_UNITARIO ?? item.preco ?? 0);
      
      vendasMap[idProd].vendidos += qtd;
      vendasMap[idProd].receita += (qtd * prc);
    });
  });

  const products = Object.values(vendasMap)
    .sort((a, b) => b.vendidos - a.vendidos)
    .slice(0, 5)
    .map(p => ({
       ...p,
       receita: `R$ ${p.receita.toLocaleString('pt-BR')}`
    }));

  const maxSold = products.length > 0 ? Math.max(...products.map((p) => p.vendidos)) : 100;

  return (
    <div className="bg-card rounded-sm p-6 animate-fade-in-up animate-delay-5">
      <h3 className="text-xs text-muted-foreground font-body uppercase tracking-widest mb-5">
        Mais Vendidos
      </h3>
      <div className="flex flex-col gap-4">
        {products.map((product, i) => (
          <div key={`${product.name}-${i}`} className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground font-body font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]" title={product.name}>
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
