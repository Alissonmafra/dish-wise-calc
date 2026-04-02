

# DRE, Painel de Metas, Mini-DRE por Produto e Diagnóstico

## Resumo

Implementar 4 novos módulos financeiros baseados na planilha DRE do restaurante, com integração aos módulos existentes.

## Novos arquivos

### 1. `src/types/index.ts` — Expandir com tipos do DRE

Adicionar interfaces:

```typescript
export interface DREPercentuais {
  impostos: number;           // 8
  ingredientes: number;       // 35
  salariosProd: number;       // 10
  proLabore: number;          // 7
  bebidasRevenda: number;     // 5
  aluguel: number;            // 3
  aguaLuz: number;            // 1.5
  outrosInfra: number;        // 0.5
  honorariosAgencia: number;  // 2
  midiaSocial: number;        // 2
  marketing: number;          // 1
  contabilidade: number;      // 2
  limpezaEscritorio: number;  // 1.5
  outrosAdmin: number;        // 2
  reformas: number;           // 3
  emprestimos: number;        // 2
  taxaMaquininha: number;     // 2.5
  reservaCaixa: number;       // 2.5
}

export interface DREState {
  percentuais: DREPercentuais;
  faturamentoBruto: number[]; // 12 meses
}

export interface DiagnosticoResposta {
  id: string;
  resposta: string;
}

// Adicionar ao AppState:
// dre: DREState;
// diagnosticoRespostas: DiagnosticoResposta[];
```

### 2. `src/contexts/AppContext.tsx` — Expandir state

- Adicionar `dre` e `diagnosticoRespostas` ao `AppState`
- Adicionar actions `SET_DRE` e `SET_DIAGNOSTICO`
- Estado inicial do DRE com percentuais padrão e faturamento zerado (12 meses)

### 3. `src/pages/DREAnual.tsx` — DRE Anual (Módulo 1)

**Layout**: Tabela grande com scroll horizontal.

**Colunas**: Linha do DRE | % Ref | Jan...Dez | Total Ano | % Médio

**Linhas agrupadas** (conforme planilha):
- RECEITA: Faturamento Bruto (editável), Impostos (auto), Receita Líquida (auto)
- CUSTOS (CMV): 4 linhas + Total CMV
- DESPESAS OPERACIONAIS: Infraestrutura (3+total), Comercial (3+total), Administrativas (3+total), Investimentos (4+total)
- RESULTADO: Total Desp. Operacionais, CMV Total, EBITDA, Lucro Líquido
- INDICADORES: CMV %, Margem EBITDA, Margem Líquida, Ponto de Equilíbrio

**Modo**: Por padrão, edita Faturamento Bruto por mês e percentuais na coluna % Ref. Tudo recalcula automaticamente.

**Fórmulas**: Cada linha = `Faturamento Bruto × %`. Totais = soma das sub-linhas. EBITDA = Receita Líquida - CMV - Despesas Operacionais. Indicadores = ratios sobre Faturamento.

**Visual**: Linhas de seção com fundo colorido, zebra-striping, campos auto em texto muted.

### 4. `src/pages/PainelMetas.tsx` — Painel de Metas (Módulo 2)

**Layout**: Cards com indicadores + tabela mensal.

**6 indicadores** puxando do DRE:
| Indicador | Fonte | Regra status |
|---|---|---|
| Faturamento Bruto | Total Ano DRE | > 0 → ✅ Ativo |
| CMV % do Faturamento | CMV Total / Fat. Bruto | ≤ 55% → ✅, > 55% → 🚨 |
| Margem EBITDA | EBITDA / Fat. Bruto | ≥ 20% → ✅, < 20% → 🚨 |
| Margem Líquida | Lucro Líq / Fat. Bruto | ≥ 10% → ✅, < 10% → 🚨 |
| Infraestrutura % | Total Infra / Fat. Bruto | ≤ 6% → ✅, > 6% → ⚠️ |
| Custo Comercial % | Total Comercial / Fat. Bruto | ≤ 5% → ✅, > 5% → ⚠️ |

**Tabela mensal** com valores mês a mês para cada indicador + Total Ano + Status.

**Alertas críticos**: Box de texto fixo com avisos sobre precificação e pró-labore.

### 5. `src/pages/MiniDRE.tsx` — Mini-DRE por Produto (Módulo 3)

**Layout**: Formulário/card por produto selecionado.

**Campos**:
- Produto (select de produtos com ficha técnica)
- Preço de Venda (manual ou vindo de PV)
- Impostos = PV × 8% (configurável)
- Receita Líquida = PV - Impostos
- Ingredientes + Embalagem (auto da ficha técnica = `produto.cmv`)
- Custo Funcionário = PV × 10%
- Pró-labore = PV × 7%
- Total Custo Produção = Ingredientes + Embalagem + Func + Pró-labore
- % Custo Produção = Total / PV
- Despesas rateadas (aluguel 3%, energia 1.5%, agência+mídia 4%, maquininha 2.5%, outros 2%)
- Lucro Bruto = Receita Líq - Custo Prod - Desp Rateadas
- Margem = Lucro Bruto / PV
- Simulador de Volume: Qtd vendas/mês (manual) → Fat. Bruto Mensal, Lucro Total Mensal
- Seção Bebidas: Preço compra (manual) → Markup 2x, 3x, 4x

### 6. `src/pages/Diagnostico.tsx` — Diagnóstico Rápido (Módulo 4)

**Layout**: Tabela com 10 perguntas + campo de resposta + diagnóstico automático + ação recomendada.

**Lógica de diagnóstico por palavras-chave** (conforme especificação):
- Pergunta 1: "dobro"/"concorrência" → 🚨 Precificação por achismo
- Pergunta 2: "não"/"nao" → 🚨 Sem pró-labore
- Pergunta 3: "não"/"nao"/"nunca" → 🚨 Não acompanha DRE
- Pergunta 4: valor entre 50-57% → ✅, senão → 🚨
- Pergunta 5: "sim"/"às vezes" → 🚨 Mistura PF/PJ
- Pergunta 6: "não"/"nao" → ⚠️ Sem rastreio
- Pergunta 7: "não"/"nao" → 🚨 Sem reserva
- Pergunta 8: "não"/"nao" → ⚠️ Não conhece PE
- Pergunta 9: "não"/"nao"/"nunca" → ⚠️ Não repassa
- Pergunta 10: valor entre 4-6% → ✅, senão → ⚠️

**Pontuação**: Contagem automática de 🚨, ⚠️, ✅. Interpretação: 0-2 alertas = saudável, 3-5 = atenção, 6+ = risco alto.

**Persistência**: Respostas salvas no state global.

### 7. `src/App.tsx` — 4 novas rotas

```
/dre → DREAnual
/painel-metas → PainelMetas
/mini-dre → MiniDRE
/diagnostico → Diagnostico
```

### 8. `src/components/AppSidebar.tsx` — 4 novos itens no menu

Adicionar: DRE Anual, Painel de Metas, Mini-DRE Produto, Diagnóstico Rápido.

## Arquivos afetados

- `src/types/index.ts` — novos tipos DRE e Diagnóstico
- `src/contexts/AppContext.tsx` — novo state, actions, initial data
- `src/pages/DREAnual.tsx` — novo
- `src/pages/PainelMetas.tsx` — novo
- `src/pages/MiniDRE.tsx` — novo
- `src/pages/Diagnostico.tsx` — novo
- `src/App.tsx` — 4 rotas
- `src/components/AppSidebar.tsx` — 4 itens menu

