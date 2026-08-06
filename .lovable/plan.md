# Opção MEI — imposto 0% no DNA

## Objetivo

Permitir marcar que a empresa é **MEI**. Nesse caso o imposto do Simples Nacional deixa de ser calculado por alíquota efetiva e passa a **0%** em todo o sistema (DNA, preço de venda, Mini-DRE, DRE, ofertas etc.), já que o MEI paga um valor fixo mensal (DAS) e não um percentual sobre o faturamento.

## O que muda na tela

Na aba **Impostos** (Financeiro), no topo da configuração:

- Novo seletor **Regime Tributário**: `MEI` ou `Simples Nacional`.
- Ao escolher **MEI**:
  - Os campos de Anexo, RBT12 e Modo Simulação ficam ocultos.
  - Aparece um card explicando: "MEI não paga alíquota percentual sobre o faturamento — o imposto é um valor fixo mensal (DAS). Alíquota efetiva = 0%."
  - Resultado do cálculo mostra **0,00%** de alíquota efetiva e **R$ 0,00** de imposto do mês.
  - Campo opcional **Valor do DAS mensal (R$)** apenas informativo, exibido junto ao resultado (não entra no percentual do DNA).
  - Alerta se o faturamento anual ultrapassar o limite do MEI (R$ 81.000), sugerindo revisar o enquadramento.
- Ao escolher **Simples Nacional**: comportamento atual, sem alteração.

Na aba **DNA da Empresa**, o card "Impostos (%) — automático" passa a mostrar `0.00%` com a legenda "MEI — isento de alíquota percentual".

## Detalhes técnicos

- `src/types/index.ts`: adicionar `regime: 'MEI' | 'SIMPLES'` e `dasMensal: number` em `SimplesNacional`.
- `src/contexts/AppContext.tsx`: default `regime: 'SIMPLES'`, `dasMensal: 0` no `initialState` e no deep-merge de hidratação (dados legados continuam como Simples). No cálculo do DNA (linhas ~92-108), quando `regime === 'MEI'` forçar `impostos = 0` sem chamar `calcularImpostoSimples`.
- `src/lib/simplesNacionalCalc.ts`: aceitar o regime e retornar resultado zerado (com alerta do limite de R$ 81.000 quando aplicável) para MEI, mantendo a lógica atual para Simples.
- `src/components/ImpostosTab.tsx`: seletor de regime + renderização condicional descrita acima.
- `src/pages/MiniDRE.tsx`: usa `calcularImpostoSimples`; passa a respeitar o regime (0% para MEI).
- Verificar demais consumidores de `dna.impostos` — como o valor vem do contexto já zerado, propagam automaticamente.
