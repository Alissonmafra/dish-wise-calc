# Corrigir DNA que continua com 6,93% após marcar MEI

## Causa confirmada

No reducer do estado global, a ação que salva a configuração tributária (`SET_SIMPLES_NACIONAL`) é a única que **não** dispara o recálculo do DNA — diferente de todas as outras ações (despesas, faturamento, insumos etc.), que passam por `recompute`.

Resultado: ao trocar o regime para MEI, o campo `impostos` do DNA permanece com o último valor calculado (6,93%) até que qualquer outra alteração force um recálculo. A legenda já muda para "MEI — isento de alíquota percentual", mas o número fica desatualizado — exatamente o que aparece na tela.

## Correção

- `src/contexts/AppContext.tsx`: fazer `SET_SIMPLES_NACIONAL` retornar `recompute({ ...state, simplesNacional: action.payload })`, para que a troca de regime (e também anexo/RBT12) atualize imediatamente o imposto do DNA e tudo que depende dele (preço de venda, Mini-DRE, DRE, ofertas).

Com isso, ao marcar MEI o card "Impostos (%)" passa a 0,00% na hora, e o DNA da Empresa cai de 10,43% para 3,50% neste cliente.
