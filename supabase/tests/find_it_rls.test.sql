begin;

select plan(19);

select tests.rls_enabled('public', 'find_it_locations');
select tests.rls_enabled('public', 'find_it_items');

select ok(
  not has_table_privilege('anon', 'public.find_it_locations', 'select')
  and not has_table_privilege('anon', 'public.find_it_locations', 'insert')
  and not has_table_privilege('anon', 'public.find_it_locations', 'update')
  and not has_table_privilege('anon', 'public.find_it_locations', 'delete'),
  'anonymous requests hold no location table privileges'
);

select ok(
  not has_table_privilege('anon', 'public.find_it_items', 'select')
  and not has_table_privilege('anon', 'public.find_it_items', 'insert')
  and not has_table_privilege('anon', 'public.find_it_items', 'update')
  and not has_table_privilege('anon', 'public.find_it_items', 'delete'),
  'anonymous requests hold no item table privileges'
);

select tests.create_supabase_user('find_it_owner');
select tests.create_supabase_user('find_it_other_user');

select tests.authenticate_as('find_it_owner');

select lives_ok(
  $$ insert into public.find_it_locations (id, name)
     values ('10000000-0000-0000-0000-000000000001', 'Home') $$,
  'an authenticated user can create an owned location'
);

select lives_ok(
  $$ insert into public.find_it_locations (id, name, parent_id)
     values (
       '10000000-0000-0000-0000-000000000002',
       'Office',
       '10000000-0000-0000-0000-000000000001'
     ) $$,
  'an authenticated user can create an owned child location'
);

select lives_ok(
  $$ insert into public.find_it_items (id, name, location_id)
     values (
       '20000000-0000-0000-0000-000000000001',
       'Passport',
       '10000000-0000-0000-0000-000000000002'
     ) $$,
  'an authenticated user can create an item in an owned location'
);

select results_eq(
  $$ select count(*)::bigint from public.find_it_locations $$,
  $$ values (2::bigint) $$,
  'the owner can read owned locations'
);

select results_eq(
  $$ select count(*)::bigint from public.find_it_items $$,
  $$ values (1::bigint) $$,
  'the owner can read owned items'
);

select throws_ok(
  $$ delete from public.find_it_locations
     where id = '10000000-0000-0000-0000-000000000002' $$,
  '23503',
  null,
  'a location containing an item cannot be deleted'
);

select throws_ok(
  $$ update public.find_it_locations
     set parent_id = '10000000-0000-0000-0000-000000000002'
     where id = '10000000-0000-0000-0000-000000000001' $$,
  '23514',
  'A location cannot be moved inside itself.',
  'a hierarchy cycle is rejected'
);

select tests.authenticate_as('find_it_other_user');

select results_eq(
  $$ select count(*)::bigint from public.find_it_locations $$,
  $$ values (0::bigint) $$,
  'another user cannot read the owner locations'
);

select results_eq(
  $$ select count(*)::bigint from public.find_it_items $$,
  $$ values (0::bigint) $$,
  'another user cannot read the owner items'
);

select is_empty(
  $$ update public.find_it_locations set name = 'Changed'
     where id = '10000000-0000-0000-0000-000000000001'
     returning id $$,
  'another user cannot update the owner location'
);

select is_empty(
  $$ delete from public.find_it_items
     where id = '20000000-0000-0000-0000-000000000001'
     returning id $$,
  'another user cannot delete the owner item'
);

select throws_ok(
  format(
    'insert into public.find_it_locations (name, user_id) values (''Spoofed'', %L)',
    tests.get_supabase_uid('find_it_owner')
  ),
  '42501',
  null,
  'a user cannot spoof location ownership'
);

select throws_ok(
  $$ insert into public.find_it_locations (name, parent_id)
     values ('Foreign child', '10000000-0000-0000-0000-000000000001') $$,
  '23503',
  null,
  'a user cannot attach a location to another user parent'
);

select throws_ok(
  $$ insert into public.find_it_items (name, location_id)
     values ('Foreign item', '10000000-0000-0000-0000-000000000001') $$,
  '23503',
  null,
  'a user cannot attach an item to another user location'
);

select tests.clear_authentication();

select results_eq(
  $$ select count(*)::bigint from public.find_it_locations $$,
  $$ values (0::bigint) $$,
  'an unauthenticated request cannot read locations'
);

select * from finish();
rollback;
