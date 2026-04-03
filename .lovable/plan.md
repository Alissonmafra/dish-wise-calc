

# Fix: Produtos da Ficha Técnica não aparecem em Vendas do Dia

## Problema

O filtro em `VendasDoDia.tsx` exige **duas condições** para mostrar um produto:
1. `p.cmv > 0` (tem ficha técnica) 
2. Existe entrada em `state.precosProdutos` com `precoVenda > 0` (preço salvo manualmente na tela PV)

Como o usuário precisa ir na Precificação e clicar "Salvar Preços" antes, os produtos nunca aparecem no dropdown de vendas.

## Solução

Duas mudanças complementares:

### 1. `src/pages/Precificacao.tsx` — Auto-salvar preços ao calcular

Remover a necessidade do botão "Salvar Preços" separado. Os preços serão salvos automaticamente no estado global sempre que o usuário alterar uma linha de precificação (ao sair do campo ou ao mudar o produto/lucro). Isso garante que qualquer produto precificado já esteja disponível para vendas.

### 2. `src/pages/VendasDoDia.tsx` — Relaxar filtro de produtos

Alterar o filtro para mostrar todos os produtos com `cmv > 0` (ficha técnica concluída), independente de ter PV salvo. Se o produto não tiver PV salvo, mostrar o produto mas com aviso visual (preço R$ 0,00) para que o usuário saiba que precisa configurar o preço.

A mensagem de erro atual ("Nenhum produto disponível") será ajustada para só aparecer quando realmente não houver nenhum produto com ficha técnica.

## Arquivos

- `src/pages/VendasDoDia.tsx` — relaxar filtro de `produtosDisponiveis`
- `src/pages/Precificacao.tsx` — auto-persistir preços ao calcular

