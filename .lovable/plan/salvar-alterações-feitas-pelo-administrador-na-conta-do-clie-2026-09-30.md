# Salvar alterações feitas pelo administrador na conta do cliente

## O que aconteceu
Quando o administrador abre a conta de um cliente (ex.: Sushi lounge Beer), o sistema mostra os dados, mas hoje **não grava nenhuma alteração** — isso foi colocado para evitar que o admin sobrescrevesse dados sem querer. Por isso as fichas técnicas feitas na conta do Sushi lounge Beer sumiram ao sair da tela.

## Recuperação
As fichas não chegaram a ser gravadas em lugar nenhum (nem na nuvem, nem como cópia de segurança no navegador, que também era bloqueada nesse modo). A conta do Sushi lounge Beer continua com os dados anteriores (69 insumos, 21 itens do cardápio, 13 fichas de produto, 0 receitas; última gravação em 29/09 às 18:24). Infelizmente não é possível recuperar as fichas perdidas — será preciso lançá-las de novo depois da correção. Os rascunhos de formulário abertos ainda podem estar no seu navegador e voltarão ao abrir a tela.

## Correção
- Quando o admin estiver na conta de um cliente, as alterações passam a ser gravadas **na conta desse cliente** (nunca na conta do admin).
- Cópia de segurança local das alterações pendentes também passa a valer nesse modo, separada por cliente.
- A gravação só acontece depois que os dados do cliente terminarem de carregar, para nunca apagar dados dele com uma tela vazia.
- Ao trocar de cliente ou voltar para a própria conta, as alterações pendentes do cliente anterior são gravadas antes da troca.

## Verificação
Entrar como admin, abrir a conta de um cliente de teste, criar uma ficha, sair e voltar, e conferir que ela continua lá e que a conta do admin não mudou.

## Detalhes técnicos
- `AppContext.tsx`: trocar `user.id` por `effectiveUserId` no upsert e na chave `pending-state:v1:`; remover as guardas `!viewingAsUserId` (linhas ~355, 396, 418); exigir `loadedRef.current === effectiveUserId`.
- Flush do debounce pendente no cleanup quando `effectiveUserId` muda.
- A política RLS `admin_all_state` já permite ao admin gravar em `app_state` de outros usuários.
