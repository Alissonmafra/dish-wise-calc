# Corrigir recursão de RLS em `profiles` (bloqueia login do admin)

## Problema
As requisições a `profiles` estão retornando **HTTP 500** com:
`infinite recursion detected in policy for relation "profiles"`.

Causa: a policy `admin_all_profiles` faz `SELECT role FROM profiles WHERE id = auth.uid()` **dentro** da própria tabela `profiles`, o que dispara a própria policy de novo → recursão. Mesma coisa em `admin_all_state` (que também consulta `profiles`).

Como o profile não carrega, `useAuth` deixa `profile = null`, `isAdmin = false`, e o link de Admin nunca aparece / a rota `/admin` redireciona pra `/`.

## Solução: SECURITY DEFINER function + policies reescritas

Migração SQL:

1. Criar função `public.is_admin(uid uuid)` `SECURITY DEFINER` que lê `profiles.role` sem disparar RLS:
   ```sql
   CREATE OR REPLACE FUNCTION public.is_admin(_uid uuid)
   RETURNS boolean
   LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
   AS $$ SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _uid AND role = 'admin') $$;
   ```

2. `DROP POLICY` das policies recursivas em `profiles` e `app_state` e recriar usando a função:
   ```sql
   DROP POLICY IF EXISTS admin_all_profiles ON public.profiles;
   DROP POLICY IF EXISTS own_profile        ON public.profiles;
   CREATE POLICY own_profile        ON public.profiles FOR ALL TO authenticated
     USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
   CREATE POLICY admin_all_profiles ON public.profiles FOR ALL TO authenticated
     USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

   DROP POLICY IF EXISTS admin_all_state ON public.app_state;
   DROP POLICY IF EXISTS own_state       ON public.app_state;
   CREATE POLICY own_state       ON public.app_state FOR ALL TO authenticated
     USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
   CREATE POLICY admin_all_state ON public.app_state FOR ALL TO authenticated
     USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
   ```

3. Garantir que o usuário `contato@mafraads.com.br` está marcado como `role = 'admin'` e `ativo = true` em `profiles` (verifico antes; se estiver como `cliente`, faço UPDATE).

## Arquivo afetado
- Nova migração SQL (sem mudanças em código frontend — o `AdminPanel.tsx` e o link já existem; estão apenas escondidos porque o profile não carrega).

Depois da migração, o login do `contato@mafraads.com.br` carregará o profile com `role='admin'` e o menu/rota `/admin` ficará acessível.
