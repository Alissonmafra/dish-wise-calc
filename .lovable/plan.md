

# Preço de Venda (PV)

## Resumo

Criar a página "Preço de Venda (PV)" com cálculos automáticos de preço ideal para cardápio normal, iFood e cardápio fantasma. Também corrigir o build error residual no `LucroAtual.tsx`.

## Bug fix

O arquivo `LucroAtual.tsx` atual já usa `formatBRL` (não `formatCurrency`). O erro de build é stale — será resolvido ao triggerar um rebuild com as novas alterações.

## Alterações

### 1. `src/pages/Precificacao.tsx` — Reescrever como "Preço de Venda (PV)"

Substituir o conteúdo atual pela nova tela completa.

**Tabela dinâmica** com linhas adicionáveis/editáveis/excluíveis. Cada linha contém:

| Campo | Tipo | Origem |
|-------|------|--------|
| Item | Auto (sequencial) | — |
| Produto | Select | `state.produtos` com cmv > 0 |
| CMV + Embalagem (R$) | Auto | `produto.cmv` |
| DNA (%) | Auto | `dnaTotal` do contexto |
| Lucro Estimado (%) | Manual | Input % |
| Preço de Venda (R$) | Auto | `cmv / (1 - dna - lucro)` |
| iFood (%) | Manual | Input % |
| Entrega (R$) | Manual | Input R$ |
| Preço de Venda iFood (R$) | Auto | `((PV + entrega) / (1 - ifood)) + cupom` |
| Cupom (R$) | Manual | Input R$ |
| Lucro Est. Cardápio Fantasma (%) | Manual | Input % |
| PV Cardápio Fantasma (R$) | Auto | `cmv / (1 - dna - lucroFantasma)` |
| PV iFood Cardápio Fantasma (R$) | Auto | `((pvFantasma + entrega) / (1 - ifood)) + cupomFantasma` |
| Cupom Cardápio Fantasma (R$) | Manual | Input R$ |

**KPIs (cards resumo)**:
- Média de Lucro Estimado (%)
- Média de Lucro Estimado Cardápio Fantasma (%)

**Validações**:
- Se `DNA + Lucro Estimado >= 100%` → exibir "Percentual inválido" em vez do preço
- Se `iFood >= 100%` → exibir "Percentual inválido"
- Linhas sem produto ou com campos vazios → exibir "-"

**Visual**: Zebra-striping, campos auto em texto muted não editável, layout responsivo com scroll horizontal para a tabela larga.

### 2. `src/App.tsx` — Sem alteração

A rota `/precificacao` já existe e aponta para `Precificacao.tsx`.

### 3. `src/components/AppSidebar.tsx` — Renomear item

Renomear "Precificação" para "Preço de Venda (PV)" no menu lateral.

## Fórmulas

```text
PV = CMV / (1 - DNA/100 - LucroEst/100)
PV_iFood = ((PV + Entrega) / (1 - iFood/100)) + Cupom
PV_Fantasma = CMV / (1 - DNA/100 - LucroFantasma/100)
PV_iFood_Fantasma = ((PV_Fantasma + Entrega) / (1 - iFood/100)) + CupomFantasma
```

## Arquivos afetados
- `src/pages/Precificacao.tsx` — reescrito
- `src/components/AppSidebar.tsx` — renomear item menu

