begin;

create function public.enable_buy_later_push_reminders(
  preference_timezone text,
  preference_include_item_name boolean,
  subscription_endpoint text,
  subscription_p256dh text,
  subscription_auth text,
  subscription_expiration_time timestamptz default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  subscription_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  insert into public.buy_later_push_subscriptions (
    user_id, endpoint, p256dh, auth, expiration_time, active, revoked_at
  ) values (
    current_user_id, subscription_endpoint, subscription_p256dh, subscription_auth,
    subscription_expiration_time, true, null
  )
  on conflict (endpoint) do update set
    p256dh = excluded.p256dh,
    auth = excluded.auth,
    expiration_time = excluded.expiration_time,
    active = true,
    revoked_at = null
  where public.buy_later_push_subscriptions.user_id = current_user_id
  returning id into subscription_id;

  if subscription_id is null then
    return 'endpoint_conflict';
  end if;

  insert into public.buy_later_notification_preferences (
    user_id, push_enabled, timezone, include_item_name
  ) values (
    current_user_id, true, preference_timezone, preference_include_item_name
  )
  on conflict (user_id) do update set
    push_enabled = true,
    timezone = excluded.timezone,
    include_item_name = excluded.include_item_name;

  return 'enabled';
end;
$$;

create function public.disable_buy_later_push_reminders(subscription_endpoint text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  if subscription_endpoint is not null then
    delete from public.buy_later_push_subscriptions
    where user_id = current_user_id and endpoint = subscription_endpoint;
  end if;

  update public.buy_later_push_subscriptions
  set active = false, revoked_at = now()
  where user_id = current_user_id and active;

  update public.buy_later_notification_preferences
  set push_enabled = false
  where user_id = current_user_id;
end;
$$;

revoke all on function public.enable_buy_later_push_reminders(text, boolean, text, text, text, timestamptz) from public, anon, authenticated;
revoke all on function public.disable_buy_later_push_reminders(text) from public, anon, authenticated;
grant execute on function public.enable_buy_later_push_reminders(text, boolean, text, text, text, timestamptz) to authenticated;
grant execute on function public.disable_buy_later_push_reminders(text) to authenticated;

commit;
