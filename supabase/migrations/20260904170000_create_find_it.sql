begin;

create table public.find_it_locations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  parent_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint find_it_locations_name_valid check (
    name = btrim(name)
    and char_length(name) between 1 and 100
  ),
  constraint find_it_locations_not_self_parent check (parent_id is distinct from id),
  constraint find_it_locations_user_id_id_unique unique (user_id, id),
  constraint find_it_locations_user_parent_fkey
    foreign key (user_id, parent_id)
    references public.find_it_locations (user_id, id)
    on delete restrict
);

create unique index find_it_locations_sibling_name_unique_idx
  on public.find_it_locations (
    user_id,
    coalesce(parent_id, '00000000-0000-0000-0000-000000000000'::uuid),
    lower(name)
  );

create index find_it_locations_user_parent_idx
  on public.find_it_locations (user_id, parent_id)
  where parent_id is not null;

create table public.find_it_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  description text,
  location_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint find_it_items_name_valid check (
    name = btrim(name)
    and char_length(name) between 1 and 120
  ),
  constraint find_it_items_description_valid check (
    description is null or char_length(description) <= 500
  ),
  constraint find_it_items_user_location_fkey
    foreign key (user_id, location_id)
    references public.find_it_locations (user_id, id)
    on delete restrict
);

create index find_it_items_user_location_idx
  on public.find_it_items (user_id, location_id);

create index find_it_items_user_name_idx
  on public.find_it_items (user_id, lower(name));

create function public.set_find_it_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create function public.prevent_find_it_location_cycle()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  creates_cycle boolean;
begin
  if new.parent_id is null then
    return new;
  end if;

  -- Serialize hierarchy changes per owner so two concurrent moves cannot
  -- independently pass the cycle check and commit a cycle together.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(new.user_id::text, 0)
  );

  with recursive ancestors (id, parent_id) as (
    select location.id, location.parent_id
    from public.find_it_locations as location
    where location.user_id = new.user_id
      and location.id = new.parent_id

    union

    select parent.id, parent.parent_id
    from public.find_it_locations as parent
    join ancestors as child on child.parent_id = parent.id
    where parent.user_id = new.user_id
  )
  select exists (
    select 1 from ancestors where ancestors.id = new.id
  ) into creates_cycle;

  if creates_cycle then
    raise exception 'A location cannot be moved inside itself.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke all on function public.set_find_it_updated_at() from public, anon, authenticated;
revoke all on function public.prevent_find_it_location_cycle() from public, anon, authenticated;

create trigger set_find_it_locations_updated_at
before update on public.find_it_locations
for each row execute function public.set_find_it_updated_at();

create trigger prevent_find_it_location_cycles
before insert or update of user_id, parent_id on public.find_it_locations
for each row execute function public.prevent_find_it_location_cycle();

create trigger set_find_it_items_updated_at
before update on public.find_it_items
for each row execute function public.set_find_it_updated_at();

alter table public.find_it_locations enable row level security;
alter table public.find_it_items enable row level security;

revoke all on table public.find_it_locations from public, anon, authenticated;
revoke all on table public.find_it_items from public, anon, authenticated;

grant select, insert, update, delete on table public.find_it_locations to authenticated;
grant select, insert, update, delete on table public.find_it_items to authenticated;

create policy "Users can read their Find It locations"
on public.find_it_locations for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their Find It locations"
on public.find_it_locations for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their Find It locations"
on public.find_it_locations for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their Find It locations"
on public.find_it_locations for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can read their Find It items"
on public.find_it_items for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their Find It items"
on public.find_it_items for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their Find It items"
on public.find_it_items for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their Find It items"
on public.find_it_items for delete
to authenticated
using ((select auth.uid()) = user_id);

commit;
