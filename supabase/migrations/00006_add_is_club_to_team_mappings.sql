-- Add is_club flag to distinguish API club records from series subject records
alter table public.team_mappings
  add column if not exists is_club boolean not null default false;

-- Drop old unique constraint and create new one including is_club
alter table public.team_mappings
  drop constraint if exists team_mappings_user_id_subject_key;

alter table public.team_mappings
  add constraint team_mappings_user_id_subject_is_club_key unique (user_id, subject, is_club);
