begin;

create or replace function public.claim_buy_later_due_reminders(
  run_at timestamptz,
  rollout_date date,
  max_users integer,
  max_items_per_user integer,
  max_pushes integer
)
returns table (
  delivery_id uuid,
  user_id uuid,
  item_id uuid,
  item_name text,
  reconsider_at date,
  subscription_id uuid,
  endpoint text,
  p256dh text,
  auth text,
  include_item_name boolean
)
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if run_at is null or rollout_date is null
    or max_users not between 1 and 1000
    or max_items_per_user not between 1 and 10
    or max_pushes not between 1 and 250 then
    raise exception 'Invalid Buy Later reminder claim bounds.';
  end if;

  return query
  with enabled_preferences as (
    select
      preference.user_id,
      preference.include_item_name,
      (run_at at time zone preference.timezone)::date as local_date
    from public.buy_later_notification_preferences as preference
    join pg_catalog.pg_timezone_names as zone on zone.name = preference.timezone
    where preference.push_enabled
      and extract(hour from run_at at time zone preference.timezone) >= 9
    order by preference.user_id
    limit max_users
  ), eligible_items as (
    select
      preference.user_id,
      preference.include_item_name,
      item.id as item_id,
      item.name as item_name,
      item.reconsider_at
    from enabled_preferences as preference
    cross join lateral (
      select candidate.id, candidate.name, candidate.reconsider_at
      from public.buy_later_items as candidate
      where candidate.user_id = preference.user_id
        and candidate.status = 'considering'
        and candidate.reconsider_at <= preference.local_date
        and candidate.reconsider_at >= rollout_date
      order by candidate.reconsider_at, candidate.created_at
    ) as item
  ), available_subscriptions as (
    select
      item.user_id,
      item.include_item_name,
      item.item_id,
      item.item_name,
      item.reconsider_at,
      subscription.id as subscription_id,
      subscription.endpoint,
      subscription.p256dh,
      subscription.auth
    from eligible_items as item
    join public.buy_later_push_subscriptions as subscription
      on subscription.user_id = item.user_id
      and subscription.active
      and (subscription.expiration_time is null or subscription.expiration_time > run_at)
    where not exists (
      select 1
      from public.buy_later_reminder_deliveries as existing_delivery
      where existing_delivery.item_id = item.item_id
        and existing_delivery.reconsider_at = item.reconsider_at
        and existing_delivery.subscription_id = subscription.id
        and existing_delivery.channel = 'web_push'
    )
  ), ranked_subscriptions as (
    select
      candidate.*,
      dense_rank() over (
        partition by candidate.user_id
        order by candidate.reconsider_at, candidate.item_id
      ) as item_rank
    from available_subscriptions as candidate
  ), eligible_subscriptions as (
    select ranked.*
    from ranked_subscriptions as ranked
    where ranked.item_rank <= max_items_per_user
    order by ranked.user_id, ranked.reconsider_at, ranked.item_id, ranked.subscription_id
    limit max_pushes
  ), claimed as (
    insert into public.buy_later_reminder_deliveries as delivery (
      user_id, item_id, subscription_id, reconsider_at, channel, state
    )
    select candidate.user_id, candidate.item_id, candidate.subscription_id, candidate.reconsider_at, 'web_push', 'claimed'
    from eligible_subscriptions as candidate
    on conflict (item_id, reconsider_at, subscription_id, channel) do nothing
    returning delivery.id, delivery.user_id, delivery.item_id, delivery.reconsider_at, delivery.subscription_id
  )
  select
    claimed.id,
    candidate.user_id,
    candidate.item_id,
    candidate.item_name,
    candidate.reconsider_at,
    candidate.subscription_id,
    candidate.endpoint,
    candidate.p256dh,
    candidate.auth,
    candidate.include_item_name
  from claimed
  join eligible_subscriptions as candidate
    on candidate.user_id = claimed.user_id
    and candidate.item_id = claimed.item_id
    and candidate.reconsider_at = claimed.reconsider_at
    and candidate.subscription_id = claimed.subscription_id;
end;
$$;

revoke all on function public.claim_buy_later_due_reminders(timestamptz, date, integer, integer, integer)
from public, anon, authenticated;
grant execute on function public.claim_buy_later_due_reminders(timestamptz, date, integer, integer, integer)
to service_role;

commit;
