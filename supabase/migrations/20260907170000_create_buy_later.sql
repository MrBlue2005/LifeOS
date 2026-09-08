begin;

create table public.buy_later_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  product_url text,
  current_price numeric(12, 2),
  currency text,
  note text,
  reconsider_at date not null,
  status text not null default 'considering',
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint buy_later_items_name_valid check (
    name = btrim(name) and char_length(name) between 1 and 160
  ),
  constraint buy_later_items_url_valid check (
    product_url is null
    or (product_url = btrim(product_url) and char_length(product_url) between 1 and 2048)
  ),
  constraint buy_later_items_price_valid check (
    current_price is null or current_price between 0 and 9999999999.99
  ),
  constraint buy_later_items_currency_valid check (
    currency is null or currency ~ '^[A-Z]{3}$'
  ),
  constraint buy_later_items_price_currency_together check (
    (current_price is null) = (currency is null)
  ),
  constraint buy_later_items_note_valid check (
    note is null or char_length(note) <= 1000
  ),
  constraint buy_later_items_status_valid check (
    status in ('considering', 'purchased', 'dismissed')
  ),
  constraint buy_later_items_resolution_valid check (
    (status = 'considering' and resolved_at is null)
    or (status in ('purchased', 'dismissed') and resolved_at is not null)
  )
);

create index buy_later_items_active_due_idx
  on public.buy_later_items (user_id, reconsider_at, created_at desc)
  where status = 'considering';

create index buy_later_items_history_idx
  on public.buy_later_items (user_id, resolved_at desc)
  where status in ('purchased', 'dismissed');

create function public.set_buy_later_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_buy_later_updated_at() from public, anon, authenticated;

create trigger set_buy_later_items_updated_at
before update on public.buy_later_items
for each row execute function public.set_buy_later_updated_at();

alter table public.buy_later_items enable row level security;

revoke all on table public.buy_later_items from public, anon, authenticated;
grant select, insert, update, delete on table public.buy_later_items to authenticated;

create policy "Users can read their Buy Later items"
on public.buy_later_items for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their Buy Later items"
on public.buy_later_items for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their Buy Later items"
on public.buy_later_items for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their Buy Later items"
on public.buy_later_items for delete
to authenticated
using ((select auth.uid()) = user_id);

commit;
