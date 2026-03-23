

## Integrar Categorias com API + Criar cadastro de Marcas

### Resumo

Conectar a tela de Categorias à API real (tabela `mscategoria` com campos `codcategoria`, `categoria`, `margem_padrao`) e criar uma nova tela de Marcas (tabela `msmarca` com campos `codmarca`, `marca`), seguindo o mesmo padrão visual das Categorias.

---

### 1. Atualizar tipos (`src/types.ts`)

- Ajustar interface `categoria` para usar `margem_padrao` (snake_case do banco)
- Criar interface `Marca`: `codmarca: number`, `marca: string`

### 2. Criar service de marcas (`src/services/marcaService.js`)

- `getMarcas()` → `GET /marcas`
- `createMarca(dados)` → `POST /marcas`
- `updateMarca(id, dados)` → `PATCH /marcas/{id}`
- `deleteMarca(id)` → `DELETE /marcas/{id}`

### 3. Atualizar service de categorias (`src/services/categoriaService.js`)

- Adicionar `deleteCategoria(id)` → `DELETE /categorias/{id}`
- Remover linha solta no final do arquivo (`getCategorias,updateCategoria,createCategoria`)

### 4. Refatorar `Categories.tsx` para usar API real

- Trocar mock data por chamadas a `getCategorias`, `createCategoria`, `updateCategoria`, `deleteCategoria`
- Mapear campos do banco: `codcategoria` como ID, `categoria` como nome, `margem_padrao` como margem
- Adicionar loading state e tratamento de erro com `Array.isArray`

### 5. Criar página `Brands.tsx` (`src/pages/Brands.tsx`)

- Layout idêntico ao de Categorias (grid de cards com ícone, nome, botões editar/remover)
- Dialog para criar/editar marca (campo único: nome da marca)
- Chamadas à API via `marcaService`
- Ícone: `Tag` do lucide-react

### 6. Adicionar rota e navegação

- **`src/App.tsx`**: nova rota `/marcas` → `<Brands />`
- **`src/components/AppLayout.tsx`**: adicionar "Marcas" na seção "Catálogo" com ícone `Tag`

### Arquivos

| Arquivo | Ação |
|---------|------|
| `src/types.ts` | Adicionar interface `Marca` |
| `src/services/marcaService.js` | Criar (CRUD completo) |
| `src/services/categoriaService.js` | Adicionar delete, limpar linha solta |
| `src/pages/Categories.tsx` | Refatorar para API real |
| `src/pages/Brands.tsx` | Criar página de marcas |
| `src/App.tsx` | Adicionar rota `/marcas` |
| `src/components/AppLayout.tsx` | Adicionar "Marcas" no menu Catálogo |

