

# Regra de Custo Fixo (%) e Composição de Margem

## Resumo

Adicionar ao DNAEmpresa um campo `composicaoMargem` calculado automaticamente. Quando o `custoFixoPercent` ultrapassa 33%, o excedente é exibido como "Composição de Margem". Exibir essa regra no Dashboard, Financeiro, Painel de Metas e DNA da Empresa com alertas visuais.

## Alterações

### 1. `src/types/index.ts` — Expandir DNAEmpresa

Adicionar campo computed `composicaoMargem: number` ao `DNAEmpresa`.

### 2. `src/contexts/AppContext.tsx` — Cálculo automático no `recompute()`

Após calcular `custoFixoPercent`, calcular:

```text
composicaoMargem = custoFixoPercent > 33 ? custoFixoPercent - 33 : 0
```

Incluir `composicaoMargem` no spread do `dnaEmpresa` retornado. Exportar via context `composicaoMargem` diretamente para facilitar acesso.

### 3. `src/pages/Financeiro.tsx` — Card "Regra do Custo Fixo" na tab Despesas Fixas

Adicionar um Card abaixo do resumo mensal com:
- Custo Fixo Médio (R$) e Faturamento Médio (R$)
- % Custo Fixo (valor calculado)
- Limite Saudável: 33%
- Composição de Margem: `0%` ou valor excedente
- Status: ✅ ou ⚠️ com mensagem explicativa
- Alertas inteligentes contextuais

### 4. `src/pages/Dashboard.tsx` — Card de Composição de Margem

Adicionar um KPI card ou seção mostrando:
- % Custo Fixo atual
- Composição de Margem (se > 0, destaque em vermelho)
- Mensagem de alerta quando excedente

### 5. `src/pages/PainelMetas.tsx` — Novo indicador

Adicionar um 7º indicador ao painel:
- **Custo Fixo %**: ≤ 33% → ✅ Saudável, > 33% → 🚨 Acima do limite
- Exibir composição de margem como sub-info

### 6. `src/pages/DREAnual.tsx` — Linha de Composição de Margem

Na seção de Indicadores do DRE, adicionar linha "Composição de Margem (%)" calculada mês a mês.

## Arquivos afetados

- `src/types/index.ts` — adicionar `composicaoMargem` ao DNAEmpresa
- `src/contexts/AppContext.tsx` — cálculo no recompute
- `src/pages/Financeiro.tsx` — card de regra do custo fixo
- `src/pages/Dashboard.tsx` — KPI de composição de margem
- `src/pages/PainelMetas.tsx` — novo indicador
- `src/pages/DREAnual.tsx` — linha de composição de margem nos indicadores

