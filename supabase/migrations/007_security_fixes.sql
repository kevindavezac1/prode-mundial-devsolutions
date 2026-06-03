-- ============================================================
-- 007_security_fixes.sql
-- Persists security fixes previously applied directly to Supabase.
-- Safe to run on a fresh DB or an already-patched DB (idempotent).
-- ============================================================

-- ─── FIX 1: Enforce prediction lock at RLS level ─────────────
-- Prevents bypass via direct PostgREST calls after match lock time.

drop policy if exists "predictions_insert_own" on predictions;
drop policy if exists "predictions_update_own" on predictions;

create policy "predictions_insert_own" on predictions
  for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from matches
      where matches.id = match_id
        and matches.status = 'scheduled'
        and matches.scheduled_at - interval '5 minutes' > now()
    )
  );

create policy "predictions_update_own" on predictions
  for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from matches
      where matches.id = predictions.match_id
        and matches.status = 'scheduled'
        and matches.scheduled_at - interval '5 minutes' > now()
    )
  );

-- ─── FIX 2: Restrict updatable columns on profiles ───────────
-- Prevents authenticated users from directly modifying points/stats
-- via PostgREST. Security definer functions (triggers, scoring) are
-- unaffected as they run as postgres and bypass column-level grants.

revoke update on public.profiles from authenticated;
grant  update (username, display_name, avatar_url, updated_at) on public.profiles to authenticated;

-- ─── FIX 3: Restrict calculate_match_points execution ────────
-- Prevents authenticated/anon users from calling this security definer
-- function via RPC. Only service_role (admin + cron) needs it.

revoke execute on function public.calculate_match_points(int) from public;
grant  execute on function public.calculate_match_points(int) to service_role;
