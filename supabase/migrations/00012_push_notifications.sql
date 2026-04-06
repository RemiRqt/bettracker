-- Push subscriptions for Web Push notifications
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  unique(user_id, endpoint)
);

create index idx_push_subscriptions_user_id on push_subscriptions(user_id);

alter table public.push_subscriptions enable row level security;

create policy "Users can view their own subscriptions"
  on push_subscriptions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own subscriptions"
  on push_subscriptions for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own subscriptions"
  on push_subscriptions for delete
  using (auth.uid() = user_id);

-- User notification preferences
create table public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  notifications_enabled boolean not null default false,
  notification_lead_minutes integer not null default 60 check (notification_lead_minutes between 5 and 1440),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_settings enable row level security;

create policy "Users can view their own settings"
  on user_settings for select
  using (auth.uid() = user_id);

create policy "Users can insert their own settings"
  on user_settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own settings"
  on user_settings for update
  using (auth.uid() = user_id);

-- Track which fixtures have already been notified about (avoid duplicates)
create table public.sent_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  fixture_id integer not null,
  sent_at timestamptz not null default now(),
  unique(user_id, fixture_id)
);

create index idx_sent_notifications_sent_at on sent_notifications(sent_at);

alter table public.sent_notifications enable row level security;

create policy "Users can view their own sent notifications"
  on sent_notifications for select
  using (auth.uid() = user_id);
