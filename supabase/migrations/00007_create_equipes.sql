-- Table equipes: persistent list of team+bet_type combinations
create table public.equipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  bet_type text not null check (bet_type in ('victoire', 'defaite', 'buteur')),
  created_at timestamptz not null default now(),
  unique(user_id, name, bet_type)
);

-- RLS
alter table public.equipes enable row level security;

create policy "Users can view own equipes"
  on equipes for select
  using (auth.uid() = user_id);

create policy "Users can create own equipes"
  on equipes for insert
  with check (auth.uid() = user_id);

create policy "Users can update own equipes"
  on equipes for update
  using (auth.uid() = user_id);

create policy "Users can delete own equipes"
  on equipes for delete
  using (auth.uid() = user_id);

-- Populate from existing series data
insert into equipes (user_id, name, bet_type)
select distinct user_id, subject, bet_type from series
on conflict do nothing;
