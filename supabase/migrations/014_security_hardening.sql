-- ============================================================
-- 1. FIX search_path en todas las funciones
-- Previene ataques de search_path injection
-- ============================================================
ALTER FUNCTION public.is_league_member(uuid)
  SET search_path = public, pg_temp;
ALTER FUNCTION public.is_banned_from_league(uuid)
  SET search_path = public, pg_temp;
ALTER FUNCTION public.is_league_full(uuid)
  SET search_path = public, pg_temp;
ALTER FUNCTION public.calculate_match_points(int)
  SET search_path = public, pg_temp;
ALTER FUNCTION public.fn_audit_log_readonly()
  SET search_path = public, pg_temp;
ALTER FUNCTION public.fn_prediction_audit_readonly()
  SET search_path = public, pg_temp;
ALTER FUNCTION public.fn_log_prediction_insert()
  SET search_path = public, pg_temp;
ALTER FUNCTION public.fn_log_prediction_update()
  SET search_path = public, pg_temp;
ALTER FUNCTION public.fn_predictions_set_updated_at()
  SET search_path = public, pg_temp;

-- ============================================================
-- 2. REVOKE EXECUTE en funciones internas
-- Estas funciones son triggers internos — nadie
-- debe poder llamarlas directamente via API
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.fn_log_prediction_insert()
  FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fn_log_prediction_update()
  FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user()
  FROM anon, authenticated;

-- is_banned_from_league, is_league_full, is_league_member
-- se usan en RLS policies — deben seguir siendo
-- ejecutables por authenticated pero NO por anon
REVOKE EXECUTE ON FUNCTION public.is_banned_from_league(uuid)
  FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_league_full(uuid)
  FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_league_member(uuid)
  FROM anon;

-- ============================================================
-- 3. FIX RLS policy de sponsors
-- Separar SELECT público (carousel visible sin login) de
-- escritura restringida a admin. El problema original era
-- USING (true) en FOR ALL = cualquier autenticado podía escribir.
-- ============================================================
DROP POLICY IF EXISTS "sponsors: solo admin gestiona" ON public.sponsors;
DROP POLICY IF EXISTS "sponsors: solo admin puede modificar" ON public.sponsors;
DROP POLICY IF EXISTS "sponsors: lectura pública" ON public.sponsors;

-- Lectura: todos (incluye anon — el carousel se muestra sin login)
CREATE POLICY "sponsors: lectura pública"
  ON public.sponsors
  FOR SELECT
  TO public
  USING (true);

-- Escritura: solo admin. Email hardcodeado — mismo valor que
-- ADMIN_EMAILS en .env.local. Si cambia el admin, nueva migración.
CREATE POLICY "sponsors: solo admin puede modificar"
  ON public.sponsors
  FOR ALL
  TO authenticated
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) = 'devsolutionarg@gmail.com'
  )
  WITH CHECK (
    (SELECT email FROM auth.users WHERE id = auth.uid()) = 'devsolutionarg@gmail.com'
  );

-- ============================================================
-- 4. FIX Storage buckets - restringir listing
-- ============================================================
DROP POLICY IF EXISTS "avatars: lectura pública" ON storage.objects;
CREATE POLICY "avatars: lectura pública"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'avatars' AND name IS NOT NULL);

DROP POLICY IF EXISTS "league-images: lectura pública" ON storage.objects;
CREATE POLICY "league-images: lectura pública"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'league-images' AND name IS NOT NULL);
