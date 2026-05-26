alter table matches add column if not exists api_football_id int;
create index if not exists idx_matches_api_football_id on matches(api_football_id);
