import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSession } from '@/lib/auth';
import type { Product } from '@/lib/types';
import { discountPct, inr } from '@/lib/format';
import { ProductImage } from '@/components/ProductCard';
import { QtyAdd } from './QtyAdd';
import { Badge, Icon } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function ProductPage({ params }: { params: { id: string } }) {
  const { supabase, profile } = await getSession();
  const { data } = await supabase.from('products').select('*, categories(name, slug)').eq('id', params.id).maybeSingle();
  if (!data) notFound();
  const p = data as Product & { categories: { name: string; slug: string } | null };
  const { data: shop } = await supabase.from('public_shops').select('min_order').eq('id', p.seller_id).maybeSingle();
  const off = discountPct(p.mrp, p.price);
  const wholesale = profile?.wholesale === 'approved' && p.wholesale_price;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <ProductImage src={p.image_url} alt={p.name} className="aspect-square w-full" />
      <div className="flex flex-col gap-4">
        {p.categories && (
          <Link href={`/products?cat=${p.categories.slug}`} className="text-sm">
            {p.categories.name}
          </Link>
        )}
        <div className="flex flex-wrap gap-1.5">
          {p.is_green && <Badge tone="green">Green cracker</Badge>}
          <Badge tone="gold">Verified seller</Badge>
          {off > 0 && <Badge tone="red">{off}% off</Badge>}
        </div>
        <div>
          <h1 className="text-2xl font-semibold leading-snug">{p.name}</h1>
          <p className="text-sm text-muted">
            Sold by <Link href={`/products?shop=${p.shop_id}`}>Shop {p.shop_id}</Link> · Licence verified
          </p>
        </div>
        <p className="flex items-baseline gap-3">
          <span className="text-3xl font-semibold text-maroon">{inr(p.price)}</span>
          {p.mrp > p.price && <span className="text-[#8A7F72] line-through">MRP {inr(p.mrp)}</span>}
        </p>
        {wholesale ? (
          <p className="rounded-xl bg-[#E8EEF8] px-3 py-2 text-sm text-[#1E3A6B]">
            Wholesale: {inr(p.wholesale_price)} each for {p.wholesale_min_qty} or more (applied when you check out as wholesale).
          </p>
        ) : null}
        {p.pack_info && (
          <div className="rounded-2xl border border-line bg-white p-4 text-sm">
            <p className="mb-1 font-medium">What's inside</p>
            <p className="whitespace-pre-line text-[#4A4238]">{p.pack_info}</p>
          </div>
        )}
        {p.description && <p className="whitespace-pre-line text-sm text-[#4A4238]">{p.description}</p>}
        <div className="grid grid-cols-2 gap-3 text-xs text-[#4A4238]">
          <div className="rounded-xl border border-line bg-white p-3">
            Minimum order from this shop
            <p className="text-sm font-medium text-navy">{inr(shop?.min_order ?? 0)}</p>
          </div>
          <div className="rounded-xl border border-line bg-white p-3">
            Delivery
            <p className="text-sm font-medium text-navy">Lorry parcel, to-pay</p>
          </div>
        </div>
        <QtyAdd product={p} />
        <Link href="/safety" className="flex items-center gap-2 text-sm">
          <Icon name="shield" size={18} /> Read the safety instructions
        </Link>
      </div>
    </div>
  );
}
