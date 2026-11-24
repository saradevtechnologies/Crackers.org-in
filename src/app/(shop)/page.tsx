import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import type { Category, Product } from '@/lib/types';
import { ProductCard } from '@/components/ProductCard';
import { HeroCarousel } from '@/components/HeroCarousel';
import { DEFAULT_SLIDES, type HeroSlide } from '@/lib/hero';
import { bulkPricesFor } from '@/lib/pricing';
import { getT } from '@/lib/i18n';
import { Empty, Icon } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const supabase = createClient();
  const [{ data: cats }, { data: boxes }, { data: latest }, { data: heroRows }] = await Promise.all([
    supabase.from('categories').select('*').order('sort'),
    supabase
      .from('products')
      .select('*, categories!inner(slug)')
      .eq('categories.slug', 'gift-boxes')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(8),
    supabase.from('products').select('*').eq('active', true).order('created_at', { ascending: false }).limit(8),
    supabase.from('hero_slides').select('*').eq('active', true).order('sort').order('created_at'),
  ]);
  // Falls back to the original hero if no slides are set up yet (or the table hasn't been created).
  const slides = (heroRows as HeroSlide[] | null)?.length ? (heroRows as HeroSlide[]) : DEFAULT_SLIDES;
  const bulk = await bulkPricesFor([...(boxes ?? []), ...(latest ?? [])].map((p) => p.id as string));
  const noBulk = getT()('price.noBulkShort');

  return (
    <div className="flex flex-col gap-12">
      <HeroCarousel slides={slides} />

      <section>
        <h2 className="section-title mb-4">Shop by category</h2>
        <div className="stagger grid grid-cols-4 gap-2 sm:grid-cols-8 sm:gap-3">
          {(cats as Category[] | null)?.map((c) => (
            <Link
              key={c.id}
              href={`/products?cat=${c.slug}`}
              className="card-hover group flex flex-col items-center gap-1.5 overflow-hidden rounded-2xl border border-line bg-white p-1.5 pb-2.5 text-center text-xs font-medium text-navy shadow-soft hover:text-maroon"
            >
              <span className="block w-full overflow-hidden rounded-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/img/categories/${c.slug}.jpg`}
                  alt=""
                  loading="lazy"
                  className="aspect-square w-full object-cover transition-transform duration-500 group-hover:rotate-2 group-hover:scale-110"
                />
              </span>
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      <ProductRow title="Popular gift boxes" href="/products?cat=gift-boxes" items={boxes as Product[] | null} bulk={bulk} noBulk={noBulk} />
      <ProductRow title="New this season" href="/products" items={latest as Product[] | null} bulk={bulk} noBulk={noBulk} />

      <section className="stagger grid gap-4 sm:grid-cols-3">
        {FEATURES.map((x) => (
          <div key={x.t} className="card-hover group rounded-2xl border border-line bg-white p-5 shadow-soft">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-maroon-light to-gold-light text-maroon transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
              <Icon name={x.icon} size={26} />
            </span>
            <p className="mt-3 font-semibold">{x.t}</p>
            <p className="text-sm text-[#4A4238]">{x.b}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

const FEATURES = [
  { icon: 'shield' as const, t: 'Licensed sellers only', b: "Every shop's explosives licence is checked before it can list." },
  { icon: 'leaf' as const, t: 'Green crackers marked', b: 'Filter for approved green crackers.' },
  { icon: 'truck' as const, t: 'Updates on WhatsApp', b: 'Payment, dispatch and LR number sent to your phone.' },
];

function ProductRow({
  title,
  href,
  items,
  bulk,
  noBulk,
}: {
  title: string;
  href: string;
  items: Product[] | null;
  bulk: Map<string, number> | null;
  noBulk: string;
}) {
  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="section-title">{title}</h2>
        <Link href={href} className="group flex items-center gap-1 text-sm font-medium">
          See all
          <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
            →
          </span>
        </Link>
      </div>
      {items && items.length ? (
        <div className="stagger grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p.id} p={p} bulkPrice={bulk ? bulk.get(p.id) ?? null : undefined} labels={{ noBulk }} />
          ))}
        </div>
      ) : (
        <Empty title="Products coming soon" body="Sellers are adding their catalogues for the season." />
      )}
    </section>
  );
}
