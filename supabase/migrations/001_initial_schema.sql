-- ============================================================
-- 001_initial_schema.sql — Prode Mundial 2026
-- ============================================================

-- ─── ENUMS ───────────────────────────────────────────────────
create type match_status as enum ('scheduled', 'live', 'finished', 'cancelled');
create type match_phase  as enum ('group', 'round_of_16', 'quarterfinal', 'semifinal', 'third_place', 'final');
create type prediction_outcome as enum ('exact', 'correct', 'incorrect', 'pending');

-- ─── 1. TEAMS ────────────────────────────────────────────────
create table teams (
  id         serial primary key,
  name       text        not null,
  code       char(3)     not null unique,
  flag_url   text,
  group_name char(1)
);

-- ─── 2. MATCHES ──────────────────────────────────────────────
create table matches (
  id                    serial primary key,
  match_number          smallint    not null unique,
  phase                 match_phase not null,
  home_team_id          int         references teams(id),
  away_team_id          int         references teams(id),
  scheduled_at          timestamptz not null,
  venue                 text,
  status                match_status not null default 'scheduled',
  home_score            smallint,
  away_score            smallint,
  result_updated_at     timestamptz,
  result_source         text,
  -- predictions_locked_at = scheduled_at - 5min, computado en queries como: scheduled_at - interval '5 minutes'

  constraint chk_different_teams   check (home_team_id != away_team_id),
  constraint chk_scores_both_or_none check (
    (home_score is null and away_score is null) or
    (home_score >= 0   and away_score >= 0)
  )
);

-- ─── 3. PROFILES ─────────────────────────────────────────────
create table profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  username            text not null unique,
  display_name        text not null,
  avatar_url          text,
  total_points        int      not null default 0,
  exact_predictions   int      not null default 0,
  correct_predictions int      not null default 0,
  total_predictions   int      not null default 0,
  global_rank         int,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint chk_username_format check (
    length(username) between 3 and 30 and
    username ~ '^[a-zA-Z0-9_]+$'
  )
);

-- ─── 4. PREDICTIONS ──────────────────────────────────────────
create table predictions (
  id           bigserial primary key,
  user_id      uuid        not null references profiles(id) on delete cascade,
  match_id     int         not null references matches(id) on delete cascade,
  home_score   smallint    not null,
  away_score   smallint    not null,
  outcome      prediction_outcome not null default 'pending',
  points_earned smallint   not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  unique (user_id, match_id),
  constraint chk_prediction_scores_non_negative check (home_score >= 0 and away_score >= 0),
  constraint chk_prediction_scores_max          check (home_score <= 20 and away_score <= 20)
);

-- ─── 5. LEAGUES ──────────────────────────────────────────────
create table leagues (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  invite_code text        not null unique default upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  owner_id    uuid        not null references profiles(id) on delete cascade,
  max_members smallint    not null default 50,
  is_public   boolean     not null default false,
  created_at  timestamptz not null default now()
);

-- ─── 6. LEAGUE_MEMBERS ───────────────────────────────────────
create table league_members (
  league_id  uuid        not null references leagues(id) on delete cascade,
  user_id    uuid        not null references profiles(id) on delete cascade,
  joined_at  timestamptz not null default now(),

  primary key (league_id, user_id)
);

-- ─── 7. SCORING_RULES ────────────────────────────────────────
create table scoring_rules (
  id          serial primary key,
  outcome     prediction_outcome not null unique,
  points      smallint           not null,
  description text
);

insert into scoring_rules (outcome, points, description) values
  ('exact',     3, 'Resultado exacto (local y visitante)'),
  ('correct',   1, 'Ganador/empate correcto pero marcador incorrecto'),
  ('incorrect', 0, 'Predicción incorrecta'),
  ('pending',   0, 'Partido no jugado todavía');

-- ─── 8. RESULT_AUDIT_LOG ─────────────────────────────────────
create table result_audit_log (
  id             bigserial   primary key,
  match_id       int         not null references matches(id),
  changed_by     uuid        references auth.users(id),
  source         text        not null,
  previous_home  smallint,
  previous_away  smallint,
  new_home       smallint    not null,
  new_away       smallint    not null,
  changed_at     timestamptz not null default now()
);

-- ─── ÍNDICES ─────────────────────────────────────────────────
create index idx_matches_scheduled_at on matches(scheduled_at);
create index idx_matches_status       on matches(status);
create index idx_matches_phase        on matches(phase);

create index idx_predictions_user_id  on predictions(user_id);
create index idx_predictions_match_id on predictions(match_id);
create index idx_predictions_outcome  on predictions(outcome) where outcome != 'pending';

create index idx_leagues_invite_code  on leagues(invite_code);
create index idx_leagues_owner_id     on leagues(owner_id);

create index idx_league_members_user_id on league_members(user_id);

-- ─── TRIGGER: auto-create profile on signup ──────────────────
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  base_username text;
  final_username text;
  suffix        text;
begin
  -- base: display_name sin espacios en minúsculas, o parte del email
  base_username := lower(
    regexp_replace(
      coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
      '[^a-zA-Z0-9_]', '', 'g'
    )
  );

  -- suffix: 4 chars del uuid
  suffix := substring(replace(new.id::text, '-', ''), 1, 4);
  final_username := base_username || suffix;

  -- si username queda vacío o muy corto, usar 'user' + suffix
  if length(base_username) < 1 then
    final_username := 'user' || suffix;
  end if;

  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    final_username,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ─── RLS (Row Level Security) ─────────────────────────────────
alter table profiles      enable row level security;
alter table predictions   enable row level security;
alter table leagues       enable row level security;
alter table league_members enable row level security;
alter table matches       enable row level security;
alter table teams         enable row level security;
alter table scoring_rules enable row level security;
alter table result_audit_log enable row level security;

-- profiles: cada uno ve y edita solo el suyo; todos pueden ver los demás (ranking)
create policy "profiles_select_all"  on profiles for select using (true);
create policy "profiles_update_own"  on profiles for update using (auth.uid() = id);

-- matches y teams: lectura pública
create policy "matches_select_all"   on matches       for select using (true);
create policy "teams_select_all"     on teams         for select using (true);
create policy "scoring_rules_select" on scoring_rules for select using (true);

-- predictions: propias siempre; ajenas solo si partido finished
create policy "predictions_select"     on predictions for select  using (
  auth.uid() = user_id or
  exists (select 1 from matches where matches.id = predictions.match_id and matches.status = 'finished')
);
create policy "predictions_insert_own" on predictions for insert  with check (auth.uid() = user_id);
create policy "predictions_update_own" on predictions for update  using (auth.uid() = user_id);

-- leagues: ver públicas o donde sos miembro
create policy "leagues_select"  on leagues for select using (
  is_public = true or owner_id = auth.uid() or
  exists (select 1 from league_members where league_id = leagues.id and user_id = auth.uid())
);
create policy "leagues_insert"  on leagues for insert  with check (auth.uid() = owner_id);
create policy "leagues_update"  on leagues for update  using (auth.uid() = owner_id);

-- league_members
create policy "league_members_select" on league_members for select using (
  exists (select 1 from league_members lm where lm.league_id = league_members.league_id and lm.user_id = auth.uid())
  or exists (select 1 from leagues l where l.id = league_members.league_id and l.owner_id = auth.uid())
);
create policy "league_members_insert" on league_members for insert with check (auth.uid() = user_id);
create policy "league_members_delete" on league_members for delete using (
  auth.uid() = user_id or
  exists (select 1 from leagues where id = league_members.league_id and owner_id = auth.uid())
);

-- result_audit_log: sin política de select — invisible a todos los usuarios, solo service_role escribe
