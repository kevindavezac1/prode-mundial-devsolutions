-- ============================================================
-- 017_calculate_match_points_penalties.sql
-- Rewrite de calculate_match_points con soporte para penales.
--
-- Lógica de puntos:
--   Partido terminado en 90' (penalty_winner IS NULL):
--     exact=300, correct=100, incorrect=0
--
--   Partido terminado en penales (penalty_winner IN ('home','away')):
--     Predicción con ganador directo (home_score != away_score) → 0
--     Predicción con empate:
--       score exacto + acertó penales  → 400
--       score exacto + erró penales    → 300
--       score correcto + acertó penales → 200
--       score correcto + erró penales  → 100
-- ============================================================

CREATE OR REPLACE FUNCTION calculate_match_points(p_match_id int)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_home_score     smallint;
  v_away_score     smallint;
  v_penalty_winner text;
  v_actual_dir     text;
  v_pred           record;
  v_pred_dir       text;
  v_new_outcome    text;
  v_new_points     smallint;
  v_count          int := 0;
BEGIN
  SELECT home_score, away_score, penalty_winner
    INTO v_home_score, v_away_score, v_penalty_winner
    FROM matches
   WHERE id = p_match_id;

  IF v_home_score IS NULL THEN
    RAISE EXCEPTION 'Match % has no result', p_match_id;
  END IF;

  -- Dirección real a 90' (usado en rama sin penales)
  IF    v_home_score > v_away_score THEN v_actual_dir := 'home';
  ELSIF v_home_score < v_away_score THEN v_actual_dir := 'away';
  ELSE  v_actual_dir := 'draw';
  END IF;

  FOR v_pred IN
    SELECT id, user_id, home_score, away_score,
           predicted_penalty_winner, outcome, points_earned
      FROM predictions
     WHERE match_id = p_match_id
  LOOP
    IF v_penalty_winner IS NOT NULL THEN
      -- ── Partido fue a penales ──────────────────────────────
      -- FT siempre es empate; predijo ganador directo → incorrecto
      IF v_pred.home_score != v_pred.away_score THEN
        v_new_outcome := 'incorrect';
        v_new_points  := 0;
      ELSE
        -- Predijo empate: calcular base + bonus penales
        IF v_pred.home_score = v_home_score AND v_pred.away_score = v_away_score THEN
          v_new_points := 300;  -- score exacto
          v_new_outcome := 'exact';
        ELSE
          v_new_points := 100;  -- empate distinto
          v_new_outcome := 'correct';
        END IF;

        IF v_pred.predicted_penalty_winner = v_penalty_winner THEN
          v_new_points := v_new_points + 100;  -- bonus penales
        END IF;
      END IF;

    ELSE
      -- ── Partido terminado en 90' ───────────────────────────
      IF    v_pred.home_score > v_pred.away_score THEN v_pred_dir := 'home';
      ELSIF v_pred.home_score < v_pred.away_score THEN v_pred_dir := 'away';
      ELSE  v_pred_dir := 'draw';
      END IF;

      IF v_pred.home_score = v_home_score AND v_pred.away_score = v_away_score THEN
        v_new_outcome := 'exact';     v_new_points := 300;
      ELSIF v_pred_dir = v_actual_dir THEN
        v_new_outcome := 'correct';   v_new_points := 100;
      ELSE
        v_new_outcome := 'incorrect'; v_new_points := 0;
      END IF;
    END IF;

    -- Revertir stats previos antes de aplicar nuevo resultado
    IF v_pred.outcome != 'pending' THEN
      UPDATE profiles SET
        total_points        = total_points        - v_pred.points_earned,
        exact_predictions   = exact_predictions   - CASE WHEN v_pred.outcome = 'exact'              THEN 1 ELSE 0 END,
        correct_predictions = correct_predictions - CASE WHEN v_pred.outcome IN ('exact','correct') THEN 1 ELSE 0 END,
        total_predictions   = total_predictions   - 1,
        updated_at = now()
      WHERE id = v_pred.user_id;
    END IF;

    UPDATE predictions SET
      outcome       = v_new_outcome::prediction_outcome,
      points_earned = v_new_points,
      updated_at    = now()
    WHERE id = v_pred.id;

    UPDATE profiles SET
      total_points        = total_points        + v_new_points,
      exact_predictions   = exact_predictions   + CASE WHEN v_new_outcome = 'exact'              THEN 1 ELSE 0 END,
      correct_predictions = correct_predictions + CASE WHEN v_new_outcome IN ('exact','correct') THEN 1 ELSE 0 END,
      total_predictions   = total_predictions   + 1,
      updated_at = now()
    WHERE id = v_pred.user_id;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;
