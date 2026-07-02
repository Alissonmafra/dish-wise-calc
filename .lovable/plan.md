# Plano — Corrigir aprovação de novos cadastros (Boteco belem)

## Diagnóstico

O erro **"Email not confirmed"** e a impossibilidade de aprovar o Boteco vêm de dois problemas somados:

1. **Confirmação de email obrigatória** — quando o cliente se cadastra pela tela de login, o Supabase exige clicar num link enviado por email. O Boteco nunca confirmou, então o login sempre retorna `400: Email not confirmed`.
2. **Perfil ficou como "Ativo"** — o trigger cria o profile com `ativo=true` (default). O `UPDATE ativo=false` que o `Login.tsx` faz após o signup é bloqueado pela RLS (usuário ainda sem sessão válida). Resultado: no painel admin ele não aparece como **Pendente** e o botão **Aprovar** não é exibido.

Como o fluxo desejado é **admin aprova manualmente** (não link de email), a solução é desligar a confirmação por email e fazer o trigger marcar novos clientes como pendentes.

## Solução

### 1. Configuração de Auth
- Desativar exigência de confirmação de email (`auto_confirm_email = true`). Novos cadastros já entram logáveis pelo Supabase, mas ficam bloqueados pelo `ativo=false` do profile até o admin aprovar.

### 2. Migração no banco
- Alterar `handle_new_user` para inserir o profile com `ativo = (role = 'admin')` — clientes entram como `false` (Pendente), admins continuam `true`.
- Backfill dos dados existentes do Boteco: `profiles.ativo=false` + `auth.users.email_confirmed_at=now()` para ele já aparecer como Pendente e conseguir logar depois de aprovado.

### 3. Frontend — `src/pages/Login.tsx`
- Remover o `UPDATE ativo=false` pós-signup (hack que não funcionava por RLS). O trigger já garante isso no servidor.
- Ajustar a mensagem de sucesso do cadastro: *"Cadastro enviado! Aguarde a aprovação do administrador."*
- Tratar `Email not confirmed` no login com mensagem amigável ("Seu cadastro ainda não foi aprovado"), para o caso de usuários antigos.

## Arquivos afetados
- Configuração de Auth (auto-confirm on).
- Nova migration SQL (trigger + backfill do Boteco).
- `src/pages/Login.tsx`.

Nenhuma mudança no `AdminPanel` — badge "Pendente" e botão "Aprovar" já existem e passarão a funcionar assim que o profile do Boteco vire `ativo=false`.
