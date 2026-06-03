-- ============================================================
-- 008_league_bans_rls.sql
-- Tracks league_bans table (may already exist in production).
-- Adds RLS policies + helper functions for ban/capacity checks
-- in league_members INSERT policy.
-- Safe to run on fresh or already-patched DB (idempotent).
-- ============================================================

-- ─── TABLE: league_bans ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.league_bans (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id  uuid        NOT NULL REFERENCES leagues(id)  ON DELETE CASCADE,
  user_id    uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  banned_by  uuid        REFERENCES profiles(id)          ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (league_id, user_id)
);

ALTER TABLE league_bans ENABLE ROW LEVEL SECURITY;

-- League owner can read the ban list for their leagues.
-- No INSERT/UPDATE/DELETE policies for authenticated users:
-- all writes go through service_role which bypasses RLS.
DROP POLICY IF EXISTS "league_bans_select_owner" ON league_bans;
CREATE POLICY "league_bans_select_owner" ON league_bans
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM leagues
      WHERE leagues.id = league_bans.league_id
        AND leagues.owner_id = auth.uid()
    )
  );

-- ─── HELPER FUNCTIONS ────────────────────────────────────────
-- security definer = runs as postgres, bypasses RLS on subqueries.

CREATE OR REPLACE FUNCTION is_banned_from_league(p_league_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM league_bans
    WHERE league_id = p_league_id
      AND user_id   = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION is_league_full(p_league_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT (
    SELECT COUNT(*) FROM league_members WHERE league_id = p_league_id
  ) >= (
    SELECT max_members FROM leagues WHERE id = p_league_id
  );
$$;

-- ─── league_members INSERT: enforce ban + capacity at DB level ─
DROP POLICY IF EXISTS "league_members_insert" ON league_members;
CREATE POLICY "league_members_insert" ON league_members
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND NOT is_banned_from_league(league_id)
    AND NOT is_league_full(league_id)
  );
