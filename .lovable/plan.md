

# DRE Anual — Entrada Manual com Somas Automáticas

## Resumo

Transformar o DRE de um modelo baseado em percentuais (onde o usuário digita % e o sistema calcula valores) para um modelo de **entrada manual de valores em R$** por mês, com **totais e indicadores calculados automaticamente**.

## Como funciona hoje

- O usuário digita o **Faturamento Bruto** por mês e **percentuais de referência** por linha
- O sistema multiplica `faturamento × %` para gerar os valores mensais
- Totais e indicadores são derivados dos percentuais

## Como vai funcionar

- O usuário digita os **valores em R$ diretamente** em cada linha e mês (Impostos, Ingredientes, Aluguel, etc.)
- O sistema calcula automaticamente:
  - **Subtotais** (Receita Líquida, CMV Total, Total Infraestrutura, etc.)
  - **Resultado** (Total Despesas Operacionais, EBITDA, Lucro Líquido)
  - **Indicadores** (CMV %, Margem EBITDA, Margem Líquida, Ponto de Equilíbrio)
  - **Total Ano** (soma dos 12 meses)
  - **% Médio** (linha / faturamento bruto)
- A coluna **% Ref** é removida (não faz mais sentido)

## Alterações

### 1. `src/types/index.ts` — Novo modelo de dados

Substituir `DREState` para armazenar valores manuais por linha/mês:

```typescript
export interface DREValoresMensais {
  [lineKey: string]: number[]; // 12 valores por linha
}

export interface DREState {
  valores: DREValoresMensais; // valores manuais em R$
}
```

Remover `DREPercentuais` (não mais necessário).

### 2. `src/pages/DREAnual.tsx` — Reescrever a tabela

- Cada linha editável (não-seção, não-total) recebe inputs de R$ nos 12 meses
- Linhas de total (`isTotal`) somam as linhas filhas automaticamente
- Linhas de resultado (`isResult`) fazem as operações (Receita Líquida = Fat Bruto - Impostos, etc.)
- Indicadores calculados a partir dos valores reais
- Remover coluna "% Ref"
- Total Ano = soma dos 12 meses
- % Médio = Total da linha / Total Faturamento Bruto

### 3. `src/contexts/AppContext.tsx` — Ajustar state

- Atualizar `initialState.dre` para o novo formato
- Atualizar action `SET_DRE` 
- Ajustar `loadState` para migrar dados antigos (percentuais → novo formato)
- Remover referências a `DREPercentuais` no recompute

### 4. Integração Simples Nacional

- A linha de Impostos continua editável manualmente, mas o sistema pode **sugerir** o valor calculado pelo Simples Nacional como referência (tooltip ou badge), sem sobrescrever a entrada manual

## Linhas editáveis (input R$)

- Faturamento Bruto
- Impostos
- Ingredientes / Matérias-primas
- Salários Produção
- Pró-labore
- Bebidas / Revenda
- Aluguel / Condomínio
- Água / Luz / Energia
- Outros Infra
- Honorários Agência
- Mídia Social
- Marketing
- Contabilidade / Jurídico
- Limpeza / Escritório
- Outros Admin
- Reformas / Expansão
- Empréstimos
- Taxa de Maquininha
- Reserva de Caixa

## Linhas automáticas (soma/cálculo)

- Receita Líquida = Faturamento - Impostos
- CMV Total = soma das 4 linhas de CMV
- Total Infraestrutura, Comercial, Administrativas, Investimentos = soma das filhas
- Total Despesas Operacionais = soma dos 4 subtotais
- EBITDA = Receita Líquida - CMV - Despesas Operacionais
- Lucro Líquido = EBITDA (simplificado, sem depreciação/amortização)
- Indicadores = ratios sobre faturamento

## Arquivos afetados

- `src/types/index.ts` — novo DREState, remover DREPercentuais
- `src/pages/DREAnual.tsx` — reescrever para entrada manual
- `src/contexts/AppContext.tsx` — novo formato de state, migração, persistência

