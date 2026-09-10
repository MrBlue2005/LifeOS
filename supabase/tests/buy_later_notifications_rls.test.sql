begin;

select plan(14);

select tests.rls_enabled('public', 'buy_later_notification_preferences');
select tests.rls_enabled('public', 'buy_later_push_subscriptions');
select tests.rls_enabled('public', 'buy_later_reminder_deliveries');
select ok(
  not has_table_privilege('anon', 'public.buy_later_notification_preferences', 'select')
  and not has_table_privilege('anon', 'public.buy_later_push_subscriptions', 'select')
  and not has_table_privilege('anon', 'public.buy_later_reminder_deliveries', 'select'),
  'anonymous requests hold no notification-table read privileges'
);
select ok(
  not has_function_privilege('anon', 'public.claim_buy_later_due_reminders(timestamp with time zone, date, integer, integer, integer)', 'execute')
  and not has_function_privilege('authenticated', 'public.claim_buy_later_due_reminders(timestamp with time zone, date, integer, integer, integer)', 'execute')
  and has_function_privilege('service_role', 'public.claim_buy_later_due_reminders(timestamp with time zone, date, integer, integer, integer)', 'execute'),
  'only service_role can claim automatic reminder deliveries'
);

select tests.create_supabase_user('buy_later_notification_owner');
select tests.create_supabase_user('buy_later_notification_other');
select tests.authenticate_as('buy_later_notification_owner');

select lives_ok(
  $$ insert into public.buy_later_notification_preferences (timezone)
     values ('Europe/Bucharest') $$,
  'an authenticated user can create owned notification preferences'
);
select results_eq(
  $$ select push_enabled, include_item_name
     from public.buy_later_notification_preferences $$,
  $$ values (false, false) $$,
  'notification preferences default to disabled and private wording'
);
select lives_ok(
  $$ insert into public.buy_later_push_subscriptions (endpoint, p256dh, auth)
     values ('https://push.example/subscription-one', 'key-one', 'auth-one'),
            ('https://push.example/subscription-two', 'key-two', 'auth-two') $$,
  'an owner can register multiple distinct push subscriptions'
);
select ok(
  not has_table_privilege('authenticated', 'public.buy_later_push_subscriptions', 'select'),
  'normal authenticated roles cannot read push subscription capability data'
);
select throws_ok(
  format(
    'insert into public.buy_later_push_subscriptions (user_id, endpoint, p256dh, auth) values (%L, ''https://push.example/spoofed'', ''key'', ''auth'')',
    tests.get_supabase_uid('buy_later_notification_other')
  ),
  '42501', null, 'a user cannot spoof push subscription ownership'
);

select tests.authenticate_as('buy_later_notification_other');
select is_empty(
  $$ select user_id from public.buy_later_notification_preferences $$,
  'another user cannot read notification preferences'
);
select is_empty(
  format(
    'update public.buy_later_notification_preferences set push_enabled = true where user_id = %L returning user_id',
    tests.get_supabase_uid('buy_later_notification_owner')
  ),
  'another user cannot update notification preferences'
);
select is_empty(
  $$ delete from public.buy_later_push_subscriptions returning id $$,
  'another user cannot delete push subscriptions'
);
select throws_ok(
  $$ select * from public.claim_buy_later_due_reminders(now(), current_date, 1, 1, 1) $$,
  '42501', null, 'an authenticated user cannot invoke service-only reminder claims'
);

select tests.clear_authentication();
select * from finish();
rollback;
