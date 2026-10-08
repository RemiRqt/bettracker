-- Onboarding « Nouveautés » : dernière version de l'app vue par l'utilisateur.
alter table public.user_settings
  add column if not exists last_seen_release text;
