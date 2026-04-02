

# Módulo: Itens do Cardápio

## Resumo

Criar uma nova tela "Itens do Cardápio" para cadastrar todos os produtos vendáveis do restaurante — uma lista mestra simples (número sequencial + nome). Será usada como referência por outros módulos futuramente.

## Alterações

### 1. `src/types/index.ts` — Novo tipo + AppState

Adicionar:
```typescript
export interface ItemCardapio {
  id: string;
  nome: string;
}
```

Adicionar `itensCardapio: ItemCardapio[]` ao `AppState`.

### 2. `src/contexts/AppContext.tsx`

- Adicionar `itensCardapio: []` ao `initialState`
- Adicionar action `SET_ITENS_CARDAPIO` ao reducer
- Incluir no `LOAD_STATE` e persistência

### 3. `src/pages/ItensCardapio.tsx` — Nova página

Conteúdo:
- **Card "Total Produtos Cadastrados"** — contagem automática
- **Barra de pesquisa** com filtro por nome
- **Botão "Adicionar Item"** — abre dialog com campo "Nome do Produto"
  - Validação: alerta se nome duplicado (case-insensitive)
- **Tabela**: colunas "Item" (número sequencial 1, 2, 3...) e "Nome do Produto"
- **Ações por linha**: editar (dialog) e excluir (confirmação)
- Linhas com zebra-striping (alternância de cor) conforme a imagem de referência

### 4. `src/App.tsx` — Nova rota

Adicionar `/itens-cardapio` → `<ItensCardapio />`

### 5. `src/components/AppSidebar.tsx` — Novo item no menu

Adicionar "Itens do Cardápio" com ícone `ClipboardList`, posicionado antes de "Fichas Técnicas".

## Arquivos afetados
- `src/types/index.ts`
- `src/contexts/AppContext.tsx`
- `src/pages/ItensCardapio.tsx` (novo)
- `src/App.tsx`
- `src/components/AppSidebar.tsx`

