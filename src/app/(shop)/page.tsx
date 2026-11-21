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
    <div className="flex flex-col gap-12">
      <SparkleTrail className="relative overflow-hidden rounded-3xl bg-[radial-gradient(120%_140%_at_85%_0%,#C23A2A_0%,#9B1C1C_38%,#5E0E0E_100%)] px-6 py-12 text-white shadow-lift sm:px-12 sm:py-14">
        <svg width="420" height="420" viewBox="0 0 420 420" aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 animate-[spin_60s_linear_infinite] opacity-40">
          <g stroke="#F3D99A" strokeWidth="2.5" strokeLinecap="round">
            <path d="M210 210L210 80M210 210L302 118M210 210L340 210M210 210L302 302M210 210L210 340M210 210L118 302M210 210L80 210M210 210L118 118" />
          </g>
          <g fill="#F3D99A">
            {[0, 45, 90, 135, 180, 225, 270, 315].map((d) => (
              <circle key={d} cx={210 + 140 * Math.cos((d * Math.PI) / 180)} cy={210 + 140 * Math.sin((d * Math.PI) / 180)} r="5" />
            ))}
          </g>
        </svg>
        {SPARKS.map((pos) => (
          <span key={pos} aria-hidden="true" className={`absolute h-1.5 w-1.5 animate-twinkle rounded-full bg-[#F3D99A] shadow-[0_0_8px_2px_rgba(243,217,154,.7)] ${pos}`} />
        ))}
        <div className="relative flex max-w-xl flex-col gap-4">
          <p className="inline-flex w-fit animate-fade-up items-center gap-2 rounded-full border border-[#F3D99A]/40 bg-white/10 px-3 py-1 text-xs font-medium text-[#F3D99A] backdrop-blur-sm">
            <span aria-hidden="true">✦</span> Diwali early booking is open
          </p>
          <h1 className="animate-fade-up text-4xl font-bold leading-[1.1] [animation-delay:80ms] sm:text-5xl">
            Sivakasi crackers, <span className="bg-gradient-to-r from-[#FCE7B0] to-gold bg-clip-text pr-1.5 italic text-transparent">direct</span> from
            verified sellers
          </h1>
          <p className="animate-fade-up text-[#F6DADA] [animation-delay:160ms]">
            Up to 80% off MRP. Licensed manufacturers only. Delivered by lorry parcel to your nearest transport office.
          </p>
          <div className="mt-2 flex animate-fade-up flex-wrap gap-3 [animation-delay:240ms]">
            <Link href="/products?cat=gift-boxes" className="btn-gold px-5">
              <Icon name="gift" size={18} />
              Shop gift boxes
            </Link>
            <Link
              href="/products"
              className="btn border border-[#F3D99A]/70 bg-white/5 px-5 text-white backdrop-blur-sm hover:-translate-y-px hover:bg-white/15 hover:text-white"
            >
              Browse all crackers
            </Link>
          </div>
        </div>
      </SparkleTrail>

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

      <ProductRow title="Popular gift boxes" href="/products?cat=gift-boxes" items={boxes as Product[] | null} />
      <ProductRow title="New this season" href="/products" items={latest as Product[] | null} />

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

const SPARKS = [
  'left-[8%] top-6',
  'left-[46%] top-10 [animation-delay:.6s]',
  'right-[30%] bottom-8 [animation-delay:1.2s]',
  'left-[30%] bottom-5 [animation-delay:1.8s]',
  'right-[12%] top-1/2 [animation-delay:.9s]',
];

const FEATURES = [
  { icon: 'shield' as const, t: 'Licensed sellers only', b: "Every shop's explosives licence is checked before it can list." },
  { icon: 'leaf' as const, t: 'Green crackers marked', b: 'Filter for approved green crackers.' },
  { icon: 'truck' as const, t: 'Updates on WhatsApp', b: 'Payment, dispatch and LR number sent to your phone.' },
];

function ProductRow({ title, href, items }: { title: string; href: string; items: Product[] | null }) {
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
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      ) : (
        <Empty title="Products coming soon" body="Sellers are adding their catalogues for the season." />
      )}
    </section>
  );
}
