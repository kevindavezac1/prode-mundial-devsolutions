-- ============================================================
-- 016_knockout_penalty_fields.sql
-- Agrega soporte para penales en fases eliminatorias.
-- matches.penalty_winner: quién ganó en penales (NULL = no hubo)
-- predictions.predicted_penalty_winner: predicción de penales
-- ============================================================

-- ─── matches ─────────────────────────────────────────────────
ALTER TABLE matches
  ADD COLUMN penalty_winner text
    CHECK (penalty_winner IN ('home', 'away'));

-- ─── predictions ─────────────────────────────────────────────
ALTER TABLE predictions
  ADD COLUMN predicted_penalty_winner text
    CHECK (predicted_penalty_winner IN ('home', 'away'));

-- ─── actualizar column grants (migration 009 los restringió) ─
REVOKE UPDATE ON public.predictions FROM authenticated;
GRANT  UPDATE (home_score, away_score, updated_at, predicted_penalty_winner)
  ON public.predictions TO authenticated;

REVOKE INSERT ON public.predictions FROM authenticated;
GRANT  INSERT (user_id, match_id, home_score, away_score, updated_at, predicted_penalty_winner)
  ON public.predictions TO authenticated;
