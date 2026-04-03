

# Módulo: Vendas do Dia

## Resumo

Criar o módulo "Vendas do Dia" para registro diário de vendas com cálculo automático de faturamento, custos e lucro. Inclui visões diária/mensal e alimentação automática do DRE. Requer primeiro persistir os preços de venda por produto no estado global.

## Pré-requisito: Persistir Preço de Venda por Produto

Hoje o PV é calculado localmente em `Precificacao.tsx` (estado local com `useState`). Para o módulo de vendas puxar o preço automaticamente, precisamos salvar o PV calculado no estado global.

### 1. `src/types/index.ts` — Novos tipos

```typescript
// Preço persistido por produto
export interface PrecoProduto {
  produtoId: string;
  lucroEstimado: number;
  precoVenda: number;        // PV calculado
  precoIfood: number | null;
  precoFantasma: number | null;
  precoIfoodFantasma: number | null;
}

// Snapshot de venda (congelado no momento do lançamento)
export interface VendaDia {
  id: string;
  data: string;            // YYYY-MM-DD
  produtoId: string;
  nomeProduto: string;     // snapshot
  canal: 'balcao' | 'delivery' | 'ifood' | 'fantasma';
  quantidade: number;
  precoUnitario: number;   // snapshot do PV
  cmvUnitario: number;     // snapshot do CMV+embalagem
  dnaPercent: number;      // snapshot do DNA%
  // computed no momento do lançamento (congelados)
  faturamentoBruto: number;
  custoTotalProduto: number;
  custoVariavelUnitario: number;
  custoVariavelTotal: number;
  lucroUnitario: number;
  lucroTotal: number;
}

// Adicionar ao AppState:
// precosProdutos: PrecoProduto[];
// vendas: VendaDia[];
```

### 2. `src/contexts/AppContext.tsx` — Estado e actions

- Adicionar `precosProdutos: []` e `vendas: []` ao `initialState`
- Novas actions:
  - `SET_PRECOS_PRODUTOS` — salva preços da tela de precificação
  - `ADD_VENDA` — adiciona venda com snapshot congelado
  - `REMOVE_VENDA` — remove venda
  - `SET_VENDAS` — bulk update
- Na `loadState`, fazer merge defensivo dos novos arrays

### 3. `src/pages/Precificacao.tsx` — Persistir preços

- Adicionar botão "Salvar Preços" que grava as linhas calculadas no estado global via `SET_PRECOS_PRODUTOS`
- Manter o simulador local como está, mas ao salvar ele persiste os PVs

### 4. `src/pages/VendasDoDia.tsx` — Nova tela principal

**Layout com Tabs**: "Lançamento" | "Resumo Diário" | "Resumo Mensal"

**Aba Lançamento:**
- Filtro de data no topo (padrão: hoje)
- Formulário de lançamento rápido:
  - Produto (select dos produtos com ficha técnica e PV salvo)
  - Canal de venda (select: balcão, delivery, iFood, fantasma)
  - Quantidade
  - Botão "Lançar"
- Ao lançar, o sistema congela snapshot: PV, CMV, DNA, e calcula todos os campos automáticos
- Tabela do dia com todas as colunas especificadas (Data, Produto, Canal, Qtd, PV Unit, Fat Bruto, CMV+Emb Unit, Custo Total, DNA%, Custo Var Unit, Custo Var Total, Lucro Unit, Lucro Total)
- Botão de excluir por linha

**Fórmulas (calculadas no snapshot):**
- `faturamentoBruto = quantidade × precoUnitario`
- `custoTotalProduto = quantidade × cmvUnitario`
- `custoVariavelUnitario = precoUnitario × (dnaPercent / 100)`
- `custoVariavelTotal = quantidade × custoVariavelUnitario`
- `lucroUnitario = precoUnitario - cmvUnitario - custoVariavelUnitario`
- `lucroTotal = quantidade × lucroUnitario`

**Aba Resumo Diário:**
- Seletor de data
- Cards: Faturamento Bruto, CMV Total, Custos Variáveis, Lucro Total, Qtd Itens, Ticket Médio, Produto Mais Vendido, Produto Mais Lucrativo

**Aba Resumo Mensal:**
- Seletor de mês/ano
- Cards consolidados: Fat Bruto Mensal, CMV Mensal, Custos Variáveis, Lucro Mensal, Qtd Total, Margem Média
- Tabela de ranking por produto (qtd, faturamento, lucro, participação %)

### 5. `src/pages/DREAnual.tsx` — Alimentação automática (parcial)

- Adicionar um botão/toggle "Importar de Vendas" por mês que preenche automaticamente:
  - `fatBruto` ← soma faturamento bruto das vendas do mês
  - `ingredientes` ← soma CMV total das vendas do mês
  - `impostos` ← faturamento × alíquota efetiva
  - `taxaMaquininha` ← faturamento × média cartão %
- O usuário mantém controle manual mas pode importar dados reais

### 6. `src/App.tsx` e `src/components/AppSidebar.tsx` — Rota e navegação

- Nova rota `/vendas` → `VendasDoDia`
- Novo item no sidebar: "Vendas do Dia" com ícone `ShoppingCart`, posicionado após "Combos"

## Arquivos afetados

- `src/types/index.ts` — PrecoProduto, VendaDia, AppState
- `src/contexts/AppContext.tsx` — estado, actions, loadState
- `src/pages/Precificacao.tsx` — botão salvar preços
- `src/pages/VendasDoDia.tsx` — **novo arquivo** (tela completa)
- `src/pages/DREAnual.tsx` — botão importar vendas
- `src/App.tsx` — rota
- `src/components/AppSidebar.tsx` — nav item

## Observações

- Os preços de venda precisam ser salvos na Precificação antes de lançar vendas — o sistema alertará se não houver PV cadastrado
- O histórico é imutável: alterar preços ou custos futuramente não afeta vendas já lançadas
- A integração com o DRE é semi-automática (botão importar) para manter flexibilidade do usuário

