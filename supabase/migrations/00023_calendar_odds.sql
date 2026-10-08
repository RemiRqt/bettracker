-- Cotes dans le Calendrier : lecture du cache des cotes pour les users connectés
-- (données publiques de marché) + rafraîchissement quotidien à 12h Paris.

drop policy if exists "odds_cache_select" on public.odds_cache;
create policy "odds_cache_select" on public.odds_cache
  for select to authenticated using (true);

-- pg_cron est en UTC : 10h et 11h UTC, la route ne s'exécute qu'à 12h heure de Paris.
select cron.unschedule('calendar-odds')
where exists (select 1 from cron.job where jobname = 'calendar-odds');

select cron.schedule(
  'calendar-odds',
  '0 10,11 * * *',
  $$
  select net.http_get(
    url := 'https://bettracker-nine.vercel.app/api/cron/calendar-odds',
    headers := jsonb_build_object(
      'Authorization',
      'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'resolve_bets_cron_secret')
    ),
    timeout_milliseconds := 60000
  );
  $$
);
