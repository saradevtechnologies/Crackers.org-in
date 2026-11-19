import Link from 'next/link';
import type { Product } from '@/lib/types';
import { discountPct, inr } from '@/lib/format';
import { AddToEstimate } from './AddToEstimate';
import { Badge } from './ui';

export function ProductImage({ src, alt, className = '' }: { src: string | null; alt: string; className?: string }) {
  if (!src)
    return (
      <div className={`flex items-center justify-center rounded-xl bg-[#F6EBD6] text-xs text-[#8A7456] ${className}`}>
        No photo
      </div>
    );
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" className={`rounded-xl bg-[#F6EBD6] object-cover ${className}`} />;
}

export function ProductCard({ p }: { p: Product }) {
  const off = discountPct(p.mrp, p.price);
  return (
    <div className="flex flex-col gap-1.5 rounded-2xl border border-line bg-white p-3">
      <Link href={`/products/${p.id}`} className="flex flex-col gap-1.5 text-navy hover:text-navy">
        <ProductImage src={p.image_url} alt={p.name} className="aspect-[4/3] w-full" />
        <div className="flex flex-wrap gap-1.5">
          {p.is_green && <Badge tone="green">Green</Badge>}
          {off > 0 && <Badge tone="red">{off}% off</Badge>}
        </div>
        <p className="line-clamp-2 text-sm font-medium">{p.name}</p>
        <p className="flex items-baseline gap-2">
          {p.mrp > p.price && <span className="text-xs text-[#8A7F72] line-through">{inr(p.mrp)}</span>}
          <span className="text-base font-semibold text-maroon">{inr(p.price)}</span>
        </p>
      </Link>
      <div className="mt-auto flex items-center justify-between gap-2">
        <span className="text-xs text-muted">Shop {p.shop_id}</span>
        <AddToEstimate product={p} compact />
      </div>
    </div>
  );
}
