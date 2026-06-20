
CREATE OR REPLACE FUNCTION public.is_admin(_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _uid AND role = 'admin')
$$;

DROP POLICY IF EXISTS admin_all_profiles ON public.profiles;
DROP POLICY IF EXISTS own_profile        ON public.profiles;

CREATE POLICY own_profile ON public.profiles
  FOR ALL TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY admin_all_profiles ON public.profiles
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS admin_all_state ON public.app_state;
DROP POLICY IF EXISTS own_state       ON public.app_state;

CREATE POLICY own_state ON public.app_state
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY admin_all_state ON public.app_state
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

UPDATE public.profiles
SET role = 'admin', ativo = true
WHERE id = 'b17d02a2-3b6c-43bf-9805-1c1a02829c6e';
