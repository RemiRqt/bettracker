alter table public.team_mappings
  add column if not exists cached_fixtures jsonb,
  add column if not exists fixtures_updated_at timestamptz;
