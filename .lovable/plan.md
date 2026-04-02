

# Fechamento de Caixa — Reescrita completa

## Resumo

Reescrever `src/pages/Fechamento.tsx` para incluir todos os campos detalhados (taxas por meio de pagamento como inputs manuais por linha), cálculos automáticos inline e um quadro de Consolidado Mensal ao lado da tabela.

## Alterações

### 1. `src/types/index.ts` — Expandir `FechamentoDia`

Adicionar campos de taxa por linha que antes eram fixos do DNA:

```typescript
export interface FechamentoDia {
  id: string;
  data: string;
  dinheiroPix: number;
  debito: number;
  taxaDebito: number;      // % manual por dia
  credito: number;
  taxaCredito: number;     // % manual por dia
  ifood: number;
  taxaIfood: number;       // % manual por dia
  motoboyDiaria: number;
  motoboyEntregas: number;
  comprasCMV: number;
}
```

### 2. `src/pages/Fechamento.tsx` — Reescrever

**Layout**: Duas seções lado a lado (grid responsivo):
- Esquerda: Tabela diária com todas as colunas + botão "Novo Dia"
- Direita: Card "Consolidado Mensal" com tabela mês/entrada/saída/saldo

**Tabela diária** — inline editável (sem modal). Cada linha tem:

| Campo | Tipo |
|---|---|
| Data | Manual |
| Entrada Dinheiro + PIX (R$) | Manual |
| Cartão de Débito (R$) | Manual |
| Taxa Cartão de Débito (%) | Manual |
| Cartão de Débito - Taxa (R$) | Auto: `debito - (debito × taxaDeb/100)` |
| Cartão de Crédito (R$) | Manual |
| Taxa Cartão de Crédito (%) | Manual |
| Cartão de Crédito - Taxa (R$) | Auto: `credito - (credito × taxaCred/100)` |
| iFood (R$) | Manual |
| Taxa iFood (%) | Manual |
| iFood - Taxa (R$) | Auto: `ifood - (ifood × taxaIfood/100)` |
| Motoboy Diária (R$) | Manual |
| Motoboy Entregas (R$) | Manual |
| Compras CMV + Embalagem (R$) | Manual |
| Entrada (R$) | Auto: `dinheiroPix + debito + credito + ifood` |
| Saída (R$) | Auto: `taxaDebVal + taxaCredVal + taxaIfoodVal + motoboy + entregas + compras` |
| Saldo (R$) | Auto: `entrada - saida` |

**Entrada por modal** para adicionar novo dia (formulário com os 11 campos manuais). Exclusão por botão na linha.

**Consolidado Mensal**: Agrupa fechamentos por mês (YYYY-MM da data), soma entrada/saída/saldo por mês. Exibe como tabela simples: Mês | Entrada | Saída | Saldo.

**Scroll horizontal** na tabela principal (muitas colunas). Zebra-striping.

### 3. `src/contexts/AppContext.tsx` — Sem alteração estrutural

O reducer já trata `SET_FECHAMENTOS`. Os novos campos (`taxaDebito`, `taxaCredito`, `taxaIfood`) serão persistidos normalmente via spread.

## Fórmulas

```text
debLiq   = debito - (debito × taxaDeb/100)
credLiq  = credito - (credito × taxaCred/100)
ifoodLiq = ifood - (ifood × taxaIfood/100)
entrada  = dinheiroPix + debito + credito + ifood
saida    = (debito × taxaDeb/100) + (credito × taxaCred/100) + (ifood × taxaIfood/100) + motoboyDiaria + motoboyEntregas + comprasCMV
saldo    = entrada - saida
```

## Arquivos afetados
- `src/types/index.ts` — expandir FechamentoDia
- `src/pages/Fechamento.tsx` — reescrito

