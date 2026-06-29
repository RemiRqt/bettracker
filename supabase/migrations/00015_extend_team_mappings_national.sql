-- Colonnes déjà appliquées en prod via dashboard ; versionnées en idempotent.
alter table team_mappings add column if not exists provider text not null default 'football-data';
alter table team_mappings add column if not exists kind text not null default 'club';
alter table team_mappings add column if not exists country text;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'team_mappings_provider_check') then
    alter table team_mappings add constraint team_mappings_provider_check
      check (provider in ('football-data','api-sports'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'team_mappings_kind_check') then
    alter table team_mappings add constraint team_mappings_kind_check
      check (kind in ('club','national'));
  end if;
end $$;
