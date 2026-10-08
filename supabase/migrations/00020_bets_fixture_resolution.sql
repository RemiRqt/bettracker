-- Suggestion automatique du résultat : rattachement pari ↔ match football-data
-- + état de la résolution + toggle de notif dédié.

alter table public.bets
  add column if not exists fixture_id        integer,
  add column if not exists fixture_kickoff   timestamptz,
  add column if not exists suggested_result  text
    check (suggested_result is null or suggested_result in ('gagne','perdu')),
  add column if not exists fixture_score     text,
  add column if not exists resolution_status text
    check (resolution_status is null or resolution_status in ('pending','suggested','postponed','expired','manual'));

comment on column public.bets.fixture_id        is 'ID match football-data.org';
comment on column public.bets.fixture_kickoff   is 'Coup d''envoi du match (UTC)';
comment on column public.bets.suggested_result  is 'Résultat proposé par le cron, en attente de confirmation';
comment on column public.bets.fixture_score     is 'Score final domicile-extérieur, ex. 2-1';
comment on column public.bets.resolution_status is 'null = pari antérieur | pending | suggested | postponed | expired | manual';

create index if not exists idx_bets_pending_fixture
  on public.bets(fixture_kickoff)
  where result is null and resolution_status = 'pending';

alter table public.user_settings
  add column if not exists result_notifications_enabled boolean not null default true;
