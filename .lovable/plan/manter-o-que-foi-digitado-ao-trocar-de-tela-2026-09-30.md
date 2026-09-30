# Manter o que foi digitado ao trocar de tela

## Resultado esperado
- Ao sair de uma tela, voltar a ela, atualizar a página ou fechar e reabrir o navegador no mesmo aparelho, os campos não salvos continuam preenchidos.
- Rascunhos permanecem até serem salvos ou descartados explicitamente. Um cadastro salvo não reaparece como rascunho.
- Os rascunhos de cada cliente ficam separados; ao trocar de conta ou de cliente visualizado pelo administrador, nada de outra empresa aparece.

## Implementação
1. Criar um mecanismo compartilhado de rascunhos por conta, tela e operação (novo cadastro ou edição de um registro específico), com recuperação automática neste navegador. Não incluir senhas nem dados de acesso em rascunhos.
2. Aplicar aos formulários com campos temporários: insumos, itens do cardápio e manipulados, fichas técnicas e suas composições, despesa financeira, fechamento de caixa, criação de cliente sem guardar senha, lançamento de venda ainda não concluído, e demais simulações ou entradas locais que hoje desaparecem na navegação. Quando um formulário estava aberto, restaurá-lo ao voltar à tela; “Cancelar” ou “Descartar” limpa apenas o rascunho correspondente.
3. Para campos que já salvam diretamente, manter o funcionamento atual e acrescentar recuperação local para mudanças recentes ainda não sincronizadas, sem sobrescrever os dados da conta ao carregá-los ou misturar clientes.
4. Conferir o fluxo real: começar um preenchimento, sair para outra tela, voltar, atualizar e reabrir o navegador; depois salvar ou descartar e confirmar que o rascunho some. Repetir com troca de conta/cliente visualizado.

## Detalhes técnicos
- As telas são montadas por rota (`src/App.tsx`); os estados `useState` de formulários são desmontados ao navegar. O estado cadastrado é carregado e salvo por usuário em `AppContext`, com espera de 1,5 s antes da gravação, enquanto há formulários apenas locais.
- Manter rascunhos locais separados por identificador da conta e da empresa visualizada, sem reutilizar a chave compartilhada antiga; validar referências a cadastros existentes antes de restaurar uma edição. Não transformar um rascunho em cadastro definitivo antes do comando Salvar.
