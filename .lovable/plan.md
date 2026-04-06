

# Lucro % Manual em Todas as Ofertas

## Problema
Atualmente, o lucro % é calculado automaticamente em cada tipo de oferta (Normal usa lucro mínimo calculado, Subida usa média dos mais vendidos, Escala usa max(10%, calculado)). O usuário quer digitar manualmente o lucro % para todas as ofertas.

## Solução

### `src/pages/Ofertas.tsx`

1. **Adicionar estado para lucro manual** em cada calculadora:
   - `normalLucro` (número, inicializa vazio ou 0)
   - `subidaLucro` (número, inicializa com `mediaLucroMaisVendidos` quando disponível)
   - `escalaLucro` (número, inicializa com 10)

2. **Adicionar campo Input de "Lucro (%)"** na UI de cada aba:
   - Normal: input entre os selects de produto e o resultado
   - Subida de Lucro: input editável (pré-preenchido com a média dos mais vendidos como sugestão)
   - Escala de Vendas: input editável (pré-preenchido com 10%)
   - Agressiva: já tem input manual — sem mudança

3. **Refatorar as funções de cálculo** para usar o valor manual:
   - `calcOfertaNormal()`: usar `normalLucro / 100` em vez do `lucroMinPct` calculado. Manter a exibição do "lucro mínimo sugerido" como referência informativa, mas o cálculo do preço usa o valor digitado.
   - `calcOfertaSubida()`: usar `subidaLucro / 100` em vez de `mediaLucroMaisVendidos / 100`
   - `calcOfertaEscala()`: usar `escalaLucro / 100` em vez de `Math.max(0.10, lucroMinCalc)`

4. **Manter sugestões automáticas como referência**: mostrar o valor sugerido (lucro mínimo calculado, média dos mais vendidos, etc.) como texto informativo abaixo do input, para que o usuário tenha a referência mas possa ajustar.

### Arquivo afetado
- `src/pages/Ofertas.tsx` — único arquivo

