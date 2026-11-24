-- Tests for 0003_bulk_buyers_and_auth.sql. Run with `npm run test:sql`.
-- Each check writes a row to test_results; the runner fails if any row has ok = false.

create table test_results (n serial, name text not null, ok boolean, detail text);  -- null ok = fail
create table test_ctx (k text primary key, id uuid);
grant all on test_results, test_ctx to anon, authenticated;
grant usage on sequence test_results_n_seq to anon, authenticated;

-- ---------- Fixtures (as superuser) ----------
-- Users: A admin, C customer, B bulk buyer, E bulk buyer with expired licence, S1/S2 sellers
-- C signs up with phone OTP only (Supabase stores the number without '+').
insert into auth.users (id, phone) values ('00000000-0000-0000-0000-0000000000c1', '919876500001');
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000a1', 'admin@test.in', '{"full_name":"Admin"}'),
  ('00000000-0000-0000-0000-0000000000b1', 'bulk@test.in', '{"full_name":"Bulk Owner"}'),
  ('00000000-0000-0000-0000-0000000000e1', 'expired@test.in', '{"full_name":"Expired Owner"}'),
  ('00000000-0000-0000-0000-0000000000d1', 's1@test.in', '{"full_name":"Seller One"}'),
  ('00000000-0000-0000-0000-0000000000d2', 's2@test.in', '{"full_name":"Seller Two"}');

update profiles set role = 'admin' where id = '00000000-0000-0000-0000-0000000000a1';
update profiles set role = 'seller' where id in ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000d2');

insert into sellers (id, user_id, shop_id, company_name, gst_number, contact_phone, email, address, licence_number, status, min_order) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000d1', '11111', 'S1 Fireworks', '33AAAAA0000A1Z5', '+919800000001', 's1@test.in', 'Sivakasi', 'L1', 'approved', 1000),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000000d2', '22222', 'S2 Fireworks', '33BBBBB0000B1Z5', '+919800000002', 's2@test.in', 'Sivakasi', 'L2', 'approved', 1000);

-- P1: S1, price 1000, bulk 800. P2: S1, price 500, no bulk price. P3: S2, price 2000, bulk 1500.
insert into products (id, seller_id, name, mrp, price) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'P1 Gift box', 1500, 1000),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'P2 Sparklers', 600, 500),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'P3 Shots', 2500, 2000);
insert into product_bulk_prices (product_id, bulk_price) values
  ('20000000-0000-0000-0000-000000000001', 800),
  ('20000000-0000-0000-0000-000000000003', 1500);

insert into bulk_applications (shop_name, owner_name, phone, email, address, city, state, pincode, gstin,
                               licence_number, licence_expiry, document_paths, status, user_id) values
  ('Bulk Traders', 'Bulk Owner', '+919876500002', 'bulk@test.in', '1 Main Rd', 'Madurai', 'Tamil Nadu', '625001',
   '33ABCDE1234F1Z5', 'LIC-B', current_date + 365, '{applications/x/a.pdf}', 'approved', '00000000-0000-0000-0000-0000000000b1'),
  ('Old Traders', 'Expired Owner', '+919876500003', 'expired@test.in', '2 Main Rd', 'Salem', 'Tamil Nadu', '636001',
   '33ZYXWV1234F1Z5', 'LIC-E', current_date - 1, '{applications/y/a.pdf}', 'approved', '00000000-0000-0000-0000-0000000000e1');
update profiles set account_type = 'bulk'
 where id in ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000e1');

-- ---------- 1. Customers and visitors never see bulk prices or bulk settings ----------
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000c1', false);
insert into test_results (name, ok, detail)
  select '1a customer gets 0 rows from product_bulk_prices', count(*) = 0, count(*)::text from product_bulk_prices;
insert into test_results (name, ok, detail)
  select '1b customer cannot see bulk settings', count(*) = 0, count(*)::text from app_settings where scope = 'bulk';
insert into test_results (name, ok, detail)
  select '1c customer can read bulk_min_order', count(*) = 1, count(*)::text from app_settings where key = 'bulk_min_order';

reset role;
set role anon;
select set_config('request.jwt.claim.sub', '', false);
do $$
declare n int; s int;
begin
  begin
    select count(*) into n from product_bulk_prices;
  exception when insufficient_privilege then n := 0;
  end;
  select count(*) into s from app_settings where scope = 'bulk';
  insert into test_results (name, ok, detail) values ('1d anon gets 0 bulk prices', n = 0, n::text);
  insert into test_results (name, ok, detail) values ('1e anon cannot see bulk settings', s = 0, s::text);
end $$;
reset role;

-- ---------- 2. account_type in sign-up metadata is ignored; phone sign-ups get their phone ----------
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000f1', 'sneaky@test.in', '{"account_type":"bulk","full_name":"Sneaky","role":"admin"}');
insert into test_results (name, ok, detail)
  select '2a signUp metadata account_type=bulk still makes a customer',
         account_type = 'customer' and role = 'customer', account_type || '/' || role
    from profiles where id = '00000000-0000-0000-0000-0000000000f1';
insert into test_results (name, ok, detail)
  select '2b phone sign-up stores +phone and no name', phone = '+919876500001' and full_name is null, coalesce(phone, 'null')
    from profiles where id = '00000000-0000-0000-0000-0000000000c1';

-- ---------- 3. A customer cannot make themselves a bulk buyer ----------
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000c1', false);
do $$
declare ok boolean := false;
begin
  begin
    update profiles set account_type = 'bulk' where id = auth.uid();
  exception when insufficient_privilege then ok := true;
  end;
  insert into test_results (name, ok, detail) values ('3a customer cannot update profiles.account_type', ok, '');
  update profiles set full_name = 'Kumar' where id = auth.uid();
  insert into test_results (name, ok, detail)
    select '3b customer can still update full_name', full_name = 'Kumar', full_name from profiles where id = auth.uid();
end $$;
reset role;

-- ---------- 4. Bulk minimum and bulk pricing ----------
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b1', false);
do $$
declare msg text := ''; v_id uuid; o record; p1 numeric; p2 numeric;
  ship jsonb := '{"name":"Bulk Traders","phone":"+919876500002","address":"1 Main Rd","city":"Madurai","state":"Tamil Nadu","pincode":"625001"}';
begin
  insert into test_results (name, ok, detail)
    select '4a bulk buyer can read bulk prices', count(*) = 2, count(*)::text from product_bulk_prices;

  -- 10 × 800 = 8,000: below the minimum
  begin
    perform place_order('[{"product_id":"20000000-0000-0000-0000-000000000001","qty":10}]', ship, 'bulk');
  exception when others then msg := sqlerrm;
  end;
  insert into test_results (name, ok, detail) values ('4b bulk order below minimum fails',
    msg = 'Bulk orders must be at least ₹5,00,000. Add ₹4,92,000 more or place a regular order.', msg);

  -- 500 × 800 (bulk) + 200 × 500 (no bulk price → normal) = 5,00,000: exactly the minimum
  v_id := place_order('[{"product_id":"20000000-0000-0000-0000-000000000001","qty":500},
                        {"product_id":"20000000-0000-0000-0000-000000000002","qty":200}]', ship, 'bulk');
  insert into test_ctx values ('bulk_order', v_id);
  select * into o from orders where id = v_id;
  select price into p1 from order_items i join sub_orders s on s.id = i.sub_order_id
   where s.order_id = v_id and i.product_id = '20000000-0000-0000-0000-000000000001';
  select price into p2 from order_items i join sub_orders s on s.id = i.sub_order_id
   where s.order_id = v_id and i.product_id = '20000000-0000-0000-0000-000000000002';
  insert into test_results (name, ok, detail) values ('4c bulk order at minimum succeeds',
    o.total = 500000 and o.order_type = 'bulk' and o.payment_method = 'bank_transfer', o.total || ' ' || o.order_type || ' ' || o.payment_method);
  insert into test_results (name, ok, detail) values ('4d bulk order uses the bulk price', p1 = 800, p1::text);
  insert into test_results (name, ok, detail) values ('4e item without bulk price uses normal price', p2 = 500, p2::text);
  insert into test_results (name, ok, detail) values ('4f GSTIN and shop name copied from application',
    o.buyer_gstin = '33ABCDE1234F1Z5' and o.buyer_shop_name = 'Bulk Traders', coalesce(o.buyer_gstin, 'null'));

  -- A bulk buyer can still place a regular order at normal prices
  v_id := place_order('[{"product_id":"20000000-0000-0000-0000-000000000001","qty":1}]', ship, 'retail');
  select * into o from orders where id = v_id;
  insert into test_results (name, ok, detail) values ('4g bulk buyer regular order uses normal prices',
    o.total = 1000 and o.order_type = 'retail' and o.payment_method = 'upi', o.total::text);
end $$;
reset role;

-- ---------- 5. Expired licence switches bulk off ----------
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000e1', false);
do $$
declare msg text := ''; n int;
begin
  begin
    perform place_order('[{"product_id":"20000000-0000-0000-0000-000000000001","qty":700}]',
      '{"name":"Old","phone":"+919876500003","address":"2 Main Rd","city":"Salem","state":"Tamil Nadu","pincode":"636001"}', 'bulk');
  exception when others then msg := sqlerrm;
  end;
  insert into test_results (name, ok, detail) values ('5a expired licence cannot place bulk order', msg like 'Bulk prices are not active%', msg);
  select count(*) into n from product_bulk_prices;
  insert into test_results (name, ok, detail) values ('5b expired licence reads 0 bulk prices', n = 0, n::text);
end $$;
reset role;

-- ---------- 6. Non-bulk user cannot place a bulk order ----------
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000c1', false);
do $$
declare msg text := ''; v_id uuid;
begin
  begin
    perform place_order('[{"product_id":"20000000-0000-0000-0000-000000000001","qty":700}]',
      '{"name":"Kumar","phone":"+919876500001","address":"3 St","city":"Chennai","state":"Tamil Nadu","pincode":"600001"}', 'bulk');
  exception when others then msg := sqlerrm;
  end;
  insert into test_results (name, ok, detail) values ('6a customer place_order(bulk) fails', msg like 'Bulk prices are not active%', msg);

  -- Retail order for test 7
  v_id := place_order('[{"product_id":"20000000-0000-0000-0000-000000000002","qty":2}]',
      '{"name":"Kumar","phone":"+919876500001","address":"3 St","city":"Chennai","state":"Tamil Nadu","pincode":"600001"}', 'retail');
  insert into test_ctx values ('upi_order', v_id);
end $$;
reset role;

-- ---------- 7. Payment reference rules ----------
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b1', false);
do $$
declare ok boolean := true; v_utr text;
begin
  begin
    perform submit_payment((select id from test_ctx where k = 'bulk_order'), 'ABCD1234567890123456XY', null);
  exception when others then ok := false;
  end;
  select utr into v_utr from orders where id = (select id from test_ctx where k = 'bulk_order');
  insert into test_results (name, ok, detail) values ('7a 22-char RTGS ref accepted for bank transfer',
    ok and v_utr = 'ABCD1234567890123456XY', coalesce(v_utr, 'null'));
end $$;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000c1', false);
do $$
declare msg text := '';
begin
  begin
    perform submit_payment((select id from test_ctx where k = 'upi_order'), 'ABCD1234567890123456XY', null);
  exception when others then msg := sqlerrm;
  end;
  insert into test_results (name, ok, detail) values ('7b 22-char ref rejected for UPI order', msg = 'UTR must be a 12-digit number', msg);
  perform submit_payment((select id from test_ctx where k = 'upi_order'), '123456789012', null);
  insert into test_results (name, ok, detail)
    select '7c 12-digit UTR still accepted for UPI', status = 'payment_submitted', status::text
      from orders where id = (select id from test_ctx where k = 'upi_order');
end $$;
reset role;

-- ---------- 8. Sellers manage bulk prices only for their own products ----------
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000d1', false);
do $$
declare n int; ok boolean := false;
begin
  insert into product_bulk_prices (product_id, bulk_price) values ('20000000-0000-0000-0000-000000000002', 450);
  insert into test_results (name, ok, detail)
    select '8a seller adds bulk price to own product', count(*) = 1, '' from product_bulk_prices
     where product_id = '20000000-0000-0000-0000-000000000002' and bulk_price = 450;

  select count(*) into n from product_bulk_prices where product_id = '20000000-0000-0000-0000-000000000003';
  insert into test_results (name, ok, detail) values ('8b seller cannot read another shop''s bulk price', n = 0, n::text);

  update product_bulk_prices set bulk_price = 1 where product_id = '20000000-0000-0000-0000-000000000003';
  get diagnostics n = row_count;
  insert into test_results (name, ok, detail) values ('8c seller cannot update another shop''s bulk price', n = 0, n::text);

  delete from product_bulk_prices where product_id = '20000000-0000-0000-0000-000000000003';
  get diagnostics n = row_count;
  insert into test_results (name, ok, detail) values ('8d seller cannot delete another shop''s bulk price', n = 0, n::text);

  begin
    insert into product_bulk_prices (product_id, bulk_price) values ('20000000-0000-0000-0000-000000000003', 1);
  exception when insufficient_privilege then ok := true;
  end;
  insert into test_results (name, ok, detail) values ('8e seller cannot add bulk price to another shop''s product', ok, '');
end $$;
reset role;
insert into test_results (name, ok, detail)
  select '8f other shop''s bulk price unchanged', bulk_price = 1500, bulk_price::text
    from product_bulk_prices where product_id = '20000000-0000-0000-0000-000000000003';

-- ---------- 9. Extra hardening ----------
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000c1', false);
do $$
declare ok boolean := false; ok2 boolean := false; ok3 boolean := false;
begin
  begin
    perform queue_message('+919999999999', 'x', 'spam');
  exception when insufficient_privilege then ok := true;
  end;
  insert into test_results (name, ok, detail) values ('9a users cannot call queue_message', ok, '');
  begin
    insert into bulk_applications (shop_name, owner_name, phone, email, address, city, state, pincode, gstin, licence_number, licence_expiry)
    values ('x', 'x', '+919999999999', 'x@x.in', 'x', 'x', 'x', '600001', '33ABCDE1234F1Z5', 'x', current_date + 10);
  exception when insufficient_privilege then ok2 := true;
  end;
  insert into test_results (name, ok, detail) values ('9b users cannot insert bulk applications directly', ok2, '');
  begin
    perform 1 from step_up_otps;
  exception when insufficient_privilege then ok3 := true;
  end;
  insert into test_results (name, ok, detail) values ('9c users cannot read step_up_otps', ok3, '');
  ok := false;
  begin
    perform find_user_by_email('admin@test.in');
  exception when insufficient_privilege then ok := true;
  end;
  insert into test_results (name, ok, detail) values ('9f users cannot look up accounts by email', ok, '');
end $$;
reset role;

-- Admin can reject and the applicant gets a WhatsApp with the resubmit link
insert into bulk_applications (id, shop_name, owner_name, phone, email, address, city, state, pincode, gstin, licence_number, licence_expiry)
values ('30000000-0000-0000-0000-000000000001', 'New Shop', 'New Owner', '+919876500009', 'new@test.in', 'x', 'Theni', 'Tamil Nadu', '625531',
        '33QWERT1234F1Z5', 'LIC-N', current_date + 100);
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', false);
select admin_reject_bulk_application('30000000-0000-0000-0000-000000000001', 'Licence copy unclear');
reset role;
insert into test_results (name, ok, detail)
  select '9d reject queues WhatsApp with resubmit link', count(*) = 1, max(message) from notifications
   where to_phone = '+919876500009' and message like '%/bulk/apply?resubmit=BLK-%';
insert into test_results (name, ok, detail)
  select '9e format_inr uses Indian grouping', format_inr(500000) = '₹5,00,000' and format_inr(12345678) = '₹1,23,45,678',
         format_inr(12345678);
insert into test_results (name, ok, detail)
  select '9g service role finds user by email', find_user_by_email('ADMIN@test.in') = '00000000-0000-0000-0000-0000000000a1', '';
