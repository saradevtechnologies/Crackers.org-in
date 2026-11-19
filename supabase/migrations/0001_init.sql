-- crackers.org.in — initial schema
-- Run in Supabase SQL editor (or `supabase db push`).

create extension if not exists pgcrypto;

-- ---------- Enums ----------
create type user_role as enum ('customer', 'seller', 'admin');
create type seller_status as enum ('pending', 'approved', 'rejected', 'suspended');
create type wholesale_status as enum ('none', 'pending', 'approved', 'rejected');
create type order_status as enum ('payment_pending', 'payment_submitted', 'confirmed', 'completed', 'rejected', 'cancelled');
create type sub_order_status as enum ('awaiting_payment', 'confirmed', 'packed', 'dispatched', 'delivered', 'cancelled');

-- ---------- Tables ----------
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  role user_role not null default 'customer',
  full_name text,
  phone text,
  wholesale wholesale_status not null default 'none',
  wholesale_gstin text,
  wholesale_shop_name text,
  created_at timestamptz not null default now()
);

create table sellers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references profiles(id) on delete cascade,
  shop_id text not null unique,
  company_name text not null,
  gst_number text not null,
  contact_phone text not null,
  email text not null,
  address text not null,
  licence_number text not null,
  licence_path text,
  licence_expiry date,
  upi_id text,
  min_order numeric(10,2) not null default 0,
  status seller_status not null default 'pending',
  admin_note text,
  created_at timestamptz not null default now()
);

create table categories (
  id serial primary key,
  slug text not null unique,
  name text not null,
  name_ta text,
  sort int not null default 0
);

create table products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references sellers(id) on delete cascade,
  shop_id text not null default '',
  category_id int references categories(id) on delete set null,
  name text not null,
  description text,
  pack_info text,
  mrp numeric(10,2) not null check (mrp > 0),
  price numeric(10,2) not null check (price > 0),
  wholesale_price numeric(10,2) check (wholesale_price is null or wholesale_price > 0),
  wholesale_min_qty int not null default 1 check (wholesale_min_qty >= 1),
  is_green boolean not null default false,
  image_url text,
  in_stock boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  check (price <= mrp)
);
create index products_seller_idx on products(seller_id);
create index products_category_idx on products(category_id);

create table blocked_areas (
  id serial primary key,
  kind text not null check (kind in ('pincode', 'state')),
  value text not null,
  reason text,
  created_at timestamptz not null default now(),
  unique (kind, value)
);

create sequence order_no_seq start 10001;

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_no text not null unique,
  customer_id uuid not null references profiles(id),
  ship_name text not null,
  ship_phone text not null,
  ship_address text not null,
  ship_city text not null,
  ship_state text not null,
  ship_pincode text not null,
  is_wholesale boolean not null default false,
  total numeric(12,2) not null,
  status order_status not null default 'payment_pending',
  utr text,
  proof_path text,
  admin_note text,
  created_at timestamptz not null default now(),
  payment_submitted_at timestamptz,
  confirmed_at timestamptz
);
create index orders_customer_idx on orders(customer_id);
create index orders_status_idx on orders(status);

create table sub_orders (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  seller_id uuid not null references sellers(id),
  shop_id text not null,
  subtotal numeric(12,2) not null,
  status sub_order_status not null default 'awaiting_payment',
  -- limited customer info for the seller (privacy)
  ship_name text not null,
  ship_city text not null,
  ship_pincode text not null,
  ship_phone_masked text not null,
  transport_name text,
  lr_number text,
  lr_photo_url text,
  cancel_reason text,
  packed_at timestamptz,
  dispatched_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);
create index sub_orders_order_idx on sub_orders(order_id);
create index sub_orders_seller_idx on sub_orders(seller_id);

create table order_items (
  id bigserial primary key,
  sub_order_id uuid not null references sub_orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  name text not null,
  price numeric(10,2) not null,
  qty int not null check (qty > 0)
);

-- Pickup OTP is kept apart so sellers can never read it.
create table pickup_otps (
  sub_order_id uuid primary key references sub_orders(id) on delete cascade,
  otp text not null
);

create table order_events (
  id bigserial primary key,
  order_id uuid not null references orders(id) on delete cascade,
  sub_order_id uuid references sub_orders(id) on delete cascade,
  status text not null,
  note text,
  created_at timestamptz not null default now()
);

create table notifications (
  id bigserial primary key,
  order_id uuid references orders(id) on delete set null,
  to_phone text not null,
  to_name text,
  message text not null,
  template_params jsonb,
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed')),
  error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

-- ---------- Helpers ----------
create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function my_seller_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from sellers where user_id = auth.uid() and status = 'approved';
$$;

create or replace function seller_is_approved(p_seller_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from sellers where id = p_seller_id and status = 'approved');
$$;

create or replace function mask_phone(p text) returns text
language sql immutable as $$
  select '******' || right(regexp_replace(coalesce(p, ''), '\D', '', 'g'), 4);
$$;

create or replace function generate_shop_id() returns text
language plpgsql as $$
declare v text;
begin
  loop
    v := (10000 + floor(random() * 90000))::int::text;
    exit when not exists (select 1 from sellers where shop_id = v);
  end loop;
  return v;
end $$;

-- Profile row for every new auth user
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name, phone)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'phone');
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function handle_new_user();

-- Keep products.shop_id in sync with the seller
create or replace function set_product_shop_id() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  select shop_id into new.shop_id from sellers where id = new.seller_id;
  return new;
end $$;

create trigger products_shop_id before insert or update of seller_id on products
for each row execute function set_product_shop_id();

-- Queue a WhatsApp message for a customer
create or replace function queue_notification(p_order_id uuid, p_text text) returns void
language plpgsql security definer set search_path = public as $$
declare o orders;
begin
  select * into o from orders where id = p_order_id;
  if o.id is null then return; end if;
  insert into notifications (order_id, to_phone, to_name, message, template_params)
  values (o.id, o.ship_phone, o.ship_name,
          'Hi ' || o.ship_name || ', order ' || o.order_no || ': ' || p_text,
          jsonb_build_array(o.ship_name, o.order_no, p_text));
end $$;

-- Public, safe view of approved shops (no business details)
create view public_shops as
  select id, shop_id, min_order from sellers where status = 'approved';

-- ---------- Business functions ----------
create or replace function register_seller(
  p_company_name text, p_gst_number text, p_contact_phone text, p_email text,
  p_address text, p_licence_number text, p_licence_path text, p_licence_expiry date
) returns text
language plpgsql security definer set search_path = public as $$
declare v_shop text;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  if exists (select 1 from sellers where user_id = auth.uid()) then
    raise exception 'You have already registered a shop';
  end if;
  v_shop := generate_shop_id();
  insert into sellers (user_id, shop_id, company_name, gst_number, contact_phone, email, address,
                       licence_number, licence_path, licence_expiry)
  values (auth.uid(), v_shop, p_company_name, upper(p_gst_number), p_contact_phone, p_email, p_address,
          p_licence_number, p_licence_path, p_licence_expiry);
  update profiles set role = 'seller' where id = auth.uid() and role = 'customer';
  return v_shop;
end $$;

create or replace function admin_set_seller_status(p_seller_id uuid, p_status seller_status, p_note text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Not allowed'; end if;
  update sellers set status = p_status, admin_note = p_note where id = p_seller_id;
end $$;

create or replace function request_wholesale(p_gstin text, p_shop_name text) returns void
language plpgsql security definer set search_path = public as $$
begin
  update profiles set wholesale = 'pending', wholesale_gstin = upper(p_gstin), wholesale_shop_name = p_shop_name
  where id = auth.uid() and wholesale in ('none', 'rejected');
end $$;

create or replace function admin_set_wholesale(p_user_id uuid, p_status wholesale_status) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Not allowed'; end if;
  update profiles set wholesale = p_status where id = p_user_id;
end $$;

-- p_items: [{"product_id": "...", "qty": 2}, ...]
-- p_ship:  {"name","phone","address","city","state","pincode"}
create or replace function place_order(p_items jsonb, p_ship jsonb, p_wholesale boolean default false)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_order_id uuid;
  v_pin text := trim(p_ship->>'pincode');
  v_state text := trim(p_ship->>'state');
  v_total numeric := 0;
  v_seller record;
  v_sub_id uuid;
  v_wholesale boolean := false;
begin
  if v_uid is null then raise exception 'Sign in to place an order'; end if;
  if v_pin !~ '^\d{6}$' then raise exception 'Enter a valid 6-digit PIN code'; end if;
  if coalesce(trim(p_ship->>'name'), '') = '' or coalesce(p_ship->>'phone', '') !~ '^\+?\d{10,13}$' then
    raise exception 'Enter your name and a valid mobile number';
  end if;
  if exists (select 1 from blocked_areas
             where (kind = 'pincode' and value = v_pin)
                or (kind = 'state' and lower(value) = lower(v_state))) then
    raise exception 'Delivery is not available in your area due to local regulations';
  end if;
  if p_wholesale then
    select wholesale = 'approved' into v_wholesale from profiles where id = v_uid;
    if not v_wholesale then raise exception 'Your wholesale account is not approved yet'; end if;
  end if;
  if jsonb_array_length(coalesce(p_items, '[]'::jsonb)) = 0 then raise exception 'Your estimate is empty'; end if;

  -- Price every line on the server
  create temp table _lines on commit drop as
  select p.id as product_id, p.name, p.seller_id, s.shop_id, s.min_order,
         (i->>'qty')::int as qty,
         case when v_wholesale and p.wholesale_price is not null and (i->>'qty')::int >= p.wholesale_min_qty
              then p.wholesale_price else p.price end as unit_price
  from jsonb_array_elements(p_items) i
  join products p on p.id = (i->>'product_id')::uuid
  join sellers s on s.id = p.seller_id
  where p.active and p.in_stock and s.status = 'approved' and (i->>'qty')::int > 0;

  if (select count(*) from _lines) <> jsonb_array_length(p_items) then
    raise exception 'Some items are no longer available. Refresh your estimate.';
  end if;

  for v_seller in
    select seller_id, shop_id, min_order, sum(unit_price * qty) as subtotal from _lines group by 1, 2, 3
  loop
    if v_seller.subtotal < v_seller.min_order then
      raise exception 'Shop % needs a minimum order of ₹%', v_seller.shop_id, v_seller.min_order;
    end if;
    v_total := v_total + v_seller.subtotal;
  end loop;

  insert into orders (order_no, customer_id, ship_name, ship_phone, ship_address, ship_city, ship_state,
                      ship_pincode, is_wholesale, total)
  values ('ORD-' || nextval('order_no_seq'), v_uid, trim(p_ship->>'name'), p_ship->>'phone',
          trim(p_ship->>'address'), trim(p_ship->>'city'), v_state, v_pin, v_wholesale, v_total)
  returning id into v_order_id;

  for v_seller in
    select seller_id, shop_id, sum(unit_price * qty) as subtotal from _lines group by 1, 2
  loop
    insert into sub_orders (order_id, seller_id, shop_id, subtotal, ship_name, ship_city, ship_pincode, ship_phone_masked)
    values (v_order_id, v_seller.seller_id, v_seller.shop_id, v_seller.subtotal, trim(p_ship->>'name'),
            trim(p_ship->>'city'), v_pin, mask_phone(p_ship->>'phone'))
    returning id into v_sub_id;

    insert into order_items (sub_order_id, product_id, name, price, qty)
    select v_sub_id, product_id, name, unit_price, qty from _lines where seller_id = v_seller.seller_id;

    insert into pickup_otps (sub_order_id, otp) values (v_sub_id, lpad((floor(random() * 10000))::int::text, 4, '0'));
  end loop;

  insert into order_events (order_id, status, note) values (v_order_id, 'payment_pending', 'Order placed');
  return v_order_id;
end $$;

create or replace function submit_payment(p_order_id uuid, p_utr text, p_proof_path text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_utr !~ '^\d{12}$' then raise exception 'UTR must be a 12-digit number'; end if;
  update orders set utr = p_utr, proof_path = coalesce(p_proof_path, proof_path),
         status = 'payment_submitted', payment_submitted_at = now()
  where id = p_order_id and customer_id = auth.uid() and status in ('payment_pending', 'payment_submitted');
  if not found then raise exception 'This order cannot accept a payment now'; end if;
  insert into order_events (order_id, status, note) values (p_order_id, 'payment_submitted', 'UTR ' || p_utr);
end $$;

create or replace function cancel_my_order(p_order_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update orders set status = 'cancelled'
  where id = p_order_id and customer_id = auth.uid() and status = 'payment_pending';
  if not found then raise exception 'Only unpaid orders can be cancelled'; end if;
  update sub_orders set status = 'cancelled' where order_id = p_order_id;
  insert into order_events (order_id, status, note) values (p_order_id, 'cancelled', 'Cancelled by customer');
end $$;

create or replace function admin_confirm_payment(p_order_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Not allowed'; end if;
  update orders set status = 'confirmed', confirmed_at = now()
  where id = p_order_id and status in ('payment_pending', 'payment_submitted');
  if not found then raise exception 'Order is not waiting for payment'; end if;
  update sub_orders set status = 'confirmed' where order_id = p_order_id and status = 'awaiting_payment';
  insert into order_events (order_id, status, note) values (p_order_id, 'confirmed', 'Payment verified');
  perform queue_notification(p_order_id, 'payment received. Your order is confirmed and sent to the shops for packing.');
end $$;

create or replace function admin_reject_payment(p_order_id uuid, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Not allowed'; end if;
  update orders set status = 'rejected', admin_note = p_reason
  where id = p_order_id and status in ('payment_pending', 'payment_submitted');
  if not found then raise exception 'Order is not waiting for payment'; end if;
  update sub_orders set status = 'cancelled', cancel_reason = p_reason where order_id = p_order_id;
  insert into order_events (order_id, status, note) values (p_order_id, 'rejected', p_reason);
  perform queue_notification(p_order_id, 'we could not verify your payment (' || coalesce(p_reason, 'no reason given') || '). Please contact support.');
end $$;

create or replace function seller_mark_packed(p_sub_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_order uuid;
begin
  update sub_orders set status = 'packed', packed_at = now()
  where id = p_sub_id and seller_id = my_seller_id() and status = 'confirmed'
  returning order_id into v_order;
  if v_order is null then raise exception 'Order cannot be marked packed'; end if;
  insert into order_events (order_id, sub_order_id, status) values (v_order, p_sub_id, 'packed');
end $$;

create or replace function seller_dispatch(p_sub_id uuid, p_transport text, p_lr text, p_photo_url text)
returns void language plpgsql security definer set search_path = public as $$
declare v_order uuid; v_shop text; v_otp text;
begin
  if coalesce(trim(p_transport), '') = '' or coalesce(trim(p_lr), '') = '' then
    raise exception 'Enter the transport name and LR number';
  end if;
  update sub_orders set status = 'dispatched', dispatched_at = now(),
         transport_name = trim(p_transport), lr_number = trim(p_lr), lr_photo_url = p_photo_url
  where id = p_sub_id and seller_id = my_seller_id() and status in ('confirmed', 'packed')
  returning order_id, shop_id into v_order, v_shop;
  if v_order is null then raise exception 'Order cannot be dispatched'; end if;
  select otp into v_otp from pickup_otps where sub_order_id = p_sub_id;
  insert into order_events (order_id, sub_order_id, status, note)
  values (v_order, p_sub_id, 'dispatched', trim(p_transport) || ' LR ' || trim(p_lr));
  perform queue_notification(v_order, 'items from Shop ' || v_shop || ' are dispatched by ' || trim(p_transport) ||
          ', LR ' || trim(p_lr) || '. Your pickup OTP is ' || v_otp || '.');
end $$;

create or replace function seller_mark_delivered(p_sub_id uuid, p_otp text) returns void
language plpgsql security definer set search_path = public as $$
declare v_order uuid; v_ok boolean;
begin
  select exists (select 1 from pickup_otps where sub_order_id = p_sub_id and otp = trim(p_otp)) into v_ok;
  if not v_ok then raise exception 'Pickup OTP does not match'; end if;
  update sub_orders set status = 'delivered', delivered_at = now()
  where id = p_sub_id and seller_id = my_seller_id() and status = 'dispatched'
  returning order_id into v_order;
  if v_order is null then raise exception 'Order cannot be marked delivered'; end if;
  insert into order_events (order_id, sub_order_id, status) values (v_order, p_sub_id, 'delivered');
  if not exists (select 1 from sub_orders where order_id = v_order and status not in ('delivered', 'cancelled')) then
    update orders set status = 'completed' where id = v_order;
    perform queue_notification(v_order, 'all items are delivered. Happy Diwali!');
  end if;
end $$;

create or replace function seller_cancel_sub_order(p_sub_id uuid, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
declare v_order uuid; v_shop text;
begin
  update sub_orders set status = 'cancelled', cancel_reason = p_reason
  where id = p_sub_id and seller_id = my_seller_id() and status in ('confirmed', 'packed')
  returning order_id, shop_id into v_order, v_shop;
  if v_order is null then raise exception 'Order cannot be cancelled now'; end if;
  insert into order_events (order_id, sub_order_id, status, note) values (v_order, p_sub_id, 'cancelled', p_reason);
  perform queue_notification(v_order, 'Shop ' || v_shop || ' cannot supply your items (' || coalesce(p_reason, '') ||
          '). We will refund that part of your payment.');
end $$;

-- ---------- Row level security ----------
alter table profiles enable row level security;
alter table sellers enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table blocked_areas enable row level security;
alter table orders enable row level security;
alter table sub_orders enable row level security;
alter table order_items enable row level security;
alter table pickup_otps enable row level security;
alter table order_events enable row level security;
alter table notifications enable row level security;

create policy profiles_select on profiles for select using (id = auth.uid() or is_admin());
create policy profiles_update on profiles for update using (id = auth.uid());
revoke update on profiles from authenticated, anon;
grant update (full_name, phone) on profiles to authenticated;

create policy sellers_select on sellers for select using (user_id = auth.uid() or is_admin());
create policy sellers_update on sellers for update using (user_id = auth.uid());
revoke update on sellers from authenticated, anon;
grant update (contact_phone, email, address, upi_id, min_order, licence_path, licence_expiry) on sellers to authenticated;

create policy categories_read on categories for select using (true);
create policy categories_admin on categories for all using (is_admin()) with check (is_admin());

create policy products_read on products for select using (
  (active and seller_is_approved(seller_id))
  or seller_id = my_seller_id() or is_admin()
);
create policy products_insert on products for insert with check (seller_id = my_seller_id());
create policy products_update on products for update using (seller_id = my_seller_id() or is_admin())
  with check (seller_id = my_seller_id() or is_admin());
create policy products_delete on products for delete using (seller_id = my_seller_id() or is_admin());

create policy areas_read on blocked_areas for select using (true);
create policy areas_admin on blocked_areas for all using (is_admin()) with check (is_admin());

create policy orders_select on orders for select using (customer_id = auth.uid() or is_admin());

create policy sub_orders_select on sub_orders for select using (
  is_admin()
  or exists (select 1 from orders o where o.id = order_id and o.customer_id = auth.uid())
  or (seller_id = my_seller_id() and status <> 'awaiting_payment')
);

create policy order_items_select on order_items for select using (
  exists (select 1 from sub_orders s where s.id = sub_order_id)
);

create policy otps_select on pickup_otps for select using (
  exists (select 1 from sub_orders s join orders o on o.id = s.order_id
          where s.id = sub_order_id and o.customer_id = auth.uid())
);

create policy events_select on order_events for select using (
  is_admin() or exists (select 1 from orders o where o.id = order_id and o.customer_id = auth.uid())
);

create policy notifications_admin on notifications for all using (is_admin()) with check (is_admin());

grant select on public_shops to anon, authenticated;

-- ---------- Storage ----------
insert into storage.buckets (id, name, public) values
  ('product-images', 'product-images', true),
  ('lr-photos', 'lr-photos', true),
  ('licences', 'licences', false),
  ('payment-proofs', 'payment-proofs', false)
on conflict (id) do nothing;

create policy "own uploads" on storage.objects for insert to authenticated
  with check (bucket_id in ('product-images', 'lr-photos', 'licences', 'payment-proofs')
              and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own updates" on storage.objects for update to authenticated
  using ((storage.foldername(name))[1] = auth.uid()::text);
create policy "own deletes" on storage.objects for delete to authenticated
  using ((storage.foldername(name))[1] = auth.uid()::text);
create policy "public read" on storage.objects for select
  using (bucket_id in ('product-images', 'lr-photos'));
create policy "private read" on storage.objects for select to authenticated
  using (bucket_id in ('licences', 'payment-proofs')
         and ((storage.foldername(name))[1] = auth.uid()::text or is_admin()));

-- ---------- Seed ----------
insert into categories (slug, name, name_ta, sort) values
  ('sparklers', 'Sparklers', 'கம்பி மத்தாப்பு', 1),
  ('flower-pots', 'Flower pots', 'புஸ்வாணம்', 2),
  ('chakkars', 'Ground chakkars', 'தரைச்சக்கரம்', 3),
  ('rockets', 'Rockets', 'ராக்கெட்', 4),
  ('bombs', 'Bombs', 'வெடி', 5),
  ('fancy', 'Fancy and aerial', 'ஃபேன்சி', 6),
  ('kids', 'Kids crackers', 'குழந்தைகள்', 7),
  ('gift-boxes', 'Gift boxes', 'பரிசுப் பெட்டி', 8);

insert into blocked_areas (kind, value, reason) values
  ('state', 'Delhi', 'Year-round firecracker ban'),
  ('state', 'Punjab', 'Online sale prohibited');
