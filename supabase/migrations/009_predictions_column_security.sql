-- ============================================================
-- 009_predictions_column_security.sql
-- Restrict updatable/insertable columns on predictions table.
-- Mirrors the same pattern applied to profiles in 007.
-- Prevents direct PostgREST manipulation of outcome/points_earned.
-- calculate_match_points is SECURITY DEFINER (runs as postgres) — unaffected.
-- ============================================================

REVOKE UPDATE ON public.predictions FROM authenticated;
GRANT  UPDATE (home_score, away_score, updated_at) ON public.predictions TO authenticated;

REVOKE INSERT ON public.predictions FROM authenticated;
GRANT  INSERT (user_id, match_id, home_score, away_score, updated_at) ON public.predictions TO authenticated;
