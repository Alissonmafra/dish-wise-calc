# Cadastro de Clientes com Aprovação do Admin

## Objetivo
- Permitir auto-cadastro na tela de login (cadastro fica pendente, sem acesso até o admin aprovar).
- Admin pode cadastrar clientes diretamente (já existe) **ou** aprovar cadastros pendentes.
- Mostrar/ocultar senha (ícone de olho) em todos os campos de senha.

## Mudanças

### 1. `src/pages/Login.tsx` — adicionar abas Entrar / Cadastrar
- Tabs do shadcn: **Entrar** (form atual) e **Cadastrar** (nome do restaurante, email, senha, confirmar senha).
- Botão de olho (`Eye` / `EyeOff` do lucide) no input de senha, alternando `type` entre `password` e `text`. Aplicar tanto no login quanto no cadastro.
- Fluxo do cadastro:
  1. `supabase.auth.signUp({ email, password, options: { data: { nome_restaurante, role: 'cliente', ativo_inicial: false } } })`.
  2. Imediatamente após o signUp (usuário fica logado), `update profiles set ativo=false where id = user.id`.
  3. `supabase.auth.signOut()` e exibir toast: *"Cadastro enviado! Aguarde a aprovação do administrador para acessar."*
- O bloqueio de login para conta inativa já existe no `ProtectedRoute` (`profile.ativo === false` → tela "Acesso suspenso"). Vou ajustar a mensagem para diferenciar **pendente de aprovação** vs **suspenso**, usando um simples texto baseado em `ultimo_acesso === null` (nunca acessou = pendente).

### 2. `src/pages/AdminPanel.tsx` — destacar pendentes e ação "Aprovar"
- Adicionar card de resumo **"Pendentes"** (clientes com `ativo=false` e `ultimo_acesso=null`).
- Na tabela: linha de pendente recebe badge amarelo **"Pendente"** e botão verde **"Aprovar"** (chama o `toggleAtivo` existente).
- Botão de olho no input de senha do formulário "Criar novo cliente".
- Filtro/ordem: pendentes aparecem primeiro.

### 3. Sem mudanças no backend
- Schema atual já suporta tudo: `profiles.ativo` (default true) + policies.
- O trigger `handle_new_user` continua criando o profile; a auto-aprovação é desfeita pelo `update` feito no passo 1.2 acima (RLS `own_profile` permite ao próprio usuário atualizar antes do logout).
- Admin continua criando clientes já ativos via o fluxo atual em `AdminPanel` (não muda).

## Arquivos afetados
- `src/pages/Login.tsx`
- `src/pages/AdminPanel.tsx`
- `src/App.tsx` (apenas ajuste do texto/condicional em `ProtectedRoute` para distinguir "pendente" de "suspenso")
