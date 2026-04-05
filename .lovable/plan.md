

# Módulo: Página de Ofertas

## Resumo

Nova tela de análise estratégica que cruza dados de vendas, precificação, CMV e DNA para montar quadrantes de produtos e gerar automaticamente 4 tipos de oferta comercial.

## Arquivos a criar/editar

### 1. `src/types/index.ts` — Novos tipos

```typescript
export interface Oferta {
  id: string;
  tipo: 'normal' | 'subida_lucro' | 'escala_vendas' | 'agressiva';
  nome: string;
  produtoIds: string[];
  nomesProdutos: string[];
  somaPrecoNormal: number;
  precoOferta: number;
  cmvTotal: number;
  dnaPercent: number;
  lucroPercent: number;
  lucroDinheiro: number;
  objetivoEstrategico: string;
  status: 'ativa' | 'teste' | 'arquivada';
  criadoEm: string;
  // campos extras para agressiva
  cmvUnitario?: number;
  quantidade?: number;
  lucroAlvo?: number;
  precoPsicologico?: number;
}

// Adicionar ao AppState:
// ofertas: Oferta[];
```

### 2. `src/contexts/AppContext.tsx` — Estado e actions

- Adicionar `ofertas: []` ao `initialState`
- Novas actions: `SET_OFERTAS`, `ADD_OFERTA`, `UPDATE_OFERTA`, `REMOVE_OFERTA`
- Merge defensivo no `loadState`

### 3. `src/pages/Ofertas.tsx` — Nova tela (arquivo principal)

**Layout da página:**

1. **Filtro de período** no topo (hoje, 7d, 15d, 30d, mês atual, personalizado)

2. **4 Quadrantes** em grid 2x2:
   - Cada quadrante mostra `ceil(N * 0.20)` produtos
   - Q1: Mais Vendidos (ordem desc por qtd vendida)
   - Q2: Menos Vendidos (ordem asc por qtd vendida)
   - Q3: Mais Lucrativos (ordem desc por lucratividade %)
   - Q4: Menos Lucrativos (ordem asc por lucratividade %)
   - Cada tabela: Nome, Qtd Vendida, PV, CMV, Lucro R$, Lucro %

3. **Média de Lucro dos Mais Vendidos** — card destacado com o valor calculado

4. **Produtos Repetidos entre Quadrantes** — seção com 4 cruzamentos:
   - Mais Vendidos + Mais Lucrativos → "Produtos Coringa"
   - Mais Vendidos + Menos Lucrativos → "Produtos Perigosos"
   - Menos Vendidos + Mais Lucrativos → "Potencial de Escala"
   - Menos Vendidos + Menos Lucrativos → "Produtos Fracos"

5. **Calculadora de Ofertas** — Tabs com 4 tipos:
   - **Normal**: selecionar 2 produtos coringa, cálculo automático do lucro mínimo % necessário, preço e validação
   - **Subida de Lucro**: 1 item menos lucrativo + 1 coringa, lucro = média dos mais vendidos
   - **Escala de Vendas**: campeão de vendas + coringa, lucro = max(10%, mínimo calculado)
   - **Agressiva**: campos manuais (nome, CMV unitário, qtd, lucro alvo default 10%), arredondamento psicológico automático (finais .99)

6. **Sugestões Automáticas** — seção que gera automaticamente a melhor oferta de cada tipo usando os dados dos quadrantes

7. **Histórico de Ofertas** — tabela com todas as ofertas salvas, com filtro por status (ativa/teste/arquivada) e ações de editar status/excluir

**Fórmulas implementadas:**
- Lucro R$ = PV - (PV × DNA%) - CMV
- Lucratividade % = (Lucro R$ / PV) × 100
- Preço oferta = (CMV1 + CMV2) / (1 - (DNA + Lucro%))
- Lucro mínimo % = T × (1 - D) / (C + T)
- Oferta agressiva: preço = (CMV × qtd) / (1 - (DNA + lucro alvo)), depois arredondamento psicológico

### 4. `src/App.tsx` — Nova rota `/ofertas`

### 5. `src/components/AppSidebar.tsx` — Novo item "Página de Ofertas" com ícone `Gift` ou `Tag`, posicionado após "Vendas do Dia"

## Dados consumidos (somente leitura)

- `state.produtos` → nomes e CMV+embalagem
- `state.precosProdutos` → preço de venda
- `state.vendas` → quantidade vendida por período
- `dnaTotal` → DNA da empresa %

## Observações

- Produtos sem vendas no período aparecem nos quadrantes com qtd = 0
- Produtos sem PV salvo usam PV = 0 e são sinalizados
- O histórico de ofertas persiste via localStorage junto com o restante do estado
- Sugestões automáticas são recalculadas ao mudar o período

