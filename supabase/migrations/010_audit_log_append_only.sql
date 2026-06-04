-- ============================================================
-- 010_audit_log_append_only.sql
-- Makes result_audit_log immutable: blocks DELETE and UPDATE
-- for ALL roles including service_role.
-- Triggers fire before the operation regardless of role.
-- ============================================================

CREATE OR REPLACE FUNCTION fn_audit_log_readonly()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION
    'result_audit_log is append-only: % operation not permitted', TG_OP;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_log_no_delete ON result_audit_log;
CREATE TRIGGER trg_audit_log_no_delete
  BEFORE DELETE ON result_audit_log
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log_readonly();

DROP TRIGGER IF EXISTS trg_audit_log_no_update ON result_audit_log;
CREATE TRIGGER trg_audit_log_no_update
  BEFORE UPDATE ON result_audit_log
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log_readonly();
