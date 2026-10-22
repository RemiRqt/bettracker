-- Allègement de la base partagée (2026-10-22) : résolution des paris toutes les 30 min,
-- de 17h à 23h30 heure de Paris en hiver (pg_cron est en UTC : 16h-22h30 UTC ;
-- en été, la plage glisse à 18h-0h30).
select cron.alter_job(jobid, schedule := '*/30 16-22 * * *') from cron.job where jobname = 'resolve-bets';
