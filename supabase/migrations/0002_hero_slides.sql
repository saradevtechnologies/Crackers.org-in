-- Home page hero carousel, managed from Admin → Hero slides.
-- Run this once in the Supabase SQL editor after 0001_init.sql.

create table if not exists hero_slides (
  id uuid primary key default gen_random_uuid(),
  sort int not null default 0,
  active boolean not null default true,
  badge text,                 -- small pill above the heading (offer / tag line)
  title text not null,        -- wrap words in *stars* to show them in gold italic
  subtitle text,
  offer text,                 -- optional big offer line, e.g. "Flat 80% OFF"
  primary_label text,
  primary_href text,
  secondary_label text,
  secondary_href text,
  image_url text,             -- background image; empty keeps the maroon gradient
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table hero_slides enable row level security;

drop policy if exists hero_read on hero_slides;
create policy hero_read on hero_slides for select using (active or is_admin());
drop policy if exists hero_admin on hero_slides;
create policy hero_admin on hero_slides for all using (is_admin()) with check (is_admin());

-- Public bucket for site banners. Only admins can upload, change or delete.
insert into storage.buckets (id, name, public) values ('site-images', 'site-images', true)
on conflict (id) do nothing;

drop policy if exists "site images read" on storage.objects;
create policy "site images read" on storage.objects for select using (bucket_id = 'site-images');
drop policy if exists "site images admin insert" on storage.objects;
create policy "site images admin insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'site-images' and is_admin());
drop policy if exists "site images admin update" on storage.objects;
create policy "site images admin update" on storage.objects for update to authenticated
  using (bucket_id = 'site-images' and is_admin());
drop policy if exists "site images admin delete" on storage.objects;
create policy "site images admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'site-images' and is_admin());

-- Starter slides. The first one is the original hero, unchanged.
insert into hero_slides (sort, badge, title, subtitle, offer, primary_label, primary_href, secondary_label, secondary_href, image_url)
select * from (values
  (1, 'Diwali early booking is open', 'Sivakasi crackers, *direct* from verified sellers',
   'Up to 80% off MRP. Licensed manufacturers only. Delivered by lorry parcel to your nearest transport office.',
   null, 'Shop gift boxes', '/products?cat=gift-boxes', 'Browse all crackers', '/products', null),
  (2, 'Festival offer', 'Gift boxes for the *whole* family',
   'Hand-picked assortments from licensed Sivakasi makers. One box, every kind of cracker.',
   'Flat 70% OFF', 'Shop gift boxes', '/products?cat=gift-boxes', 'See kids crackers', '/products?cat=kids', '/img/categories/gift-boxes.jpg'),
  (3, 'New this season', 'Light up the sky with *aerial* shots',
   'Multi-colour shots, rockets and grand finales. Compare prices across verified shops.',
   'Up to 80% OFF', 'Shop aerial crackers', '/products?cat=fancy', 'Browse rockets', '/products?cat=rockets', '/img/categories/fancy.jpg')
) as v(sort, badge, title, subtitle, offer, primary_label, primary_href, secondary_label, secondary_href, image_url)
where not exists (select 1 from hero_slides);
