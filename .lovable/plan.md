
Objetivo: corrigir o salvamento do preço em "Preço de Venda (PV)" para que o valor realmente persista e reapareça ao voltar para a tela.

Diagnóstico
- O estado global já salva `precosProdutos` no `AppContext` e persiste em `localStorage`.
- O problema principal está na tela `src/pages/Precificacao.tsx`:
  - ela salva os preços calculados no estado global,
  - mas as linhas da própria tela (`linhas`) sempre começam vazias com `emptyLinha()`,
  - então, ao recarregar ou voltar para a página, parece que “não salvou”.
- Há também um problema de consistência:
  - o auto-save só roda quando `precos.length > 0`,
  - então se o usuário limpar um produto ou invalidar um cálculo, o estado antigo pode continuar salvo e ficar desatualizado.

O que implementar

1. Hidratar a tela de Precificação com os preços já salvos
- Em `src/pages/Precificacao.tsx`, inicializar `linhas` a partir de `state.precosProdutos` quando existirem registros.
- Converter cada `PrecoProduto` salvo em uma `LinhaPV` editável.
- Se não houver preços salvos, manter a linha vazia padrão.
- Isso faz o usuário ver novamente o produto e o lucro que já cadastrou.

2. Tornar o salvamento automático confiável
- Extrair a lógica de montagem dos preços para uma função reutilizável.
- No `useEffect`, atualizar `state.precosProdutos` sempre que `linhas` mudar.
- Em vez de só salvar quando houver preços válidos, substituir corretamente os preços dos produtos presentes na tela atual.
- Se uma linha ficar inválida ou for removida, o preço correspondente também deve ser removido/atualizado no estado global, evitando dados “fantasma”.

3. Remover duplicidade de lógica
- Hoje existe a mesma lógica no `useEffect` e no botão “Salvar Preços”.
- Unificar isso em uma função só para evitar divergência.
- Depois decidir entre:
  - manter o botão apenas como ação visual/feedback, ou
  - remover o botão e deixar só auto-save.
- Como o comportamento desejado é “salvar ao adicionar no PV”, a melhor UX é auto-save com feedback visual.

4. Melhorar feedback para o usuário
- Mostrar mensagem do tipo “Preço salvo automaticamente” quando houver cálculo válido.
- Se o produto estiver sem lucro preenchido ou com fórmula inválida, mostrar aviso claro em vez de aparentar falha de salvamento.
- Isso reduz a sensação de que o sistema “não gravou”.

5. Garantir compatibilidade com Vendas do Dia
- Confirmar que `VendasDoDia.tsx` continue lendo de `state.precosProdutos`.
- Com a persistência corrigida, o preço salvo no PV passa a aparecer corretamente no lançamento da venda.

Arquivos afetados
- `src/pages/Precificacao.tsx` — correção principal
- `src/contexts/AppContext.tsx` — provavelmente sem mudança estrutural, apenas validar se o fluxo atual já atende
- `src/pages/VendasDoDia.tsx` — apenas ajuste pequeno se precisar alinhar mensagens/estado vazio

Detalhe técnico
- Criar um mapper entre:
  - `PrecoProduto` -> `LinhaPV` para hidratação da interface
  - `LinhaPV` -> `PrecoProduto` para persistência
- Cuidar especialmente dos campos que não existem no tipo salvo hoje:
  - `ifoodPct`
  - `entrega`
  - `cupom`
  - `lucroFantasma`
  - `cupomFantasma`
- Se esses campos precisarem reaparecer exatamente como o usuário digitou, será necessário ampliar o tipo `PrecoProduto` para salvar também os parâmetros do cálculo, não só os resultados finais.

Resultado esperado
- Ao cadastrar um produto no PV e preencher o lucro, o preço fica salvo de verdade.
- Ao sair e voltar para a tela, o produto continua aparecendo na precificação.
- O módulo Vendas do Dia passa a enxergar esse preço de forma consistente.
