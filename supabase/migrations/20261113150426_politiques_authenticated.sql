-- Politiques de BetTracker réservées au rôle authenticated, aucun droit pour anon.
--
-- Constat (audit du 2026-11-13) : les politiques « mes lignes » visaient le rôle public (anon compris)
-- et anon gardait les droits par défaut (insert, update, delete) sur toutes les tables. Pas de fuite :
-- auth.uid() est nul pour anon, donc aucune ligne ne passe. On retire quand même ces droits inutiles.
-- Les politiques UPDATE sans WITH CHECK reçoivent explicitement la même condition que USING.
-- Les tables d'autres projets encore dans public (ark-tribe, tahitrip) ne sont pas concernées.

begin;

do $$
declare
  tables text[] := array['bets', 'equipes', 'freebet_bets', 'freebets', 'logo_cache', 'odds_cache', 'push_subscriptions',
    'sent_notifications', 'series', 'subject_links', 'team_mappings', 'transactions', 'user_settings'];
  t text;
  p record;
begin
  foreach t in array tables loop
    execute format('revoke all on public.%I from anon', t);
    for p in select policyname, cmd, qual, with_check from pg_policies where schemaname = 'public' and tablename = t loop
      execute format('alter policy %I on public.%I to authenticated', p.policyname, t);
      if p.cmd = 'UPDATE' and p.with_check is null then
        execute format('alter policy %I on public.%I with check (%s)', p.policyname, t, p.qual);
      end if;
    end loop;
  end loop;
end $$;

commit;
