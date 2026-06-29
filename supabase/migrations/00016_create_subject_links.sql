create table if not exists subject_links (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  subject         text not null,
  team_mapping_id uuid not null references team_mappings(id) on delete cascade,
  created_at      timestamptz not null default now()
);

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'subject_links_unique') then
    alter table subject_links add constraint subject_links_unique
      unique (user_id, subject, team_mapping_id);
  end if;
end $$;

create index if not exists idx_subject_links_user_subject on subject_links(user_id, subject);

alter table subject_links enable row level security;

drop policy if exists "subject_links_select" on subject_links;
create policy "subject_links_select" on subject_links for select using (auth.uid() = user_id);
drop policy if exists "subject_links_insert" on subject_links;
create policy "subject_links_insert" on subject_links for insert with check (auth.uid() = user_id);
drop policy if exists "subject_links_delete" on subject_links;
create policy "subject_links_delete" on subject_links for delete using (auth.uid() = user_id);
