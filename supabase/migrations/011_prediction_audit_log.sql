-- ============================================================
-- 011_prediction_audit_log.sql
-- Append-only audit trail for prediction changes.
-- Records every INSERT and score-changing UPDATE on predictions.
-- Enables forensic verification for prize claims.
-- ============================================================

-- ─── TABLE ───────────────────────────────────────────────────
CREATE TABLE prediction_audit_log (
  id            bigserial    PRIMARY KEY,
  prediction_id bigint       NOT NULL REFERENCES predictions(id) ON DELETE CASCADE,
  match_id      int          NOT NULL,
  user_id       uuid         NOT NULL,
  old_home      smallint,
  old_away      smallint,
  new_home      smallint     NOT NULL,
  new_away      smallint     NOT NULL,
  changed_at    timestamptz  NOT NULL DEFAULT now()
);

ALTER TABLE prediction_audit_log ENABLE ROW LEVEL SECURITY;

-- Each user can read only their own history
CREATE POLICY "prediction_audit_log_select_own"
  ON prediction_audit_log FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ─── APPEND-ONLY PROTECTION ──────────────────────────────────
CREATE OR REPLACE FUNCTION fn_prediction_audit_readonly()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'prediction_audit_log is append-only: % operation not permitted', TG_OP;
END;
$$;

CREATE TRIGGER trg_prediction_audit_no_delete
  BEFORE DELETE ON prediction_audit_log
  FOR EACH ROW EXECUTE FUNCTION fn_prediction_audit_readonly();

CREATE TRIGGER trg_prediction_audit_no_update
  BEFORE UPDATE ON prediction_audit_log
  FOR EACH ROW EXECUTE FUNCTION fn_prediction_audit_readonly();

-- ─── INSERT TRIGGER FUNCTION (defined before trigger that uses it) ───
CREATE OR REPLACE FUNCTION fn_log_prediction_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO prediction_audit_log
    (prediction_id, match_id, user_id, old_home, old_away, new_home, new_away)
  VALUES
    (NEW.id, NEW.match_id, NEW.user_id,
     NULL, NULL,
     NEW.home_score, NEW.away_score);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_prediction_insert
  AFTER INSERT ON predictions
  FOR EACH ROW
  EXECUTE FUNCTION fn_log_prediction_insert();

-- ─── UPDATE TRIGGER FUNCTION ─────────────────────────────────
CREATE OR REPLACE FUNCTION fn_log_prediction_update()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO prediction_audit_log
    (prediction_id, match_id, user_id, old_home, old_away, new_home, new_away)
  VALUES
    (NEW.id, NEW.match_id, NEW.user_id,
     OLD.home_score, OLD.away_score,
     NEW.home_score, NEW.away_score);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_prediction_update
  AFTER UPDATE ON predictions
  FOR EACH ROW
  WHEN (OLD.home_score IS DISTINCT FROM NEW.home_score
     OR OLD.away_score IS DISTINCT FROM NEW.away_score)
  EXECUTE FUNCTION fn_log_prediction_update();
