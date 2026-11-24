import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import type { Category, Product } from '@/lib/types';
import { ProductCard } from '@/components/ProductCard';
import { Empty } from '@/components/ui';
import { bulkPricesFor } from '@/lib/pricing';
import { getT } from '@/lib/i18n';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Shop crackers' };

const SORTS: Record<string, { col: string; asc: boolean; label: string }> = {
  new: { col: 'created_at', asc: false, label: 'Newest' },
  low: { col: 'price', asc: true, label: 'Price: low to high' },
  high: { col: 'price', asc: false, label: 'Price: high to low' },
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { q?: string; cat?: string; green?: string; sort?: string; shop?: string };
}) {
  const supabase = createClient();
  const { data: cats } = await supabase.from('categories').select('*').order('sort');
  const cat = (cats as Category[] | null)?.find((c) => c.slug === searchParams.cat);
  const sort = SORTS[searchParams.sort ?? 'new'] ?? SORTS.new;

  let query = supabase.from('products').select('*').eq('active', true);
  if (cat) query = query.eq('category_id', cat.id);
  if (searchParams.green === '1') query = query.eq('is_green', true);
  if (searchParams.shop) query = query.eq('shop_id', searchParams.shop);
  const q = searchParams.q?.trim();
  if (q) {
    if (/^\d{5}$/.test(q)) query = query.eq('shop_id', q);
    else query = query.ilike('name', `%${q.replace(/[%_]/g, '')}%`);
  }
  const { data: products } = await query.order(sort.col, { ascending: sort.asc }).limit(120);
  const bulk = await bulkPricesFor((products ?? []).map((p) => p.id as string));
  const noBulk = getT()('price.noBulkShort');

  const link = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { ...searchParams, ...patch };
    Object.entries(merged).forEach(([k, v]) => v && p.set(k, v));
    return `/products?${p.toString()}`;
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold">{cat ? cat.name : q ? `Results for "${q}"` : 'All crackers'}</h1>
        <p className="text-sm text-muted">{products?.length ?? 0} products from verified shops</p>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        <Link href={link({ cat: undefined })} className={chip(!cat)}>
          All
        </Link>
        {(cats as Category[] | null)?.map((c) => (
          <Link key={c.id} href={link({ cat: c.slug })} className={chip(cat?.id === c.id)}>
            {c.name}
          </Link>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Link href={link({ green: searchParams.green === '1' ? undefined : '1' })} className={chip(searchParams.green === '1')}>
          Green crackers only
        </Link>
        <span className="ml-auto text-muted">Sort:</span>
        {Object.entries(SORTS).map(([k, s]) => (
          <Link key={k} href={link({ sort: k })} className={chip((searchParams.sort ?? 'new') === k)}>
            {s.label}
          </Link>
        ))}
      </div>
      {products && products.length ? (
        <div className="stagger grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {(products as Product[]).map((p) => (
            <ProductCard key={p.id} p={p} bulkPrice={bulk ? bulk.get(p.id) ?? null : undefined} labels={{ noBulk }} />
          ))}
        </div>
      ) : (
        <Empty title="No products found" body="Try another category or search term." href="/products" cta="See all crackers" />
      )}
    </div>
  );
}

function chip(active: boolean) {
  return `whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all duration-200 active:scale-95 ${
    active
      ? 'border-maroon bg-gradient-to-b from-[#B52626] to-maroon-dark text-white shadow-[0_4px_12px_-4px_rgba(122,20,20,.6)] hover:text-white'
      : 'border-line bg-white text-navy hover:-translate-y-px hover:border-gold hover:text-maroon hover:shadow-soft'
  }`;
}
