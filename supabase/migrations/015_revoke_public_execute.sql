-- ============================================================
-- REVOKE FROM PUBLIC — no desde roles específicos.
-- Postgres otorga EXECUTE TO PUBLIC por defecto al crear
-- funciones. REVOKE FROM anon/authenticated no elimina
-- ese grant base — hay que revocar de PUBLIC directamente.
-- ============================================================

-- Trigger functions: no re-grant. Postgres ejecuta triggers
-- como owner del objeto, sin verificar permisos del caller.
REVOKE EXECUTE ON FUNCTION public.fn_log_prediction_insert() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fn_log_prediction_update() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;

-- Helper functions usadas en RLS: revoke PUBLIC, re-grant selectivo.
REVOKE EXECUTE ON FUNCTION public.is_banned_from_league(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_league_full(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_league_member(uuid) FROM PUBLIC;

-- is_banned + is_league_full: solo en INSERT WITH CHECK de
-- league_members — nunca se evalúa para anon (anon no puede INSERT).
GRANT EXECUTE ON FUNCTION public.is_banned_from_league(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_league_full(uuid) TO authenticated;

-- is_league_member: está en SELECT USING de league_members,
-- que aplica a todos los roles incluyendo anon. Si anon no tiene
-- EXECUTE y consulta la tabla, Postgres lanza error en vez de
-- devolver vacío. Grant a anon mantiene comportamiento original.
GRANT EXECUTE ON FUNCTION public.is_league_member(uuid) TO authenticated, anon;
