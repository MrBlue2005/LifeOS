begin;

select plan(40);

select tests.rls_enabled('public', 'find_it_locations');
select tests.rls_enabled('public', 'find_it_items');
select tests.rls_enabled('public', 'find_it_item_aliases');

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

select ok(
  not has_table_privilege('anon', 'public.find_it_item_aliases', 'select')
  and not has_table_privilege('anon', 'public.find_it_item_aliases', 'insert')
  and not has_table_privilege('anon', 'public.find_it_item_aliases', 'update')
  and not has_table_privilege('anon', 'public.find_it_item_aliases', 'delete'),
  'anonymous requests hold no item alias table privileges'
);

select ok(
  has_function_privilege('authenticated', 'public.normalize_find_it_alias_display(text)', 'execute')
  and has_function_privilege('authenticated', 'public.normalize_find_it_alias(text)', 'execute')
  and not has_function_privilege('public', 'public.normalize_find_it_alias_display(text)', 'execute')
  and not has_function_privilege('public', 'public.normalize_find_it_alias(text)', 'execute')
  and not has_function_privilege('anon', 'public.normalize_find_it_alias_display(text)', 'execute')
  and not has_function_privilege('anon', 'public.normalize_find_it_alias(text)', 'execute'),
  'only authenticated users can execute alias normalization helpers'
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

select lives_ok(
  $$ insert into public.find_it_item_aliases (id, item_id, alias)
     values (
       '30000000-0000-0000-0000-000000000001',
       '20000000-0000-0000-0000-000000000001',
       'Torch'
     ) $$,
  'an authenticated user can create an owned item alias'
);

select results_eq(
  $$ select normalized_alias from public.find_it_item_aliases
     where id = '30000000-0000-0000-0000-000000000001' $$,
  $$ values ('torch'::text) $$,
  'the owner can read a normalized owned alias'
);

select lives_ok(
  $$ update public.find_it_item_aliases set alias = 'Emergency torch'
     where id = '30000000-0000-0000-0000-000000000001' $$,
  'the owner can update alias text'
);

select lives_ok(
  $$ insert into public.find_it_item_aliases (id, item_id, alias)
     values (
       '30000000-0000-0000-0000-000000000002',
       '20000000-0000-0000-0000-000000000001',
       'Temporary alias'
     ) $$,
  'the owner can add another alias'
);

select lives_ok(
  $$ delete from public.find_it_item_aliases
     where id = '30000000-0000-0000-0000-000000000002' $$,
  'the owner can delete an alias'
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

select results_eq(
  $$ select count(*)::bigint from public.find_it_item_aliases $$,
  $$ values (0::bigint) $$,
  'another user cannot read the owner aliases'
);

select throws_ok(
  $$ insert into public.find_it_item_aliases (alias, item_id)
     values ('Foreign alias', '20000000-0000-0000-0000-000000000001') $$,
  '23503',
  null,
  'a user cannot attach an alias to another user item'
);

select throws_ok(
  format(
    'insert into public.find_it_item_aliases (alias, user_id, item_id) values (''Spoofed alias'', %L, ''20000000-0000-0000-0000-000000000001'')',
    tests.get_supabase_uid('find_it_owner')
  ),
  '42501',
  null,
  'a user cannot spoof alias ownership'
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

select is_empty(
  $$ update public.find_it_item_aliases set alias = 'Changed'
     where id = '30000000-0000-0000-0000-000000000001'
     returning id $$,
  'another user cannot update the owner alias'
);

select is_empty(
  $$ delete from public.find_it_item_aliases
     where id = '30000000-0000-0000-0000-000000000001'
     returning id $$,
  'another user cannot delete the owner alias'
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

select tests.authenticate_as('find_it_owner');

select lives_ok(
  $$ insert into public.find_it_items (id, name, location_id)
     values (
       '20000000-0000-0000-0000-000000000002',
       'Backup passport',
       '10000000-0000-0000-0000-000000000002'
     ) $$,
  'the owner can create another owned item'
);

select throws_ok(
  $$ update public.find_it_item_aliases
     set item_id = '20000000-0000-0000-0000-000000000002'
     where id = '30000000-0000-0000-0000-000000000001' $$,
  '23514',
  'An alias cannot be transferred to another item or owner.',
  'an alias item link is immutable'
);

select throws_ok(
  format(
    'update public.find_it_item_aliases set user_id = %L where id = ''30000000-0000-0000-0000-000000000001''',
    tests.get_supabase_uid('find_it_other_user')
  ),
  '42501',
  null,
  'an alias owner cannot be changed'
);

select throws_ok(
  $$ insert into public.find_it_item_aliases (item_id, alias)
     values ('20000000-0000-0000-0000-000000000001', 'EMERGENCY TORCH') $$,
  '23505',
  null,
  'case-equivalent aliases on one item are rejected'
);

select lives_ok(
  $$ insert into public.find_it_item_aliases (item_id, alias)
     select '20000000-0000-0000-0000-000000000001', 'Alias ' || value
     from generate_series(1, 11) as value $$,
  'an item can have twelve aliases'
);

select throws_ok(
  $$ insert into public.find_it_item_aliases (item_id, alias)
     values ('20000000-0000-0000-0000-000000000001', 'Thirteenth alias') $$,
  '23514',
  'An item can have at most 12 aliases.',
  'an item cannot exceed the alias limit'
);

select lives_ok(
  $$ delete from public.find_it_items
     where id = '20000000-0000-0000-0000-000000000001' $$,
  'an owner can delete an item with aliases'
);

select is_empty(
  $$ select id from public.find_it_item_aliases
     where item_id = '20000000-0000-0000-0000-000000000001' $$,
  'deleting an item cascades to its aliases'
);

select tests.clear_authentication();

select results_eq(
  $$ select count(*)::bigint from public.find_it_locations $$,
  $$ values (0::bigint) $$,
  'an unauthenticated request cannot read locations'
);

select * from finish();
rollback;
