

# Despesas Fixas — Resumo Mensal com % por Mês

## O que muda

Atualmente o sistema calcula o custo fixo % usando **médias globais** (média despesas / média faturamento). A planilha original calcula **por mês**: soma despesas do mês / faturamento do mesmo mês × 100.

## Alterações

### 1. Financeiro.tsx — Adicionar tabela-resumo mensal na aba Despesas Fixas

Após a tabela de lançamentos, adicionar uma segunda tabela "Resumo Mensal" com colunas:
- **Mês** | **Total Custo Fixo (R$)** | **Custo Fixo (%)**

Lógica:
- Agrupar `state.despesasFixas` por mês → somar valores
- Para cada mês, buscar o faturamento correspondente em `state.faturamento`
- Se faturamento > 0: `% = (totalDespesasMes / faturamentoMes) × 100`
- Se faturamento = 0 ou ausente: exibir `"-"` na coluna %
- Linha final: **Média Custo Fixo R$** e **Média Custo Fixo %** (apenas meses preenchidos)

Atualizar os cards de resumo no topo para mostrar Média R$ e Média %.

### 2. AppContext.tsx — Ajustar custoFixoPercent no DNA

Alterar o cálculo do `custoFixoPercent` na função `recompute` para usar a **média dos percentuais mensais** (apenas meses com faturamento > 0), alinhando com a planilha:
- Para cada mês com despesas E faturamento > 0: calcular `(totalDespMes / fatMes) × 100`
- `custoFixoPercent` = média desses percentuais

### 3. Mês como Select no modal

Trocar o campo "Mês" no modal de nova despesa de input texto livre para um `<Select>` com os 12 meses pré-definidos, evitando erros de digitação e garantindo correspondência com a tabela de faturamento.

## Arquivos afetados
- `src/pages/Financeiro.tsx` — tabela-resumo mensal + select de mês
- `src/contexts/AppContext.tsx` — cálculo custoFixoPercent por mês

