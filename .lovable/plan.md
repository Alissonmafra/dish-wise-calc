

# Refatorar DNA da Empresa

## Problemas atuais
1. `mediaCartao` é um campo manual — deveria ser auto-calculado: `(taxaDebito + taxaCredito) / 2`
2. `dnaTotal` soma taxaDebito + taxaCredito + mediaCartao (tripla contagem) — deveria usar apenas `mediaCartao`
3. A UI mostra `mediaCartao` como campo editável — deveria ser read-only
4. Falta o label "Percentual Total Taxas (%)" e bloco IMPORTANTE

## Alterações

### 1. `src/contexts/AppContext.tsx`

**recompute()** — após calcular `custoFixoPercent`, também calcular `mediaCartao`:
```typescript
const mediaCartao = (state.dnaEmpresa.taxaDebito + state.dnaEmpresa.taxaCredito) / 2;
dnaEmpresa: { ...state.dnaEmpresa, custoFixoPercent, mediaCartao }
```

**dnaTotal** (linha 240) — corrigir para não duplicar taxas de cartão:
```typescript
const dnaTotal = dna.custoFixoPercent + dna.mediaCartao + dna.impostos + dna.royalties + dna.marketing + dna.voucher;
```

### 2. `src/pages/Financeiro.tsx` — Aba DNA

Reorganizar a UI para mostrar:

- **Custo Fixo (%)** — bloco read-only (já existe)
- **Taxa Máquina de Cartão Débito (%)** — input manual
- **Taxa Máquina de Cartão Crédito (%)** — input manual
- **Média Taxa de Cartão Débito e Crédito (%)** — bloco read-only, calculado automaticamente
- **Imposto (%)** — input manual
- **Royalties (%)** — input manual
- **Marketing (%)** — input manual
- **Voucher (%)** — input manual
- **Percentual Total Taxas (%)** — bloco destacado read-only (substituindo "DNA Total")
- Bloco IMPORTANTE amarelo: "Selecione nesta opção a Média do % de Custo Fixo ou o mês que deverá ser considerado..."

### 3. `src/types/index.ts` — sem alterações (interface já tem todos os campos)

## Arquivos afetados
- `src/contexts/AppContext.tsx` — mediaCartao auto-calculado + dnaTotal corrigido
- `src/pages/Financeiro.tsx` — aba DNA reorganizada

