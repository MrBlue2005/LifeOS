begin;

select plan(12);

select tests.rls_enabled('public', 'buy_later_items');
select ok(
  not has_table_privilege('anon', 'public.buy_later_items', 'select')
  and not has_table_privilege('anon', 'public.buy_later_items', 'insert')
  and not has_table_privilege('anon', 'public.buy_later_items', 'update')
  and not has_table_privilege('anon', 'public.buy_later_items', 'delete'),
  'anonymous requests hold no Buy Later privileges'
);

select tests.create_supabase_user('buy_later_owner');
select tests.create_supabase_user('buy_later_other');
select tests.authenticate_as('buy_later_owner');

select lives_ok(
  $$ insert into public.buy_later_items (id, name, reconsider_at)
     values ('40000000-0000-4000-8000-000000000001', 'Headphones', '2099-01-01') $$,
  'an authenticated user can create an owned purchase intention'
);
select results_eq(
  $$ select count(*)::bigint from public.buy_later_items $$,
  $$ values (1::bigint) $$,
  'the owner can read the owned intention'
);
select lives_ok(
  $$ update public.buy_later_items set note = 'Wait for a sale'
     where id = '40000000-0000-4000-8000-000000000001' $$,
  'the owner can update the owned intention'
);
select throws_ok(
  $$ update public.buy_later_items set status = 'purchased'
     where id = '40000000-0000-4000-8000-000000000001' $$,
  '23514', null, 'resolved states require a resolution timestamp'
);
select throws_ok(
  $$ insert into public.buy_later_items (name, reconsider_at, current_price)
     values ('Invalid price', '2099-01-01', 10.00) $$,
  '23514', null, 'price and currency must be stored together'
);

select tests.authenticate_as('buy_later_other');
select results_eq(
  $$ select count(*)::bigint from public.buy_later_items $$,
  $$ values (0::bigint) $$,
  'another user cannot read the owner intention'
);
select is_empty(
  $$ update public.buy_later_items set name = 'Changed'
     where id = '40000000-0000-4000-8000-000000000001' returning id $$,
  'another user cannot update the owner intention'
);
select is_empty(
  $$ delete from public.buy_later_items
     where id = '40000000-0000-4000-8000-000000000001' returning id $$,
  'another user cannot delete the owner intention'
);
select throws_ok(
  format(
    'insert into public.buy_later_items (name, reconsider_at, user_id) values (''Spoofed'', ''2099-01-01'', %L)',
    tests.get_supabase_uid('buy_later_owner')
  ),
  '42501', null, 'a user cannot spoof Buy Later ownership'
);

select tests.clear_authentication();
select results_eq(
  $$ select count(*)::bigint from public.buy_later_items $$,
  $$ values (0::bigint) $$,
  'an unauthenticated request cannot read Buy Later items'
);

select * from finish();
rollback;
