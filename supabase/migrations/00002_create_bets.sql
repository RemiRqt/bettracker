create table public.bets (
  id uuid primary key default gen_random_uuid(),
  series_id uuid not null references public.series(id) on delete cascade,
  bet_number integer not null,
  odds numeric not null,
  stake numeric not null,
  potential_net numeric not null,
  result text check (result is null or result in ('gagne', 'perdu')),
  created_at timestamptz not null default now()
);

create index idx_bets_series_id on public.bets(series_id);

alter table public.bets enable row level security;

create policy "Users can view bets of their own series"
  on public.bets for select
  using (
    exists (
      select 1 from public.series
      where series.id = bets.series_id
        and series.user_id = auth.uid()
    )
  );

create policy "Users can insert bets into their own series"
  on public.bets for insert
  with check (
    exists (
      select 1 from public.series
      where series.id = bets.series_id
        and series.user_id = auth.uid()
    )
  );

create policy "Users can update bets of their own series"
  on public.bets for update
  using (
    exists (
      select 1 from public.series
      where series.id = bets.series_id
        and series.user_id = auth.uid()
    )
  );
