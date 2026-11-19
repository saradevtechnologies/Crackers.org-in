-- Dummy data for local testing: 3 approved seller shops + 40 products.
-- Run AFTER migrations/0001_init.sql, in the Supabase SQL editor.
-- Safe to re-run: existing dummy rows are skipped/refreshed.
--
-- Seller logins (email / password):
--   seller1@example.com / Seller@123   (Sivakasi Star Fireworks)
--   seller2@example.com / Seller@123   (Golden Peacock Crackers)
--   seller3@example.com / Seller@123   (Kaveri Green Crackers)

begin;

-- ---------- Auth users (profiles are created by the on_auth_user_created trigger) ----------
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email,
       crypt('Seller@123', gen_salt('bf')), now(),
       '{"provider":"email","providers":["email"]}'::jsonb,
       jsonb_build_object('full_name', u.full_name, 'phone', u.phone),
       now(), now(), '', '', '', ''
from (values
  ('11111111-1111-1111-1111-111111111111'::uuid, 'seller1@example.com', 'Murugan K',  '9876500001'),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'seller2@example.com', 'Lakshmi R',  '9876500002'),
  ('33333333-3333-3333-3333-333333333333'::uuid, 'seller3@example.com', 'Arjun S',    '9876500003')
) as u(id, email, full_name, phone)
on conflict (id) do nothing;

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id, u.id::text,
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
       'email', now(), now(), now()
from auth.users u
where u.id in ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333')
  and not exists (select 1 from auth.identities i where i.user_id = u.id and i.provider = 'email');

update profiles set role = 'seller'
where id in ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333');

-- ---------- Approved sellers ----------
insert into sellers (id, user_id, shop_id, company_name, gst_number, contact_phone, email, address,
                     licence_number, licence_expiry, upi_id, min_order, status)
values
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '10001',
   'Sivakasi Star Fireworks', '33AABCS1234A1Z5', '9876500001', 'seller1@example.com',
   '12 Sattur Road, Sivakasi, Tamil Nadu 626123', 'PESO/E/SC/TN/20/1001', '2027-12-31', 'sivakasistar@okaxis', 1500, 'approved'),
  ('aaaaaaaa-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', '10002',
   'Golden Peacock Crackers', '33AABCG5678B1Z2', '9876500002', 'seller2@example.com',
   '45 Virudhunagar Main Road, Sivakasi, Tamil Nadu 626189', 'PESO/E/SC/TN/20/1002', '2027-12-31', 'goldenpeacock@okicici', 2000, 'approved'),
  ('aaaaaaaa-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', '10003',
   'Kaveri Green Crackers', '33AABCK9012C1Z8', '9876500003', 'seller3@example.com',
   '7 Industrial Estate, Sattur, Tamil Nadu 626203', 'PESO/E/SC/TN/20/1003', '2027-12-31', 'kaverigreen@oksbi', 1000, 'approved')
on conflict (id) do update set status = 'approved';

-- ---------- Products ----------
-- Remove previous dummy products so re-running doesn't duplicate them.
delete from products where seller_id in (
  'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000003');

insert into products (seller_id, category_id, name, description, pack_info, mrp, price,
                      wholesale_price, wholesale_min_qty, is_green, in_stock)
select p.seller_id::uuid, c.id, p.name, p.description, p.pack_info, p.mrp, p.price,
       p.wholesale_price, p.wholesale_min_qty, p.is_green, p.in_stock
from (values
  -- Sivakasi Star Fireworks
  ('aaaaaaaa-0000-0000-0000-000000000001', 'sparklers',   '10 cm Electric Sparklers',   'Bright crackling silver sparks, ideal for kids.',      '1 box = 10 pcs',   80,   40,   28,  10, true,  true),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'sparklers',   '15 cm Colour Sparklers',     'Multi-colour sparks with long burn time.',             '1 box = 10 pcs',  140,   70,   50,  10, true,  true),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'sparklers',   '30 cm Red Sparklers',        'Extra long sparklers with red flame.',                 '1 box = 5 pcs',   260,  130,   95,  10, false, true),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'flower-pots', 'Flower Pots Big',            'Classic golden fountain, 2 m spray height.',           '1 box = 10 pcs',  360,  180,  130,   5, false, true),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'flower-pots', 'Flower Pots Special',        'Silver and gold fountain with crackling finish.',      '1 box = 10 pcs',  480,  240,  175,   5, false, true),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'chakkars',    'Ground Chakkar Big',         'Fast spinning wheel with golden sparks.',              '1 box = 10 pcs',  240,  120,   85,  10, false, true),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'chakkars',    'Ground Chakkar Deluxe',      'Large wheel with colour change.',                      '1 box = 10 pcs',  400,  200,  145,   5, false, true),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'rockets',     'Baby Rocket',                'Small rockets with whistle.',                          '1 box = 10 pcs',  200,  100,   72,  10, false, true),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'rockets',     'Lunik Express Rocket',       'High-flying rocket with colour burst.',                '1 box = 10 pcs',  560,  280,  205,   5, false, true),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'bombs',       'Hydro Bomb',                 'Loud single-sound bomb.',                              '1 box = 10 pcs',  300,  150,  110,  10, false, true),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'bombs',       'Atom Bomb',                  'Heavy sound, use outdoors only.',                      '1 box = 10 pcs',  420,  210,  150,   5, false, false),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'gift-boxes',  'Family Gift Box 25 Items',   'Assorted pack for the whole family.',                  '25 items',       2400, 1200,  900,   2, false, true),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'gift-boxes',  'Deluxe Gift Box 40 Items',   'Premium assortment with aerial shots.',                '40 items',       4200, 2100, 1600,   2, false, true),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'kids',        'Pencil Crackers',            'Small coloured pencil sparklers.',                     '1 box = 10 pcs',  100,   50,   35,  10, true,  true),

  -- Golden Peacock Crackers
  ('aaaaaaaa-0000-0000-0000-000000000002', 'fancy',       '7 Shot Colour Cracker',      'Seven aerial shots with colour bursts.',               '1 pc',            300,  150,  110,   5, false, true),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'fancy',       '30 Shot Multi Colour',       'Thirty shots, crackling and peacock effects.',         '1 pc',           1200,  600,  450,   3, false, true),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'fancy',       '60 Shot Mega Display',       'Sixty-shot cake for big celebrations.',                '1 pc',           2600, 1300,  980,   2, false, true),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'fancy',       '120 Shot Grand Finale',      'Long-running display with mixed effects.',             '1 pc',           5000, 2500, 1900,   1, false, true),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'fancy',       'Peacock Feather Fountain',   'Fountain with peacock-style colour spray.',            '1 pc',            440,  220,  160,   5, false, true),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'fancy',       'Magic Smoke Colour',         'Colour smoke tubes, low noise.',                       '1 box = 5 pcs',   280,  140,  100,  10, true,  true),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'bombs',       '1000 Wala Garland',          'Thousand-cracker string.',                             '1 pc',            900,  450,  330,   5, false, true),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'bombs',       '5000 Wala Garland',          'Five thousand cracker garland for weddings.',          '1 pc',           4000, 2000, 1500,   2, false, true),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'bombs',       '28 Chorsa',                  'Classic small red crackers.',                          '1 pkt = 50 pcs',  120,   60,   42,  20, false, true),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'rockets',     'Two Sound Rocket',           'Rocket with double bang at peak.',                     '1 box = 10 pcs',  480,  240,  175,   5, false, true),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'flower-pots', 'Colour Koti',                'Multi-colour fountain with tall spray.',               '1 box = 10 pcs',  700,  350,  260,   5, false, true),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'chakkars',    'Spinner Wheel 5 Colour',     'Five-colour spinning wheel.',                          '1 box = 5 pcs',   360,  180,  130,   5, false, true),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'gift-boxes',  'Peacock Premium Box',        'Curated box with fancy and aerial items.',             '35 items',       3600, 1800, 1350,   2, false, true),

  -- Kaveri Green Crackers (mostly green crackers)
  ('aaaaaaaa-0000-0000-0000-000000000003', 'sparklers',   'Green 10 cm Sparklers',      'NEERI-certified low-emission sparklers.',              '1 box = 10 pcs',  100,   55,   40,  10, true,  true),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'sparklers',   'Green 50 cm Sparklers',      'Extra long, low smoke.',                               '1 box = 5 pcs',   500,  260,  190,   5, true,  true),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'flower-pots', 'Green Flower Pots',          'Eco fountain with reduced particulate matter.',        '1 box = 10 pcs',  420,  220,  160,   5, true,  true),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'chakkars',    'Green Ground Chakkar',       'Low-emission spinning wheel.',                         '1 box = 10 pcs',  280,  150,  110,  10, true,  true),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'kids',        'Snake Tablets',              'Harmless glow worm tablets for kids.',                 '1 box = 10 pcs',   60,   30,   20,  20, true,  true),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'kids',        'Twinkling Star',             'Hand-held twinkling sparkle stick.',                   '1 box = 10 pcs',  120,   60,   42,  10, true,  true),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'kids',        'Pop Pop',                    'Snap-on-the-ground poppers.',                          '1 pkt = 50 pcs',   80,   40,   28,  20, true,  true),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'kids',        'Mini Fountain Kids',         'Small safe fountain.',                                 '1 box = 5 pcs',   150,   75,   55,  10, true,  true),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'bombs',       'Green Sound Cracker',        'Reduced decibel sound cracker.',                       '1 box = 10 pcs',  260,  140,  100,  10, true,  true),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'rockets',     'Green Whistle Rocket',       'Low-emission whistling rocket.',                       '1 box = 10 pcs',  380,  200,  145,   5, true,  true),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'fancy',       'Green 12 Shot',              'Eco aerial display, 12 shots.',                        '1 pc',            640,  340,  250,   3, true,  true),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'gift-boxes',  'Green Kids Gift Box',        'Kid-friendly green crackers assortment.',              '20 items',       1400,  750,  560,   2, true,  true),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'gift-boxes',  'Green Family Box',           'All-green family pack.',                               '30 items',       2800, 1500, 1120,   2, true,  false)
) as p(seller_id, category_slug, name, description, pack_info, mrp, price, wholesale_price, wholesale_min_qty, is_green, in_stock)
join categories c on c.slug = p.category_slug;

commit;

-- Quick check
select s.company_name, count(p.*) as products
from sellers s left join products p on p.seller_id = s.id
group by s.company_name order by s.company_name;
