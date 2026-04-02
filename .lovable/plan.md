

# Combos — Reescrita completa

## Resumo

Reescrever `src/pages/Combos.tsx` para seguir o layout da referência: cada combo como um card individual com cabeçalho de parâmetros (nome, DNA, lucro, taxas, preços calculados) e grade inferior de produtos com quantidade e CMV.

## Alterações

### 1. `src/pages/Combos.tsx` — Reescrever

Substituir a implementação atual (modal-based) por uma tela com cards inline, sem modal.

**Layout por combo (card):**

Cabeçalho (tabela key-value, 2 colunas):
| Campo | Tipo |
|---|---|
| Nome do combo | Manual (input texto) |
| Quantidade de Produtos do Combo | Auto (soma das quantidades da grade) |
| DNA (%) | Auto (`dnaTotal` do contexto) |
| Lucro Estimado (%) | Manual (input %) |
| Custo do Combo \| Preço de Venda (R$) | Auto: `cmvTotal / (1 - dna - lucroEst)` |
| Taxa iFood (%) | Manual (input %) |
| Entrega (R$) | Manual (input R$) |
| Custo do Combo \| Preço de Venda iFood (R$) | Auto: `((PV + entrega) / (1 - ifood)) + cupom` |
| Cupom (R$) | Auto (default 0, ou manual se desejado — trataremos como manual para flexibilidade) |

**Grade inferior (tabela):**
| Produto (select, apenas com ficha técnica/cmv>0) | Quantidade (manual) | CMV + Embalagem (R$) (auto: qtd × produto.cmv) |

**Validações:**
- `DNA + Lucro >= 100%` → "Percentual inválido"
- `iFood >= 100%` → "Percentual inválido"
- Zebra-striping na grade

**Botões:** "Novo Combo" cria card vazio inline. Cada card tem botão excluir. Produtos adicionáveis/removíveis dentro de cada card.

**Persistência:** Cada alteração faz `dispatch({ type: 'SET_COMBOS', payload })` para manter estado global e cascata de cálculos.

**Nota sobre Cupom:** A especificação diz que cupom deve ser automático (default 0), mas para manter flexibilidade prática, será um input com default 0 — consistente com a fórmula de PV iFood.

### 2. Sem alteração em `App.tsx` ou `AppSidebar.tsx`

Rota `/combos` e item "Combos" no menu já existem.

## Fórmulas

```text
cmvTotal        = Σ (produto.cmv × quantidade)
qtdProdutos     = Σ quantidade
PV              = cmvTotal / (1 - DNA/100 - LucroEst/100)
PV_iFood        = ((PV + Entrega) / (1 - iFood/100)) + Cupom
```

## Arquivos afetados
- `src/pages/Combos.tsx` — reescrito

