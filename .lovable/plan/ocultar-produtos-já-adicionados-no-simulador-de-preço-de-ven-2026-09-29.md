# Ocultar produtos já adicionados no Simulador de Preço de Venda

## Objetivo
Na tela de Precificação (Simulador de Preço de Venda), o seletor de produto de cada linha não deve mais listar produtos que já estão selecionados em outras linhas — evitando cadastrar o mesmo produto duas vezes.

## Comportamento atual
- Cada linha tem um `Select` que lista todos os produtos com ficha técnica (`produtosComFicha`), independentemente de já estarem em outra linha.

## Mudanças (arquivo: `src/pages/Precificacao.tsx`)
1. Criar a lista de produtos disponíveis por linha, filtrando `produtosComFicha`:
   - Excluir os produtos já selecionados nas **outras** linhas (comparando `produtoId`).
   - Manter o produto da própria linha na lista (para que o valor selecionado continue visível no seletor).
   - Exemplo: linha 3 usa o filtro excluindo os produtos das linhas 1 e 2, mas mantém o próprio produto.
2. Aplicar essa lista filtrada no `SelectContent` de cada linha (ordenação/fluxo atuais permanecem iguais).
3. Nenhuma alteração de lógica de negócio, cálculo de PV, autosave ou exportação.

## Verificação
- Compilação TypeScript sem erros.
- Teste rápido via Playwright na prévia quando houver sessão disponível; caso contrário, conferência por leitura do código e teste de build.

## Sem riscos
- Dados salvos (`precosProdutos`) não mudam; apenas a lista de opções do seletor é filtrada.
