-- Cotes du marché (The Odds API) : stockées sur le pari à la création,
-- bookmakers choisis par user, cache par championnat (service role only).

alter table public.bets
  add column if not exists market_odds_best   numeric,
  add column if not exists market_odds_avg    numeric,
  add column if not exists market_odds_detail jsonb;

comment on column public.bets.market_odds_best   is 'Meilleure cote marché (bookmakers cochés) pour l''issue pariée, à la création';
comment on column public.bets.market_odds_avg    is 'Moyenne des cotes marché (bookmakers cochés), à la création';
comment on column public.bets.market_odds_detail is 'Cotes par bookmaker, ex. {"winamax_fr": 2.15}';

alter table public.user_settings
  add column if not exists bookmakers text[] not null
    default '{winamax_fr,betclic_fr,unibet_fr,pmu_fr,netbet_fr}';

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'user_settings_bookmakers_valid') then
    alter table public.user_settings add constraint user_settings_bookmakers_valid check (
      cardinality(bookmakers) > 0
      and bookmakers <@ '{winamax_fr,betclic_fr,unibet_fr,pmu_fr,netbet_fr}'::text[]
    );
  end if;
end $$;

create table if not exists public.odds_cache (
  sport_key          text primary key,
  events             jsonb not null,
  fetched_at         timestamptz not null,
  requests_remaining integer
);

alter table public.odds_cache enable row level security;
