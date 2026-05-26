-- Fix infinite recursion in league_members SELECT policy.
-- The original policy queried league_members from within itself,
-- causing Postgres error 42P17. Replaced with a security definer
-- function so the subquery bypasses RLS.

create or replace function is_league_member(p_league_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from league_members
    where league_id = p_league_id
      and user_id = auth.uid()
  );
$$;

drop policy if exists "league_members_select" on league_members;

create policy "league_members_select"
  on league_members for select
  using (
    user_id = auth.uid()
    or is_league_member(league_id)
  );
