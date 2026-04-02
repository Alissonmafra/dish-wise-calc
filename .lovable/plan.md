

# Submódulo: Custos Variáveis — Imposto (Simples Nacional)

## Resumo

Criar um sistema de cálculo de imposto pelo Simples Nacional com tabela de faixas por anexo, cálculo de alíquota efetiva via RBT12, e modo simulação. Integrar o resultado no DRE, Mini-DRE e DNA da Empresa.

## Alterações

### 1. `src/types/index.ts` — Novos tipos

```typescript
export interface FaixaSimplesNacional {
  limiteInferior: number;
  limiteSuperior: number;
  aliquotaNominal: number; // em %
  parcelaADeduzir: number;
}

export interface SimplesNacional {
  anexo: string; // 'I' | 'II' | 'III' | 'IV' | 'V' | ''
  rbt12Manual: number; // RBT12 informado manualmente
  modoSimulacao: boolean; // se true, RBT12 = faturamento mensal × 12
}
```

Adicionar `simplesNacional: SimplesNacional` ao `AppState`.

### 2. `src/lib/simplesNacionalCalc.ts` — Tabelas e cálculo

- Cadastrar as 6 faixas do Anexo I (conforme especificação)
- Estrutura preparada para anexos II-V (tabelas futuras, por enquanto só Anexo I)
- Função `calcularImpostoSimples(faturamentoMensal, rbt12, anexo)` que retorna:
  - `faixa` (descrição da faixa enquadrada)
  - `aliquotaNominal` (%)
  - `parcelaADeduzir` (R$)
  - `aliquotaEfetiva` (%) = `((RBT12 × alíqNom) - dedução) / RBT12`
  - `impostoMensal` (R$) = `faturamento × alíqEfetiva`
  - `alertas` (array de strings para erros/avisos)

### 3. `src/contexts/AppContext.tsx` — State e integração

- Adicionar `simplesNacional` ao `initialState` com valores zerados e `modoSimulacao: false`
- Adicionar action `SET_SIMPLES_NACIONAL`
- No `loadState`, merge seguro com fallback
- O imposto calculado deve poder alimentar `dnaEmpresa.impostos` automaticamente (alíquota efetiva)

### 4. `src/pages/Financeiro.tsx` — Nova aba "Impostos"

Adicionar 5ª tab **"Impostos"** com:

**Configuração:**
- Select do Anexo (I a V, default vazio com alerta)
- Toggle modo simulação (on/off)
- Input RBT12 manual (desabilitado no modo simulação)
- Input faturamento mensal (pode puxar da média do faturamento cadastrado)

**Resultado automático:**
- Faixa enquadrada
- Alíquota nominal (%)
- Parcela a deduzir (R$)
- **Alíquota efetiva (%)** — destaque visual
- **Imposto do mês (R$)** — destaque visual

**Card educativo:** explicando que a alíquota usada não é a nominal da faixa, e sim a efetiva.

**Alertas:** anexo não definido, RBT12 vazio, faturamento zero.

**Tabela de referência:** exibir a tabela completa do anexo selecionado para consulta.

### 5. Integração com DRE e Mini-DRE

- No DRE (`src/pages/DREAnual.tsx`): a linha de Impostos pode usar a alíquota efetiva do Simples quando configurado (ou manter o % manual do DRE — deixar configurável)
- No Mini-DRE (`src/pages/MiniDRE.tsx`): usar a alíquota efetiva do Simples no cálculo de impostos por produto, quando disponível

### 6. `src/components/AppSidebar.tsx` — Sem alteração

Impostos é uma aba dentro do Financeiro, não uma página nova.

## Arquivos afetados

- `src/types/index.ts` — novos tipos SimplesNacional
- `src/lib/simplesNacionalCalc.ts` — novo arquivo com tabelas e cálculo
- `src/contexts/AppContext.tsx` — novo state e action
- `src/pages/Financeiro.tsx` — nova aba Impostos
- `src/pages/DREAnual.tsx` — integração opcional da alíquota efetiva
- `src/pages/MiniDRE.tsx` — integração opcional da alíquota efetiva

