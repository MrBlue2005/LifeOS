begin;

alter table public.find_it_items
  add constraint find_it_items_user_id_id_key unique (user_id, id);

create function public.normalize_find_it_alias_display(value text)
returns text
language sql
immutable
strict
set search_path = ''
as $$
  select pg_catalog.btrim(
    pg_catalog.regexp_replace(value, '[[:space:]]+', ' ', 'g')
  )
$$;

create function public.normalize_find_it_alias(value text)
returns text
language sql
immutable
strict
set search_path = ''
as $$
  select pg_catalog.lower(public.normalize_find_it_alias_display(value))
$$;

revoke all on function public.normalize_find_it_alias_display(text) from public, anon, authenticated;
revoke all on function public.normalize_find_it_alias(text) from public, anon, authenticated;

create table public.find_it_item_aliases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  item_id uuid not null,
  alias text not null,
  normalized_alias text generated always as (public.normalize_find_it_alias(alias)) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint find_it_item_aliases_alias_valid check (
    alias = public.normalize_find_it_alias_display(alias)
    and char_length(alias) between 1 and 60
  ),
  constraint find_it_item_aliases_item_alias_key unique (item_id, normalized_alias),
  constraint find_it_item_aliases_user_item_fkey
    foreign key (user_id, item_id)
    references public.find_it_items (user_id, id)
    on delete cascade
);

create index find_it_item_aliases_user_normalized_alias_idx
  on public.find_it_item_aliases (user_id, normalized_alias);

create function public.prevent_find_it_item_alias_link_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.user_id is distinct from old.user_id
    or new.item_id is distinct from old.item_id then
    raise exception 'An alias cannot be transferred to another item or owner.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create function public.enforce_find_it_item_alias_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  alias_count integer;
begin
  perform 1
  from public.find_it_items as item
  where item.user_id = new.user_id
    and item.id = new.item_id
  for update;

  if not found then
    raise exception 'An alias must reference an item owned by the same user.'
      using errcode = '23503';
  end if;

  select count(*)
  into alias_count
  from public.find_it_item_aliases as existing_alias
  where existing_alias.item_id = new.item_id;

  if alias_count >= 12 then
    raise exception 'An item can have at most 12 aliases.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke all on function public.prevent_find_it_item_alias_link_change() from public, anon, authenticated;
revoke all on function public.enforce_find_it_item_alias_limit() from public, anon, authenticated;

create trigger prevent_find_it_item_alias_link_changes
before update of user_id, item_id on public.find_it_item_aliases
for each row execute function public.prevent_find_it_item_alias_link_change();

create trigger enforce_find_it_item_alias_limit
before insert on public.find_it_item_aliases
for each row execute function public.enforce_find_it_item_alias_limit();

create trigger set_find_it_item_aliases_updated_at
before update on public.find_it_item_aliases
for each row execute function public.set_find_it_updated_at();

alter table public.find_it_item_aliases enable row level security;

revoke all on table public.find_it_item_aliases from public, anon, authenticated;
grant select, insert, update, delete on table public.find_it_item_aliases to authenticated;

create policy "Users can read their Find It item aliases"
on public.find_it_item_aliases for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their Find It item aliases"
on public.find_it_item_aliases for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their Find It item aliases"
on public.find_it_item_aliases for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their Find It item aliases"
on public.find_it_item_aliases for delete
to authenticated
using ((select auth.uid()) = user_id);

commit;
