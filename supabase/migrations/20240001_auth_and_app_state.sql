-- ============================================================
-- Execute no Supabase SQL Editor ou via CLI: supabase db push
-- ============================================================

-- 1. Perfis de usuário
CREATE TABLE IF NOT EXISTS public.profiles (
  id               UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nome_restaurante TEXT        NOT NULL DEFAULT '',
  role             TEXT        NOT NULL DEFAULT 'cliente' CHECK (role IN ('admin', 'cliente')),
  ativo            BOOLEAN     NOT NULL DEFAULT TRUE,
  criado_em        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ultimo_acesso    TIMESTAMPTZ
);

-- 2. Estado do app por usuário (coluna "state" para alinhar com AppContext.tsx)
CREATE TABLE IF NOT EXISTS public.app_state (
  user_id      UUID        REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  state        JSONB       NOT NULL DEFAULT '{}',
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Row Level Security
ALTER TABLE public.profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_state ENABLE ROW LEVEL SECURITY;

-- Profiles: cada um vê o próprio; admin vê todos
CREATE POLICY "own_profile" ON public.profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "admin_all_profiles" ON public.profiles
  FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- App state: cada um acessa o próprio; admin acessa todos
CREATE POLICY "own_state" ON public.app_state
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "admin_all_state" ON public.app_state
  FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- 4. Trigger: cria profile + app_state ao registrar novo usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE PLPGSQL SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome_restaurante, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome_restaurante', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'cliente')
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.app_state (user_id, state)
  VALUES (NEW.id, '{}')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================
-- Após criar seu usuário no Supabase Auth Dashboard, rode:
-- UPDATE public.profiles SET role = 'admin' WHERE id = '<seu-user-id>';
-- ============================================================
