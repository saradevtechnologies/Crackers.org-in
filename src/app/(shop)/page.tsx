import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import type { Category, Product } from '@/lib/types';
import { ProductCard } from '@/components/ProductCard';
import { SparkleTrail } from '@/components/effects';
import { Empty, Icon } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const supabase = createClient();
  const [{ data: cats }, { data: boxes }, { data: latest }] = await Promise.all([
    supabase.from('categories').select('*').order('sort'),
    supabase
      .from('products')
      .select('*, categories!inner(slug)')
      .eq('categories.slug', 'gift-boxes')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(8),
    supabase.from('products').select('*').eq('active', true).order('created_at', { ascending: false }).limit(8),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <SparkleTrail className="relative overflow-hidden rounded-3xl bg-maroon px-6 py-10 text-white sm:px-12">
        <svg width="380" height="380" viewBox="0 0 420 420" aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 opacity-50">
          <g stroke="#F3D99A" strokeWidth="2.5" strokeLinecap="round">
            <path d="M210 210L210 80M210 210L302 118M210 210L340 210M210 210L302 302M210 210L210 340M210 210L118 302M210 210L80 210M210 210L118 118" />
          </g>
        </svg>
        <div className="relative flex max-w-xl flex-col gap-3">
          <p className="text-sm font-medium text-[#F3D99A]">Diwali early booking is open</p>
          <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">Sivakasi crackers, direct from verified sellers</h1>
          <p className="text-[#F6DADA]">
            Up to 80% off MRP. Licensed manufacturers only. Delivered by lorry parcel to your nearest transport office.
          </p>
          <div className="mt-2 flex flex-wrap gap-3">
            <Link href="/products?cat=gift-boxes" className="btn-gold">
              Shop gift boxes
            </Link>
            <Link href="/products" className="btn border border-[#F3D99A] text-white hover:text-white">
              Browse all crackers
            </Link>
          </div>
        </div>
      </SparkleTrail>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Shop by category</h2>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-8 sm:gap-3">
          {(cats as Category[] | null)?.map((c) => (
            <Link
              key={c.id}
              href={`/products?cat=${c.slug}`}
              className="group flex flex-col overflow-hidden items-center gap-1.5 rounded-2xl border border-line bg-white p-1.5 pb-2.5 text-center text-xs text-navy hover:text-navy"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/img/categories/${c.slug}.jpg`}
                alt=""
                loading="lazy"
                className="aspect-square w-full rounded-xl object-cover transition-transform group-hover:scale-105"
              />
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      <ProductRow title="Popular gift boxes" href="/products?cat=gift-boxes" items={boxes as Product[] | null} />
      <ProductRow title="New this season" href="/products" items={latest as Product[] | null} />

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: 'shield' as const, t: 'Licensed sellers only', b: "Every shop's explosives licence is checked before it can list." },
          { icon: 'leaf' as const, t: 'Green crackers marked', b: 'Filter for approved green crackers.' },
          { icon: 'truck' as const, t: 'Updates on WhatsApp', b: 'Payment, dispatch and LR number sent to your phone.' },
        ].map((x) => (
          <div key={x.t} className="rounded-2xl border border-line bg-white p-5">
            <Icon name={x.icon} size={28} className="text-maroon" />
            <p className="mt-2 font-semibold">{x.t}</p>
            <p className="text-sm text-[#4A4238]">{x.b}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

function ProductRow({ title, href, items }: { title: string; href: string; items: Product[] | null }) {
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-xl font-semibold">{title}</h2>
        <Link href={href} className="text-sm font-medium">
          See all
        </Link>
      </div>
      {items && items.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      ) : (
        <Empty title="Products coming soon" body="Sellers are adding their catalogues for the season." />
      )}
    </section>
  );
}
