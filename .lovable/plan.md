

# Custos Fixos Invisíveis — Submódulo dentro de Despesas Fixas

## Resumo

Adicionar ao state global uma nova estrutura `custosInvisiveis` com 7 categorias (IPTU, Salários/Provisionamentos, Vale Transporte, Depreciação, Brindes, Veículos, Alimentação), cada uma com campos manuais e cálculos automáticos. O total dos custos invisíveis será somado às despesas fixas visíveis para compor o custo fixo real do mês, impactando o DNA da Empresa e toda a cadeia de precificação.

## Alterações

### 1. `src/types/index.ts` — Novos tipos

```typescript
export interface Funcionario {
  id: string;
  nome: string;
  cargo: string;
  salarioBase: number;
}

export interface Veiculo {
  id: string;
  nome: string;
  combustivel: number;
  estacionamento: number;
  pedagio: number;
  lavaJato: number;
  valorFipe: number;
  valorTotalFinanciamento: number;
  qtdParcelas: number;
  valorPneus: number;
  vidaUtilPneusMeses: number;
  manutencaoAnual: number;
  seguroAnual: number;
  franquiaSeguro: number;
  frequenciaFranquiaMeses: number;
  ipvaAnual: number;
  valorCompra: number;
  valorVendaFutura: number;
  periodoUsoMeses: number;
}

export interface CustosInvisiveis {
  iptuAnual: number;
  funcionarios: Funcionario[];
  valeTransporte: {
    valorPassagem: number;
    passagensPorDia: number;
    diasTrabalhados: number;
    qtdFuncionarios: number;
  };
  depreciacaoInventario: number;
  brindes: {
    qtdPorSemana: number;
    cmvUnitario: number;
    entregaUnitaria: number;
    fatorMensal: number; // default 4
  };
  veiculos: Veiculo[];
  alimentacao: {
    qtdFuncionarios: number;
    custoDiario: number;
    diasTrabalhados: number;
  };
}
```

Adicionar `custosInvisiveis: CustosInvisiveis` ao `AppState`.

### 2. `src/contexts/AppContext.tsx` — State + Cálculo

- Adicionar `custosInvisiveis` ao `initialState` com valores zerados
- Adicionar action `SET_CUSTOS_INVISIVEIS`
- Na função `recompute()`, calcular `totalCustosInvisiveis` e **somá-lo** às despesas fixas visíveis ao calcular `custoFixoPercent`

**Lógica de cálculo** (dentro de `recompute` ou helper):

```text
IPTU mensal = iptuAnual / 12

Por funcionário:
  fgts = salario × 8%
  prov13 = salario / 12
  provFerias = (salario + salario/3) / 12
  fgts13Ferias = (prov13 + provFerias) × 8%
  mediaSalarial = soma salários / qtd funcionários
  avisoMensal = mediaSalarial / 12
  avisoComplementar = (mediaSalarial + mediaSalarial/3 + mediaSalarial) × 8% / 12
  multaFGTS = (fgts + fgts13Ferias) × 50%
  totalFunc = salario + fgts + prov13 + provFerias + fgts13Ferias + avisoMensal + avisoComplementar + multaFGTS

VT = passagem × passagens/dia × dias × qtdFunc
Depreciação = (inventário / 50) / 60
Brindes = qtd × (cmv + entrega) × fator
Veículo = combustível + estac + pedágio + lavaJato + jurosMensal + pneuMensal + manutMensal + seguroMensal + franquiaMensal + ipvaMensal + desvalorizaçãoMensal
Alimentação = qtdFunc × custoDiário × dias

Total Invisíveis = IPTU + Salários + VT + Depreciação + Brindes + Veículos + Alimentação
```

- `custoFixoPercent` passa a usar: `(despesasVisíveisMês + totalInvisíveis) / faturamentoMês`

### 3. `src/pages/Financeiro.tsx` — Nova aba "Custos Invisíveis"

Adicionar uma 4ª tab no TabsList: **"Custos Invisíveis"**.

**Conteúdo da aba** — seções colapsáveis (Accordion) para cada categoria:

1. **IPTU**: Input valor anual → mostra mensal automático
2. **Salário e Provisionamentos**: Tabela CRUD de funcionários (nome, cargo, salário). Para cada um, exibe detalhamento automático (FGTS, 13º, férias, etc.). Total ao final.
3. **Vale Transporte**: 4 inputs (passagem, passagens/dia, dias, qtd funcionários) → total automático
4. **Depreciação de Maquinário**: Input valor inventário → mensal automático
5. **Brindes**: 4 inputs (qtd/semana, CMV, entrega, fator mensal) → total automático
6. **Veículos**: CRUD de veículos com todos os campos manuais. Cada veículo mostra custo mensal detalhado. Total ao final.
7. **Alimentação**: 3 inputs (qtd func, custo diário, dias) → total automático

**Quadro-resumo** no topo: Total por categoria + Total Custos Invisíveis.

**Alertas inteligentes**: Cards de aviso quando custos invisíveis > 30% do custo fixo total, ou quando salários são a maior parcela.

### 4. `src/pages/Financeiro.tsx` — Tab "Despesas Fixas" atualizada

No Resumo Mensal, mostrar 3 linhas:
- Despesas Fixas Visíveis (soma lançamentos manuais)
- Custos Fixos Invisíveis (total calculado)
- **Total Custo Fixo** (soma dos dois)

O % Custo Fixo e a Média passam a usar o Total Custo Fixo completo.

### 5. Sem alteração em rotas/sidebar

Custos Invisíveis é uma aba dentro do Financeiro existente, não uma página nova.

## Arquivos afetados

- `src/types/index.ts` — novos tipos (Funcionario, Veiculo, CustosInvisiveis, expandir AppState)
- `src/contexts/AppContext.tsx` — novo state, action, cálculo no recompute
- `src/pages/Financeiro.tsx` — nova aba + atualização do resumo mensal

