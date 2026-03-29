-- Persistent logo cache: shared across all users, never expires
-- Stores base64 data URIs for team and tournament logos
create table public.logo_cache (
  key text primary key,  -- e.g. "team:1644" or "tournament:34"
  data_uri text not null,
  created_at timestamptz not null default now()
);

-- No RLS: logos are public data, read by server actions only
alter table public.logo_cache enable row level security;

create policy "Anyone can read logos"
  on logo_cache for select
  using (true);

create policy "Anyone can insert logos"
  on logo_cache for insert
  with check (true);
