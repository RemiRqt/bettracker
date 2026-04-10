-- Freebets: credits received from promotions
create table public.freebets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null,
  initial_amount numeric not null check (initial_amount > 0),
  remaining_amount numeric not null check (remaining_amount >= 0),
  created_at timestamptz not null default now()
);

create index idx_freebets_user_id on freebets(user_id);

alter table public.freebets enable row level security;

create policy "Users can view their own freebets"
  on freebets for select using (auth.uid() = user_id);
create policy "Users can insert their own freebets"
  on freebets for insert with check (auth.uid() = user_id);
create policy "Users can update their own freebets"
  on freebets for update using (auth.uid() = user_id);
create policy "Users can delete their own freebets"
  on freebets for delete using (auth.uid() = user_id);

-- Freebet bets: standalone bets placed using freebet balance
create table public.freebet_bets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  freebet_id uuid not null references freebets(id) on delete cascade,
  subject text not null,
  odds numeric not null check (odds > 1),
  stake numeric not null check (stake > 0),
  result text check (result in ('gagne', 'perdu')),
  created_at timestamptz not null default now()
);

create index idx_freebet_bets_user_id on freebet_bets(user_id);
create index idx_freebet_bets_freebet_id on freebet_bets(freebet_id);

alter table public.freebet_bets enable row level security;

create policy "Users can view their own freebet bets"
  on freebet_bets for select using (auth.uid() = user_id);
create policy "Users can insert their own freebet bets"
  on freebet_bets for insert with check (auth.uid() = user_id);
create policy "Users can update their own freebet bets"
  on freebet_bets for update using (auth.uid() = user_id);
create policy "Users can delete their own freebet bets"
  on freebet_bets for delete using (auth.uid() = user_id);

-- Add sport column to equipes
alter table public.equipes
  add column sport text not null default 'football'
  check (sport in ('football', 'tennis', 'rugby', 'basket'));
