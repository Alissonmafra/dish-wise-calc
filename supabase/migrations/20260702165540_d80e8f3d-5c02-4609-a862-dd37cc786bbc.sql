
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_role text;
BEGIN
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'cliente');

  INSERT INTO public.profiles (id, nome_restaurante, role, ativo)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome_restaurante', ''),
    v_role,
    (v_role = 'admin')
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.app_state (user_id, state)
  VALUES (NEW.id, '{}')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

UPDATE public.profiles
SET ativo = false
WHERE id = '7afa6230-7764-4c52-8bc7-d51635e11e56';

UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, now())
WHERE id = '7afa6230-7764-4c52-8bc7-d51635e11e56';
