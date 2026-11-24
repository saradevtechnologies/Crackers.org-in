-- crackers.org.in — Bulk buyers (replaces "wholesale"), phone OTP sign-up, safer password reset.
-- Run once, after 0001_init.sql and 0002_hero_slides.sql, in the Supabase SQL editor.
-- The whole file runs in one transaction: if anything fails, nothing is changed.

begin;

-- =====================================================================
-- 1. Settings
-- =====================================================================
create table app_settings (
  key text primary key,
  value jsonb not null,
  scope text not null check (scope in ('public', 'bulk', 'admin')),
  updated_at timestamptz not null default now()
);

insert into app_settings (key, value, scope) values
  ('bulk_min_order', '500000'::jsonb, 'public'),
  ('bulk_bank_details', '{"account_name":"","account_number":"","ifsc":"","bank":"","branch":""}'::jsonb, 'bulk'),
  -- Used in WhatsApp messages written by the database (e.g. the "apply again" link).
  ('site_url', '"https://crackers.org.in"'::jsonb, 'public');

-- =====================================================================
-- 2. Bulk applications
-- =====================================================================
create sequence bulk_app_seq start 1001;

create table bulk_applications (
  id uuid primary key default gen_random_uuid(),
  application_no text not null unique default ('BLK-' || nextval('bulk_app_seq')),
  shop_name text not null,
  owner_name text not null,
  phone text not null check (phone ~ '^\+91[6-9]\d{9}$'),
  email text not null check (email = lower(email)),
  address text not null,
  city text not null,
  state text not null,
  pincode text not null check (pincode ~ '^\d{6}$'),
  gstin text not null check (gstin ~ '^[0-9]{2}[A-Z0-9]{13}$'),
  licence_number text not null,
  licence_expiry date not null,
  document_paths text[] not null default '{}',
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'suspended', 'renewal_pending')),
  admin_note text,
  user_id uuid unique references profiles(id) on delete set null,
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index bulk_app_email_open on bulk_applications (lower(email))
  where status in ('pending', 'approved', 'renewal_pending');
create unique index bulk_app_phone_open on bulk_applications (phone)
  where status in ('pending', 'approved', 'renewal_pending');
create index bulk_app_status_idx on bulk_applications (status);

-- =====================================================================
-- 3. Bulk prices (moved out of the public products table)
-- =====================================================================
create table product_bulk_prices (
  product_id uuid primary key references products(id) on delete cascade,
  bulk_price numeric(10,2) not null check (bulk_price > 0),
  updated_at timestamptz not null default now()
);

insert into product_bulk_prices (product_id, bulk_price)
select id, wholesale_price from products where wholesale_price is not null;

alter table products drop column wholesale_price, drop column wholesale_min_qty;

-- =====================================================================
-- 4. Step-up OTP (bulk password reset) and rate limits. Service role only.
-- =====================================================================
create table step_up_otps (
  user_id uuid primary key references auth.users on delete cascade,
  code_hash text not null,           -- sha256(code || user_id), never the plain code
  expires_at timestamptz not null,
  attempts int not null default 0,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table rate_limits (
  id bigserial primary key,
  key text not null,
  created_at timestamptz not null default now()
);
create index rate_limits_key_idx on rate_limits (key, created_at);

-- =====================================================================
-- 5. Profiles: account_type replaces the wholesale columns
-- =====================================================================
drop function if exists request_wholesale(text, text);
drop function if exists admin_set_wholesale(uuid, wholesale_status);

alter table profiles add column account_type text not null default 'customer'
  check (account_type in ('customer', 'bulk'));
alter table profiles drop column wholesale, drop column wholesale_gstin, drop column wholesale_shop_name;
drop type wholesale_status;

-- account_type is NOT in this list, so users can never change it themselves.
revoke update on profiles from authenticated, anon;
grant update (full_name, phone) on profiles to authenticated;

-- New users are always customers. account_type in the sign-up metadata is ignored on purpose:
-- anyone can call signUp() with any metadata. Only the admin approval (service role) sets 'bulk'.
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_phone text := nullif(trim(new.raw_user_meta_data->>'phone'), '');
begin
  if v_phone is null and coalesce(new.phone, '') <> '' then
    -- Supabase stores phone-auth numbers as digits without '+'.
    v_phone := '+' || regexp_replace(new.phone, '\D', '', 'g');
  end if;
  insert into profiles (id, full_name, phone)
  values (new.id, nullif(trim(new.raw_user_meta_data->>'full_name'), ''), v_phone);
  return new;
end $$;

-- =====================================================================
-- 6. Orders
-- =====================================================================
alter table orders
  add column order_type text not null default 'retail' check (order_type in ('retail', 'bulk')),
  add column payment_method text not null default 'upi' check (payment_method in ('upi', 'bank_transfer')),
  add column buyer_gstin text,
  add column buyer_shop_name text;
update orders set order_type = 'bulk' where is_wholesale;
alter table orders drop column is_wholesale;

-- Sellers can't read `orders`, but need the bulk badge and GSTIN for the invoice.
alter table sub_orders
  add column order_type text not null default 'retail' check (order_type in ('retail', 'bulk')),
  add column buyer_gstin text,
  add column buyer_shop_name text;
update sub_orders s set order_type = o.order_type from orders o where o.id = s.order_id;

-- =====================================================================
-- 7. Helpers
-- =====================================================================
create or replace function is_bulk_buyer() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles p
    join bulk_applications a on a.user_id = p.id
    where p.id = auth.uid()
      and p.account_type = 'bulk'
      and a.status = 'approved'
      and a.licence_expiry >= current_date
  );
$$;

create or replace function bulk_min_order() returns numeric
language sql stable security definer set search_path = public as $$
  select coalesce((select (value #>> '{}')::numeric from app_settings where key = 'bulk_min_order'), 500000);
$$;

create or replace function site_url() returns text
language sql stable security definer set search_path = public as $$
  select rtrim(coalesce((select value #>> '{}' from app_settings where key = 'site_url'), 'https://crackers.org.in'), '/');
$$;

-- ₹5,00,000 style (Indian digit grouping), whole rupees.
create or replace function format_inr(n numeric) returns text
language plpgsql immutable as $$
declare s text := ceil(coalesce(n, 0))::bigint::text; head text;
begin
  if length(s) <= 3 then return '₹' || s; end if;
  head := left(s, length(s) - 3);
  head := regexp_replace(head, '(\d)(?=(\d\d)+$)', '\1,', 'g');
  return '₹' || head || ',' || right(s, 3);
end $$;

-- Generic WhatsApp queue. Not callable by users (see revokes at the end).
create or replace function queue_message(p_phone text, p_name text, p_text text, p_order_id uuid default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_ref text;
begin
  if coalesce(trim(p_phone), '') = '' then return; end if;
  select order_no into v_ref from orders where id = p_order_id;
  insert into notifications (order_id, to_phone, to_name, message, template_params)
  values (p_order_id, p_phone, p_name,
          'Hi ' || coalesce(nullif(p_name, ''), 'there') || ', ' ||
            case when v_ref is not null then 'order ' || v_ref || ': ' else '' end || p_text,
          jsonb_build_array(coalesce(nullif(p_name, ''), 'there'), coalesce(v_ref, 'crackers.org.in'), p_text));
end $$;

-- Same message format as before, now a wrapper.
create or replace function queue_notification(p_order_id uuid, p_text text) returns void
language plpgsql security definer set search_path = public as $$
declare o orders;
begin
  select * into o from orders where id = p_order_id;
  if o.id is null then return; end if;
  perform queue_message(o.ship_phone, o.ship_name, p_text, o.id);
end $$;

-- Used by the approval action to link an existing login instead of creating a second one.
create or replace function find_user_by_email(p_email text) returns uuid
language sql stable security definer set search_path = public, auth as $$
  select id from auth.users where lower(email) = lower(trim(p_email)) order by created_at limit 1;
$$;

-- =====================================================================
-- 8. place_order with order type
-- =====================================================================
drop function if exists place_order(jsonb, jsonb, boolean);

-- p_items: [{"product_id": "...", "qty": 2}, ...]
-- p_ship:  {"name","phone","address","city","state","pincode"}
create or replace function place_order(p_items jsonb, p_ship jsonb, p_order_type text default 'retail')
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_order_id uuid;
  v_pin text := trim(p_ship->>'pincode');
  v_state text := trim(p_ship->>'state');
  v_total numeric := 0;
  v_min numeric;
  v_seller record;
  v_sub_id uuid;
  v_bulk boolean := p_order_type = 'bulk';
  v_gstin text;
  v_shop_name text;
begin
  if v_uid is null then raise exception 'Sign in to place an order'; end if;
  if p_order_type not in ('retail', 'bulk') then raise exception 'Unknown order type'; end if;
  if v_pin !~ '^\d{6}$' then raise exception 'Enter a valid 6-digit PIN code'; end if;
  if coalesce(trim(p_ship->>'name'), '') = '' or coalesce(p_ship->>'phone', '') !~ '^\+?\d{10,13}$' then
    raise exception 'Enter your name and a valid mobile number';
  end if;
  if exists (select 1 from blocked_areas
             where (kind = 'pincode' and value = v_pin)
                or (kind = 'state' and lower(value) = lower(v_state))) then
    raise exception 'Delivery is not available in your area due to local regulations';
  end if;
  if v_bulk then
    if not is_bulk_buyer() then
      raise exception 'Bulk prices are not active on your account. Place a regular order, or renew your licence from My account.';
    end if;
    select gstin, shop_name into v_gstin, v_shop_name from bulk_applications where user_id = v_uid;
  end if;
  if jsonb_array_length(coalesce(p_items, '[]'::jsonb)) = 0 then raise exception 'Your estimate is empty'; end if;

  -- Price every line on the server. Bulk orders use the bulk price where there is one.
  drop table if exists _lines;
  create temp table _lines on commit drop as
  select p.id as product_id, p.name, p.seller_id, s.shop_id, s.min_order,
         (i->>'qty')::int as qty,
         case when v_bulk then coalesce(b.bulk_price, p.price) else p.price end as unit_price
  from jsonb_array_elements(p_items) i
  join products p on p.id = (i->>'product_id')::uuid
  join sellers s on s.id = p.seller_id
  left join product_bulk_prices b on b.product_id = p.id
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

  if v_bulk then
    v_min := bulk_min_order();
    if v_total < v_min then
      raise exception 'Bulk orders must be at least %. Add % more or place a regular order.',
        format_inr(v_min), format_inr(v_min - v_total);
    end if;
  end if;

  insert into orders (order_no, customer_id, ship_name, ship_phone, ship_address, ship_city, ship_state,
                      ship_pincode, order_type, payment_method, buyer_gstin, buyer_shop_name, total)
  values ('ORD-' || nextval('order_no_seq'), v_uid, trim(p_ship->>'name'), p_ship->>'phone',
          trim(p_ship->>'address'), trim(p_ship->>'city'), v_state, v_pin,
          p_order_type, case when v_bulk then 'bank_transfer' else 'upi' end, v_gstin, v_shop_name, v_total)
  returning id into v_order_id;

  for v_seller in
    select seller_id, shop_id, sum(unit_price * qty) as subtotal from _lines group by 1, 2
  loop
    insert into sub_orders (order_id, seller_id, shop_id, subtotal, ship_name, ship_city, ship_pincode, ship_phone_masked,
                            order_type, buyer_gstin, buyer_shop_name)
    values (v_order_id, v_seller.seller_id, v_seller.shop_id, v_seller.subtotal, trim(p_ship->>'name'),
            trim(p_ship->>'city'), v_pin, mask_phone(p_ship->>'phone'), p_order_type, v_gstin, v_shop_name)
    returning id into v_sub_id;

    insert into order_items (sub_order_id, product_id, name, price, qty)
    select v_sub_id, product_id, name, unit_price, qty from _lines where seller_id = v_seller.seller_id;

    insert into pickup_otps (sub_order_id, otp) values (v_sub_id, lpad((floor(random() * 10000))::int::text, 4, '0'));
  end loop;

  insert into order_events (order_id, status, note)
  values (v_order_id, 'payment_pending', case when v_bulk then 'Bulk order placed' else 'Order placed' end);
  return v_order_id;
end $$;

-- =====================================================================
-- 9. submit_payment: UPI (12 digits) or bank transfer (10–22 letters/numbers)
-- =====================================================================
drop function if exists submit_payment(uuid, text, text);

create or replace function submit_payment(p_order_id uuid, p_ref text, p_proof_path text)
returns void language plpgsql security definer set search_path = public as $$
declare v_method text; v_ref text := upper(trim(coalesce(p_ref, '')));
begin
  select payment_method into v_method from orders where id = p_order_id and customer_id = auth.uid();
  if v_method is null then raise exception 'This order cannot accept a payment now'; end if;
  if v_method = 'upi' and v_ref !~ '^\d{12}$' then
    raise exception 'UTR must be a 12-digit number';
  end if;
  if v_method = 'bank_transfer' and v_ref !~ '^[A-Z0-9]{10,22}$' then
    raise exception 'Bank reference must be 10 to 22 letters or numbers. Find it in your bank app or on the receipt.';
  end if;
  update orders set utr = v_ref, proof_path = coalesce(p_proof_path, proof_path),
         status = 'payment_submitted', payment_submitted_at = now()
  where id = p_order_id and customer_id = auth.uid() and status in ('payment_pending', 'payment_submitted');
  if not found then raise exception 'This order cannot accept a payment now'; end if;
  insert into order_events (order_id, status, note)
  values (p_order_id, 'payment_submitted', case when v_method = 'upi' then 'UTR ' else 'Bank ref ' end || v_ref);
end $$;

-- =====================================================================
-- 10. Bulk application admin + owner functions
-- =====================================================================
create or replace function admin_reject_bulk_application(p_id uuid, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
declare a bulk_applications;
begin
  if not is_admin() then raise exception 'Not allowed'; end if;
  if coalesce(trim(p_reason), '') = '' then raise exception 'Choose or type a reason'; end if;
  update bulk_applications
     set status = 'rejected', admin_note = trim(p_reason), reviewed_by = auth.uid(), reviewed_at = now(), updated_at = now()
   where id = p_id and status in ('pending', 'renewal_pending')
  returning * into a;
  if a.id is null then raise exception 'This application is not waiting for review'; end if;
  perform queue_message(a.phone, a.owner_name,
    'your bulk buyer application ' || a.application_no || ' was not approved: ' || trim(p_reason) ||
    '. Fix it and apply again: ' || site_url() || '/bulk/apply?resubmit=' || a.application_no);
end $$;

-- Suspend an approved buyer, reactivate a suspended one, or approve a licence renewal.
create or replace function admin_set_bulk_status(p_id uuid, p_status text, p_note text) returns void
language plpgsql security definer set search_path = public as $$
declare a bulk_applications;
begin
  if not is_admin() then raise exception 'Not allowed'; end if;
  select * into a from bulk_applications where id = p_id for update;
  if a.id is null then raise exception 'Application not found'; end if;
  if p_status = 'suspended' and a.status = 'approved' then
    null;
  elsif p_status = 'approved' and a.status in ('suspended', 'renewal_pending') and a.user_id is not null then
    null;
  else
    raise exception 'Cannot change % to %', a.status, p_status;
  end if;
  update bulk_applications
     set status = p_status, admin_note = nullif(trim(coalesce(p_note, '')), ''),
         reviewed_by = auth.uid(), reviewed_at = now(), updated_at = now()
   where id = p_id;
  perform queue_message(a.phone, a.owner_name,
    case
      when p_status = 'suspended' then 'bulk prices on your account are paused' ||
        coalesce(': ' || nullif(trim(coalesce(p_note, '')), ''), '') || '. Contact support for help.'
      when a.status = 'renewal_pending' then 'your licence renewal is approved. Bulk prices are active again.'
      else 'bulk prices on your account are active again.'
    end);
end $$;

-- Owner sends a new licence. Bulk access stays off until the admin approves it.
create or replace function request_bulk_renewal(p_licence_number text, p_licence_expiry date, p_document_paths text[])
returns void language plpgsql security definer set search_path = public as $$
declare a bulk_applications; v_path text;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  select * into a from bulk_applications where user_id = auth.uid() for update;
  if a.id is null then raise exception 'No bulk buyer account found'; end if;
  if a.status not in ('approved', 'renewal_pending', 'rejected') then
    raise exception 'Your account cannot be renewed right now. Contact support.';
  end if;
  if coalesce(trim(p_licence_number), '') = '' then raise exception 'Enter the licence number'; end if;
  if p_licence_expiry is null or p_licence_expiry <= current_date then
    raise exception 'The new licence must be valid after today';
  end if;
  if coalesce(array_length(p_document_paths, 1), 0) = 0 then raise exception 'Upload the new licence'; end if;
  foreach v_path in array p_document_paths loop
    if v_path not like 'applications/' || a.id || '/%'
       or not exists (select 1 from storage.objects where bucket_id = 'bulk-docs' and name = v_path) then
      raise exception 'Upload the licence again, then submit';
    end if;
  end loop;
  update bulk_applications
     set licence_number = trim(p_licence_number), licence_expiry = p_licence_expiry,
         document_paths = p_document_paths, status = 'renewal_pending', admin_note = null, updated_at = now()
   where id = a.id;
end $$;

-- =====================================================================
-- 11. Row level security
-- =====================================================================
alter table app_settings enable row level security;
alter table bulk_applications enable row level security;
alter table product_bulk_prices enable row level security;
alter table step_up_otps enable row level security;
alter table rate_limits enable row level security;

create policy settings_read on app_settings for select using (
  scope = 'public'
  or (scope = 'bulk' and (is_bulk_buyer() or is_admin()))
  or (scope = 'admin' and is_admin())
);
create policy settings_admin_insert on app_settings for insert with check (is_admin());
create policy settings_admin_update on app_settings for update using (is_admin()) with check (is_admin());

create policy bulk_apps_read on bulk_applications for select using (is_admin() or user_id = auth.uid());
revoke insert, update, delete on bulk_applications from anon, authenticated;

create policy bulk_prices_read on product_bulk_prices for select using (
  is_bulk_buyer()
  or is_admin()
  or exists (select 1 from products p where p.id = product_id and p.seller_id = my_seller_id())
);
create policy bulk_prices_write on product_bulk_prices for all using (
  is_admin() or exists (select 1 from products p where p.id = product_id and p.seller_id = my_seller_id())
) with check (
  is_admin() or exists (select 1 from products p where p.id = product_id and p.seller_id = my_seller_id())
);
revoke all on product_bulk_prices from anon;

-- No policies: only the service role (server code) can touch these.
revoke all on step_up_otps, rate_limits from anon, authenticated;

-- Internal helpers must not be callable from the browser (they could be used to send spam).
revoke execute on function queue_message(text, text, text, uuid) from public, anon, authenticated;
revoke execute on function queue_notification(uuid, text) from public, anon, authenticated;
revoke execute on function find_user_by_email(text) from public, anon, authenticated;
revoke execute on function admin_reject_bulk_application(uuid, text) from public, anon;
revoke execute on function admin_set_bulk_status(uuid, text, text) from public, anon;
revoke execute on function request_bulk_renewal(text, date, text[]) from public, anon;
revoke execute on function place_order(jsonb, jsonb, text) from public, anon;
revoke execute on function submit_payment(uuid, text, text) from public, anon;

-- =====================================================================
-- 12. Storage: private bucket for bulk buyer documents
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('bulk-docs', 'bulk-docs', false, 8388608, array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- No insert policy: uploads only happen through signed upload URLs created on the server.
create policy "bulk docs read" on storage.objects for select to authenticated using (
  bucket_id = 'bulk-docs' and (
    is_admin()
    or exists (select 1 from bulk_applications a
               where a.user_id = auth.uid() and a.status = 'approved'
                 and storage.objects.name like 'applications/' || a.id || '/%')
  )
);

commit;
