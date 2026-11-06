-- Audit perf 2026-11-06 (docs/audits/2026-11-06-a11y-perf.md).
-- 1. RLS : `auth.uid()` nu est réévalué pour CHAQUE ligne lue. Enveloppé dans
--    `(select auth.uid())`, Postgres le calcule une fois par requête (initPlan).
--    Même sémantique, aucun changement de droits. Réécriture en place (ALTER POLICY)
--    à partir des policies réelles en base : robuste si la prod a dérivé des migrations.
--    Limité aux tables de bettracker (la base est partagée avec d'autres apps).
-- 2. Index composite pour les filtres « séries en cours d'un user » (dashboard, calendrier).
-- 3. Index user_id manquant sur equipes.
-- Idempotent : rejouable sans effet.

do $$
declare
  p record;
  new_qual text;
  new_check text;
  sql text;
begin
  for p in
    select tablename, policyname, qual, with_check
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'series', 'bets', 'transactions', 'team_mappings', 'equipes',
        'freebets', 'freebet_bets', 'push_subscriptions', 'user_settings',
        'sent_notifications', 'subject_links'
      )
      and (
        (qual ilike '%auth.uid()%' and qual not ilike '%select auth.uid()%')
        or (with_check ilike '%auth.uid()%' and with_check not ilike '%select auth.uid()%')
      )
  loop
    new_qual := case
      when p.qual is not null and p.qual not ilike '%select auth.uid()%'
        then replace(p.qual, 'auth.uid()', '(select auth.uid())')
      else p.qual
    end;
    new_check := case
      when p.with_check is not null and p.with_check not ilike '%select auth.uid()%'
        then replace(p.with_check, 'auth.uid()', '(select auth.uid())')
      else p.with_check
    end;

    sql := format('alter policy %I on public.%I', p.policyname, p.tablename);
    if new_qual is not null then
      sql := sql || format(' using (%s)', new_qual);
    end if;
    if new_check is not null then
      sql := sql || format(' with check (%s)', new_check);
    end if;

    raise notice '%', sql;
    execute sql;
  end loop;
end
$$;

create index if not exists idx_series_user_status on public.series (user_id, status);
create index if not exists idx_equipes_user_id on public.equipes (user_id);

-- Vérification (doit renvoyer 0 ligne) :
-- select tablename, policyname, qual, with_check from pg_policies
-- where schemaname = 'public'
--   and (qual ~* 'auth\.uid\(\)' and qual !~* 'select auth\.uid\(\)'
--     or with_check ~* 'auth\.uid\(\)' and with_check !~* 'select auth\.uid\(\)');
