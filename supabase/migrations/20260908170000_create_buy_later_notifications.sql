begin;

alter table public.buy_later_items
  add constraint buy_later_items_user_id_id_key unique (user_id, id);

create table public.buy_later_notification_preferences (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  push_enabled boolean not null default false,
  timezone text not null,
  include_item_name boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint buy_later_notification_preferences_timezone_valid check (
    timezone = btrim(timezone)
    and char_length(timezone) between 1 and 64
    and timezone ~ '^(UTC|[A-Za-z_]+(/[A-Za-z0-9_+\-]+)+)$'
  )
);

create table public.buy_later_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  expiration_time timestamptz,
  active boolean not null default true,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint buy_later_push_subscriptions_endpoint_valid check (
    endpoint = btrim(endpoint)
    and char_length(endpoint) between 8 and 2048
    and endpoint ~ '^https://'
  ),
  constraint buy_later_push_subscriptions_p256dh_valid check (
    p256dh = btrim(p256dh) and char_length(p256dh) between 1 and 512
  ),
  constraint buy_later_push_subscriptions_auth_valid check (
    auth = btrim(auth) and char_length(auth) between 1 and 256
  ),
  constraint buy_later_push_subscriptions_active_valid check (
    (active and revoked_at is null) or (not active and revoked_at is not null)
  ),
  constraint buy_later_push_subscriptions_endpoint_key unique (endpoint),
  constraint buy_later_push_subscriptions_user_id_id_key unique (user_id, id)
);

create table public.buy_later_reminder_deliveries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  item_id uuid not null,
  subscription_id uuid not null,
  reconsider_at date not null,
  channel text not null default 'web_push',
  state text not null default 'claimed',
  attempted_at timestamptz,
  sent_at timestamptz,
  failed_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint buy_later_reminder_deliveries_channel_valid check (channel = 'web_push'),
  constraint buy_later_reminder_deliveries_state_valid check (
    (state = 'claimed' and attempted_at is null and sent_at is null and failed_at is null and revoked_at is null)
    or (state = 'sent' and attempted_at is not null and sent_at is not null and failed_at is null and revoked_at is null)
    or (state = 'failed' and attempted_at is not null and sent_at is null and failed_at is not null and revoked_at is null)
    or (state = 'revoked' and attempted_at is not null and sent_at is null and failed_at is null and revoked_at is not null)
  ),
  constraint buy_later_reminder_deliveries_user_item_fkey
    foreign key (user_id, item_id)
    references public.buy_later_items (user_id, id) on delete cascade,
  constraint buy_later_reminder_deliveries_user_subscription_fkey
    foreign key (user_id, subscription_id)
    references public.buy_later_push_subscriptions (user_id, id) on delete cascade,
  constraint buy_later_reminder_deliveries_identity_key
    unique (item_id, reconsider_at, subscription_id, channel)
);

create index buy_later_notification_preferences_enabled_timezone_idx
  on public.buy_later_notification_preferences (timezone)
  where push_enabled;

create index buy_later_push_subscriptions_active_user_idx
  on public.buy_later_push_subscriptions (user_id, id)
  where active;

create index buy_later_items_notification_due_idx
  on public.buy_later_items (reconsider_at, user_id)
  where status = 'considering';

create index buy_later_reminder_deliveries_claimed_idx
  on public.buy_later_reminder_deliveries (state, created_at)
  where state = 'claimed';

create trigger set_buy_later_notification_preferences_updated_at
before update on public.buy_later_notification_preferences
for each row execute function public.set_buy_later_updated_at();

create trigger set_buy_later_push_subscriptions_updated_at
before update on public.buy_later_push_subscriptions
for each row execute function public.set_buy_later_updated_at();

create trigger set_buy_later_reminder_deliveries_updated_at
before update on public.buy_later_reminder_deliveries
for each row execute function public.set_buy_later_updated_at();

alter table public.buy_later_notification_preferences enable row level security;
alter table public.buy_later_push_subscriptions enable row level security;
alter table public.buy_later_reminder_deliveries enable row level security;

revoke all on table public.buy_later_notification_preferences from public, anon, authenticated;
grant select, insert, update, delete on table public.buy_later_notification_preferences to authenticated;

create policy "Users can read their Buy Later notification preferences"
on public.buy_later_notification_preferences for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their Buy Later notification preferences"
on public.buy_later_notification_preferences for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their Buy Later notification preferences"
on public.buy_later_notification_preferences for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their Buy Later notification preferences"
on public.buy_later_notification_preferences for delete
to authenticated
using ((select auth.uid()) = user_id);

revoke all on table public.buy_later_push_subscriptions from public, anon, authenticated;
grant insert, update, delete on table public.buy_later_push_subscriptions to authenticated;

create policy "Users can create their Buy Later push subscriptions"
on public.buy_later_push_subscriptions for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their Buy Later push subscriptions"
on public.buy_later_push_subscriptions for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their Buy Later push subscriptions"
on public.buy_later_push_subscriptions for delete
to authenticated
using ((select auth.uid()) = user_id);

revoke all on table public.buy_later_reminder_deliveries from public, anon, authenticated;

commit;
