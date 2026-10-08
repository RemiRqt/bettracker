-- Planifie la suggestion automatique de résultat : pg_cron appelle la route
-- Next /api/cron/resolve-bets toutes les 15 min (Vercel Hobby = cron quotidien max).
--
-- Prérequis (hors fichier versionné, valeur = CRON_SECRET Vercel) :
--   select vault.create_secret('<CRON_SECRET>', 'resolve_bets_cron_secret');

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule('resolve-bets')
where exists (select 1 from cron.job where jobname = 'resolve-bets');

select cron.schedule(
  'resolve-bets',
  '*/15 * * * *',
  $$
  select net.http_get(
    url := 'https://bettracker-nine.vercel.app/api/cron/resolve-bets',
    headers := jsonb_build_object(
      'Authorization',
      'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'resolve_bets_cron_secret')
    ),
    timeout_milliseconds := 60000
  );
  $$
);
