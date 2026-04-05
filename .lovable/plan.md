

# Quadrantes com Inserção Manual de Produtos

## Problema
Atualmente os 4 quadrantes são preenchidos automaticamente com base em vendas e lucratividade. O usuário quer inserir manualmente os produtos em cada quadrante.

## Solução

### 1. `src/types/index.ts` — Novo tipo para quadrantes manuais
Adicionar ao `AppState`:
```typescript
quadrantesOfertas: {
  maisVendidos: string[];    // array de produtoIds
  menosVendidos: string[];
  maisLucrativos: string[];
  menosLucrativos: string[];
}
```

### 2. `src/contexts/AppContext.tsx`
- Adicionar `quadrantesOfertas` ao estado inicial (4 arrays vazios)
- Nova action `SET_QUADRANTES_OFERTAS` para persistir os IDs selecionados
- Merge defensivo no `loadState`

### 3. `src/pages/Ofertas.tsx` — Refatorar quadrantes
- Remover a lógica automática de ordenação/slice dos 20% (`maisVendidos`, `menosVendidos`, etc.)
- Cada quadrante passa a ter um **dropdown de seleção de produto** com botão "Adicionar" e botão de remover por item
- Os produtos selecionados ficam salvos no estado global e persistem ao navegar
- Os cálculos derivados (cruzamentos, média de lucro, sugestões) continuam funcionando normalmente, usando os produtos dos quadrantes manuais em vez dos automáticos
- Manter os campos calculados (PV, CMV, Lucro R$, Lucro %) — esses continuam sendo puxados automaticamente dos dados do produto
- O filtro de período continua existindo para calcular a quantidade vendida de cada produto no período

### Fluxo do usuário
1. Seleciona um produto no dropdown do quadrante desejado
2. Clica "Adicionar" — o produto aparece na tabela do quadrante
3. Pode remover com botão de lixeira
4. Os cruzamentos e ofertas se atualizam automaticamente com base nos quadrantes preenchidos

### Arquivos afetados
- `src/types/index.ts`
- `src/contexts/AppContext.tsx`
- `src/pages/Ofertas.tsx`

