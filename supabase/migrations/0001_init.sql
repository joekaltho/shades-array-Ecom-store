-- Shades Array — initial schema.
-- Run once in the Supabase SQL editor (or `supabase db push`).

-- ───────────────────────── Admins ─────────────────────────
-- Only users listed here can manage the store. Add yourself after creating
-- your user in Authentication → Users (see README).
create table public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
create policy "admins read own row" on public.admins
  for select to authenticated using (user_id = auth.uid());

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$ select exists (select 1 from public.admins where user_id = auth.uid()); $$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create or replace function public.touch_updated_at()
returns trigger language plpgsql
set search_path = public
as $$
begin new.updated_at = now(); return new; end $$;

-- ───────────────────────── Categories ─────────────────────────
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name        text not null check (length(trim(name)) > 0),
  tagline     text not null default '',
  description text not null default '',
  image_url   text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);
alter table public.categories enable row level security;
create policy "public read categories" on public.categories for select using (true);
create policy "admin write categories" on public.categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ───────────────────────── Products ─────────────────────────
create table public.products (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name             text not null check (length(trim(name)) > 0),
  description      text not null default '',
  price            integer not null check (price >= 0),              -- whole naira
  compare_at_price integer check (compare_at_price is null or compare_at_price > price),
  category_id      uuid references public.categories (id) on delete set null,
  status           text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  featured         boolean not null default false,
  badge            text,                                              -- e.g. "New", "Limited edition"
  stock            integer not null default 0 check (stock >= 0),
  allow_preorder   boolean not null default false,
  sku              text,
  images           text[] not null default '{}' check (cardinality(images) <= 10),
  specs            jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index products_status_idx   on public.products (status);
create index products_category_idx on public.products (category_id);
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

alter table public.products enable row level security;
-- Visitors only ever see active products; admins see everything.
create policy "read products" on public.products
  for select using (status = 'active' or public.is_admin());
create policy "admin write products" on public.products
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ───────────────────────── Orders ─────────────────────────
-- Checkout happens on WhatsApp. Each "Order via WhatsApp" tap records a row here
-- (status "new") with a short reference that is also in the WhatsApp message,
-- so you can match the chat to the order. You can also add orders by hand.
create table public.orders (
  id               uuid primary key default gen_random_uuid(),
  number           text not null unique check (number ~ '^[A-Z0-9-]{4,12}$'),
  status           text not null default 'new'
                     check (status in ('new', 'confirmed', 'paid', 'delivered', 'cancelled')),
  source           text not null default 'website'
                     check (source in ('website', 'whatsapp', 'instagram', 'walk-in', 'other')),
  customer_name    text not null default '',
  customer_phone   text not null default '',
  delivery_address text not null default '',
  notes            text not null default '',
  items            jsonb not null default '[]'::jsonb check (jsonb_typeof(items) = 'array'),
  total            integer not null default 0 check (total >= 0),
  stock_applied    boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index orders_created_idx on public.orders (created_at desc);
create index orders_status_idx  on public.orders (status);
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();

alter table public.orders enable row level security;
create policy "admin all orders" on public.orders
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
-- No public policies: visitors create orders only through create_website_order().

-- Stock follows order status. Moving an order to confirmed/paid/delivered takes the
-- items out of stock; moving it back (e.g. cancelled) puts them back. Made-to-order
-- (pre-order) products with no stock are not deducted. What was deducted is stored
-- on each item as "stockDeducted" so restoring is always exact.
create or replace function public.orders_sync_stock()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  should_apply boolean := new.status in ('confirmed', 'paid', 'delivered');
  item   jsonb;
  result jsonb := '[]'::jsonb;
  pid    uuid;
  qty    integer;
  took   integer;
  prod   record;
begin
  if tg_op = 'UPDATE' and old.stock_applied and should_apply
     and new.items is distinct from old.items then
    raise exception 'Reopen the order (set it back to New) before changing its items.';
  end if;

  if should_apply and not new.stock_applied then
    for item in select * from jsonb_array_elements(new.items) loop
      pid  := nullif(item ->> 'productId', '')::uuid;
      qty  := coalesce((item ->> 'qty')::integer, 0);
      took := 0;
      if pid is not null and qty > 0 then
        select stock, allow_preorder into prod from public.products where id = pid for update;
        if found then
          if prod.stock >= qty then
            update public.products set stock = stock - qty where id = pid;
            took := qty;
          elsif not prod.allow_preorder then
            raise exception 'Not enough stock for "%" (% left, order needs %).',
              coalesce(item ->> 'name', 'item'), prod.stock, qty;
          end if;
        end if;
      end if;
      result := result || jsonb_build_array(item || jsonb_build_object('stockDeducted', took));
    end loop;
    new.items := result;
    new.stock_applied := true;

  elsif not should_apply and new.stock_applied then
    for item in select * from jsonb_array_elements(new.items) loop
      pid  := nullif(item ->> 'productId', '')::uuid;
      took := coalesce((item ->> 'stockDeducted')::integer, 0);
      if pid is not null and took > 0 then
        update public.products set stock = stock + took where id = pid;
      end if;
      result := result || jsonb_build_array(item || jsonb_build_object('stockDeducted', 0));
    end loop;
    new.items := result;
    new.stock_applied := false;
  end if;

  return new;
end $$;

revoke all on function public.orders_sync_stock() from public, anon, authenticated;

create trigger orders_sync_stock
  before insert or update of status, items on public.orders
  for each row execute function public.orders_sync_stock();

-- Called by the storefront when someone taps "Order via WhatsApp".
-- Prices come from the products table, never from the browser.
create or replace function public.create_website_order(p_ref text, p_items jsonb)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  line  jsonb;
  q     integer;
  prod  record;
  built jsonb := '[]'::jsonb;
  tot   integer := 0;
begin
  if p_ref is null or p_ref !~ '^[A-Z2-9]{6}$' then
    raise exception 'invalid reference';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) not between 1 and 30 then
    raise exception 'invalid items';
  end if;

  for line in select * from jsonb_array_elements(p_items) loop
    q := (line ->> 'qty')::integer;
    if q is null or q < 1 or q > 50 then
      raise exception 'invalid quantity';
    end if;
    select id, name, price, images into prod
      from public.products
      where id = (line ->> 'productId')::uuid and status = 'active';
    if not found then continue; end if;
    built := built || jsonb_build_array(jsonb_build_object(
      'productId', prod.id, 'name', prod.name, 'price', prod.price,
      'qty', q, 'image', prod.images[1]));
    tot := tot + prod.price * q;
  end loop;

  if jsonb_array_length(built) = 0 then
    raise exception 'no valid items';
  end if;

  insert into public.orders (number, source, items, total)
  values (p_ref, 'website', built, tot);
end $$;
revoke all on function public.create_website_order(text, jsonb) from public;
grant execute on function public.create_website_order(text, jsonb) to anon, authenticated;

-- ───────────────────────── Store settings ─────────────────────────
-- One row. Everything the owner edits under Admin → Settings lives in `data`.
create table public.settings (
  id         integer primary key default 1 check (id = 1),
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create trigger settings_touch before update on public.settings
  for each row execute function public.touch_updated_at();
alter table public.settings enable row level security;
create policy "public read settings" on public.settings for select using (true);
create policy "admin write settings" on public.settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
insert into public.settings (id, data) values (1, '{}'::jsonb) on conflict do nothing;

-- ───────────────────────── Image storage ─────────────────────────
-- Public bucket: image URLs are readable by anyone, only admins can write.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "admin select product images" on storage.objects
  for select to authenticated
  using (bucket_id = 'product-images' and public.is_admin());
create policy "admin insert product images" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());
create policy "admin update product images" on storage.objects
  for update to authenticated
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());
create policy "admin delete product images" on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-images' and public.is_admin());
