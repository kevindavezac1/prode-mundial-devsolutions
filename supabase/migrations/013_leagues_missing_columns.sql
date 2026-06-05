-- ============================================================
-- 013_leagues_missing_columns.sql
-- Documenta columnas que existen en producción pero no estaban
-- en migraciones anteriores. Idempotente (IF NOT EXISTS).
-- ============================================================

ALTER TABLE leagues
  ADD COLUMN IF NOT EXISTS allow_member_invite boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS image_url text;

-- Storage bucket "league-images" existe en producción.
-- No se recrea aquí — los buckets se gestionan fuera de migraciones SQL.
