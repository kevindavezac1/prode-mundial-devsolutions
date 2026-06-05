-- ============================================================
-- 012_predictions_updated_at_trigger.sql
-- Remove updated_at from column-level grants on predictions.
-- A BEFORE UPDATE trigger sets it server-side instead.
-- This prevents users from forging timestamps on their predictions.
-- ============================================================

-- ─── TRIGGER: set updated_at server-side ─────────────────────
CREATE OR REPLACE FUNCTION fn_predictions_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_predictions_updated_at
  BEFORE UPDATE ON predictions
  FOR EACH ROW
  EXECUTE FUNCTION fn_predictions_set_updated_at();

-- ─── REVOKE updated_at from authenticated role ───────────────
-- UPDATE grant: home_score + away_score only (updated_at now server-only)
REVOKE UPDATE ON public.predictions FROM authenticated;
GRANT  UPDATE (home_score, away_score) ON public.predictions TO authenticated;

-- INSERT grant: updated_at removed (column default handles it)
REVOKE INSERT ON public.predictions FROM authenticated;
GRANT  INSERT (user_id, match_id, home_score, away_score) ON public.predictions TO authenticated;
