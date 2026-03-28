create table public.team_mappings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null,
  api_team_id integer,
  logo_url text,
  sport text not null default 'football',
  is_followed boolean not null default false,
  next_matches_count integer not null default 2,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, subject)
);

alter table public.team_mappings enable row level security;

create policy "Users can view their own team mappings"
  on public.team_mappings for select
  using (auth.uid() = user_id);

create policy "Users can insert their own team mappings"
  on public.team_mappings for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own team mappings"
  on public.team_mappings for update
  using (auth.uid() = user_id);

create policy "Users can delete their own team mappings"
  on public.team_mappings for delete
  using (auth.uid() = user_id);
