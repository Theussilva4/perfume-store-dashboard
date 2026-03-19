

## Fase 1: Compras + Precificação Profissional

Considerando sua tabela real `msproduto` com `codigo_barras`, `volume_ml`, `preco_normal` e `preco_promocao`.

---

### 1. Atualizar modelo de dados

**`src/types.ts`** — Adicionar campos ao `Produto`:
- `codigoBarras?: string` (mapeado de `codigo_barras`)
- `volume?: string` (mapeado de `volume_ml`)
- `margem?: number` (% configurável)
- `precoPromocional?: number` (mapeado de `preco_promocao`)

**`src/data/mockData.ts`** — Novos tipos e dados:

Nova interface `Compra`:
```
id, produtoId, nomeProduto, categoria, marca,
codigoBarras, volume, fornecedor, notaFiscal,
dataCompra, quantidade, custoUnitario, custoTotal,
desconto, frete, outrosCustos, custoRealUnitario,
filial, observacoes
```

Fórmula do custo real:
```
custoRealUnitario = (custoTotal + frete + outrosCustos - desconto) / quantidade
```

Adicionar `margemPadrao?: number` na interface `Categoria` (ex: importados = 80%, nacionais = 50%).

Incluir 3-4 compras mock com NF, frete, descontos.

---

### 2. Refatorar StockEntry.tsx → Tela de Compras

Título: **"Compras"** com subtítulo "Controle de compras e custo real".

**Formulário completo (dialog expandido `max-w-2xl`):**

| Seção | Campos |
|-------|--------|
| Produto | Select com busca → auto-preenche categoria, marca, código barras, volume |
| Nota Fiscal | Fornecedor, Nº NF, Data da compra |
| Valores | Quantidade, Custo unitário, Custo total (auto), Desconto, Frete, Outros custos |
| Resultado | **Custo Real Unitário** (calculado em tempo real, destaque visual) |
| Sugestão | **Preço sugerido** = custoReal × (1 + margem da categoria), editável |
| Destino | Filial, Observações |

**Tabela de compras** com colunas: Data, NF, Produto, Qtd, Custo Unit., Frete, Desc., Custo Real, Fornecedor.

---

### 3. Precificação no cadastro de produto (Products.tsx)

Adicionar ao dialog de produto:
- Código de barras
- Volume (ml)
- Margem (%) — pré-preenchida pela margem da categoria selecionada
- Preço promocional
- **Exibição calculada**: Markup = precoVenda / precoCusto, Lucro = precoVenda - precoCusto

No card do produto, mostrar: margem %, markup e lucro por unidade.

Atualizar `mapearProduto()` para incluir `codigo_barras` e `volume_ml` da API.

---

### 4. Margem por categoria (Categories.tsx)

Adicionar campo "Margem Padrão (%)" no dialog de criação/edição de categoria. Valor usado como sugestão automática ao cadastrar produtos e registrar compras.

---

### 5. Navegação (AppLayout.tsx)

Renomear "Entradas" → "Compras" na sidebar (seção Estoque).

---

### Arquivos a editar

| Arquivo | Ação |
|---------|------|
| `src/types.ts` | Adicionar campos novos ao Produto |
| `src/data/mockData.ts` | Interface Compra, margemPadrao em Categoria, dados mock |
| `src/pages/StockEntry.tsx` | Refatorar → tela de compras completa com cálculo custo real |
| `src/pages/Products.tsx` | Campos de precificação + exibição margem/markup nos cards |
| `src/pages/Categories.tsx` | Campo margem padrão |
| `src/components/AppLayout.tsx` | Renomear "Entradas" → "Compras" |
| `src/services/produtosService.js` | Preparar envio de `codigo_barras`, `volume_ml` no create/update |

