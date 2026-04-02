

# Regra Oficial do DNA da Empresa

## Resumo

Reformular o cálculo do DNA da Empresa para seguir a fórmula oficial: `DNA = Custo Fixo (%) + Média Cartão (%) + Voucher (%) + Impostos (%) + Franquia (%)`. Remover `royalties` e `marketing` do DNA. Tornar `impostos` automático (alíquota efetiva do Simples). Adicionar campo `franquia` e toggle `isFranquia`. Redesenhar a aba DNA com mensagens educativas.

## Alterações

### 1. `src/types/index.ts` — Atualizar DNAEmpresa

- Remover `royalties` e `marketing` da interface
- Adicionar `franquia: number` e `isFranquia: boolean`

### 2. `src/contexts/AppContext.tsx` — Novo cálculo do DNA

No `recompute()`:
- Calcular `impostos` automaticamente usando a alíquota efetiva do Simples Nacional (via `calcularImpostoSimples`)
- Se `modoSimulacao`, usar `mediaFaturamento * 12` como RBT12; senão usar `rbt12Manual`
- Fórmula do `dnaTotal`:
  - `custoFixoPercent + mediaCartao + voucher + impostos + (isFranquia ? franquia : 0)`
- Remover `royalties` e `marketing` do cálculo

No `initialState`: ajustar defaults (remover royalties/marketing, adicionar franquia: 0, isFranquia: false)

### 3. `src/pages/Financeiro.tsx` — Redesenhar aba "DNA da Empresa"

Layout da aba:
- **Card educativo no topo**: "O DNA da empresa é o custo estrutural percentual mínimo que cada produto precisa suportar antes do lucro."
- **Campos automáticos** (read-only com destaque):
  - Custo Fixo (%) — da média 12 meses
  - Média Cartão (%) — (débito + crédito) / 2
  - Impostos (%) — alíquota efetiva do Simples
- **Campos manuais**:
  - Taxa Débito (%)
  - Taxa Crédito (%)
  - Voucher (%)
- **Toggle**: "A empresa é franquia?" (sim/não)
  - Se sim, mostrar campo Franquia (%)
- **Resultado final** com destaque:
  - DNA da Empresa (%) com breakdown visual
  - Fórmula exibida
- **Mensagem de apoio**: "Todo produto precisa conter no mínimo o DNA da empresa embutido no preço. Esse percentual cobre a estrutura do negócio antes mesmo do lucro."

### 4. Demais páginas — Limpar referências a royalties/marketing

- `src/pages/Dashboard.tsx`, `src/pages/PainelMetas.tsx`, `src/pages/Precificacao.tsx`, `src/pages/MiniDRE.tsx` — ajustar onde `dnaTotal` ou campos removidos forem usados

## Arquivos afetados

- `src/types/index.ts`
- `src/contexts/AppContext.tsx`
- `src/pages/Financeiro.tsx`
- `src/pages/Dashboard.tsx` (se referencia royalties/marketing)
- `src/pages/Precificacao.tsx` (se referencia royalties/marketing)
- `src/pages/MiniDRE.tsx` (se referencia royalties/marketing)

