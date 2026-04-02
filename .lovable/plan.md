

# Módulo: Itens Manipulados (Receitas) + Fix de erro

## Bug atual (fix silencioso)

`state.itensCardapio` é `undefined` ao carregar do localStorage (dados antigos sem esse campo). A `loadState()` precisa garantir defaults para campos novos. Mesmo problema afetará o novo `itensManipulados`.

**Fix em `AppContext.tsx`**: Na função `loadState`, após o parse, fazer merge com `initialState` para garantir campos faltantes:
```typescript
if (saved) {
  const parsed = JSON.parse(saved);
  return recompute({ ...initialState, ...parsed });
}
```

## Novo módulo: Itens Manipulados (Receitas)

### 1. `src/types/index.ts`

Adicionar novo tipo e campo ao AppState:
```typescript
export interface ItemManipulado {
  id: string;
  nome: string;
}
```
Adicionar `itensManipulados: ItemManipulado[]` ao `AppState`.

### 2. `src/contexts/AppContext.tsx`

- Adicionar `itensManipulados: []` ao `initialState`
- Adicionar action `SET_ITENS_MANIPULADOS` ao tipo `Action`
- Adicionar case no reducer: `return { ...state, itensManipulados: action.payload }`
- Fix do `loadState` com merge (resolve bug atual + futuro)

### 3. `src/pages/ItensManipulados.tsx` (novo)

Estrutura idêntica ao `ItensCardapio.tsx`, com ajustes:
- Título: "Itens Manipulados (Receitas)"
- Subtítulo: "Cadastre todas as receitas base, preparos intermediários e pré-produções"
- Card KPI: "Total Receitas Cadastradas"
- Tabela: colunas "Item" (sequencial) e "Nome da Receita"
- Placeholder campo: "Ex: Massa salgada, Molho de tomate, Maionese da casa..."
- CRUD completo com validação de duplicidade
- Zebra-striping nas linhas

### 4. `src/App.tsx`

Adicionar rota `/itens-manipulados` → `<ItensManipulados />`

### 5. `src/components/AppSidebar.tsx`

Adicionar "Itens Manipulados" com ícone `ChefHat`, posicionado após "Itens do Cardápio".

## Arquivos afetados
- `src/types/index.ts` — novo tipo + AppState
- `src/contexts/AppContext.tsx` — novo estado + fix loadState
- `src/pages/ItensManipulados.tsx` — nova página
- `src/App.tsx` — nova rota
- `src/components/AppSidebar.tsx` — novo item menu

