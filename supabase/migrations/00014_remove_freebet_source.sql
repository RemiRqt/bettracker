-- Make source optional (keep column for existing data but no longer required)
alter table public.freebets alter column source set default '';
alter table public.freebets alter column source drop not null;
