

## Traduzir variáveis para português

Renomear todas as propriedades das interfaces e variáveis de inglês para português nos arquivos de dados, contextos e em todos os componentes/páginas que os referenciam.

### Mapeamento de renomeação

**Interface `Produto` (era `Product`):**
- `name` → `nome`, `category` → `categoria`, `description` → `descricao`, `brand` → `marca`
- `costPrice` → `precoCusto`, `salePrice` → `precoVenda`, `stock` → `estoque`
- `branchStock` → `estoquePorFilial`, `minStock` → `estoqueMinimo`, `image` → `imagem`, `active` → `ativo`

**Interface `EstoqueFilial` (era `BranchStock`):**
- sem mudança nas chaves `matriz` / `filial1` (já em pt)

**Interface `Categoria` (era `Category`):**
- `name` → `nome`, `productCount` → `quantidadeProdutos`

**Interface `ItemPedido` (era `OrderItem`):**
- `productId` → `produtoId`, `productName` → `nomeProduto`, `quantity` → `quantidade`, `price` → `preco`

**Interface `Pedido` (era `Order`):**
- `number` → `numero`, `clientName` → `nomeCliente`, `clientPhone` → `telefoneCliente`, `clientAddress` → `enderecoCliente`
- `items` → `itens`, `paymentMethod` → `formaPagamento`, `status` (já ok), `date` → `data`, `notes` → `observacoes`, `branch` → `filial`

**Interface `Cliente` (era `Client`):**
- `name` → `nome`, `phone` → `telefone`, `orderCount` → `quantidadePedidos`, `totalSpent` → `totalGasto`

**Interface `MovimentacaoEstoque` (era `StockMovement`):**
- `productId` → `produtoId`, `productName` → `nomeProduto`, `type` → `tipo`, `quantity` → `quantidade`
- `reason` → `motivo`, `supplier` → `fornecedor`, `cost` → `custo`, `date` → `data`, `notes` → `observacoes`, `branch` → `filial`

**Contextos:**
- `AuthContext`: `User` → `Usuario` (`name` → `nome`, `email` (mantém), `role` → `cargo`), `login`/`logout`/`isAuthenticated` → `entrar`/`sair`/`estaAutenticado`
- `BranchContext`: `Branch` → `Filial` (`name` → `nome`, `label` → `rotulo`), `selectedBranch` → `filialSelecionada`, `branchLabel` → `rotuloFilial`

**Variáveis exportadas:**
- `categories` → `categorias`, `products` → `produtos`, `orders` → `pedidos`, `clients` → `clientes`
- `stockMovements` → `movimentacoesEstoque`, `paymentMethodLabels` → `rotulosFormaPagamento`
- `statusLabels` → `rotulosStatus`, `statusColors` → `coresStatus`, `branchLabels` → `rotulosFilial`
- `getProductStock` → `obterEstoqueProduto`

### Arquivos a editar

1. `src/data/mockData.ts` — interfaces e dados
2. `src/contexts/AuthContext.tsx` — interface e hooks
3. `src/contexts/BranchContext.tsx` — interface e hooks
4. Todas as páginas que importam dessas fontes: `Dashboard.tsx`, `Products.tsx`, `Orders.tsx`, `OrderDetail.tsx`, `Stock.tsx`, `StockEntry.tsx`, `StockExit.tsx`, `Categories.tsx`, `Clients.tsx`, `Reports.tsx`, `Alerts.tsx`, `SettingsPage.tsx`
5. Componentes: `AppLayout.tsx`, `KpiCard.tsx`, `StockAlert.tsx`, `RecentOrders.tsx`, `TopProducts.tsx`

Todas as referências serão atualizadas consistentemente em todo o projeto.

