-- Backfill any missing equipes from existing series
-- (handles series created after migration 00007 without auto-creating an equipe)
insert into equipes (user_id, name, bet_type)
select distinct user_id, subject, bet_type from series
on conflict (user_id, name, bet_type) do nothing;
