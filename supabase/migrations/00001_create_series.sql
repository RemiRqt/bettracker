create table public.series (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null,
  bet_type text not null check (bet_type in ('victoire', 'defaite', 'buteur')),
  target_gain numeric not null,
  status text not null default 'en_cours' check (status in ('en_cours', 'gagnee', 'abandonnee')),
  created_at timestamptz not null default now()
);

alter table public.series enable row level security;

create policy "Users can view their own series"
  on public.series for select
  using (auth.uid() = user_id);

create policy "Users can insert their own series"
  on public.series for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own series"
  on public.series for update
  using (auth.uid() = user_id);
