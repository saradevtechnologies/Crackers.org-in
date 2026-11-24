import Link from 'next/link';
import type { Product } from '@/lib/types';
import { discountPct, inr } from '@/lib/format';
import { sampleImageFor } from '@/lib/sample-images';
import { AddToEstimate } from './AddToEstimate';
import { Badge } from './ui';

export function ProductImage({ src: rawSrc, alt, className = '' }: { src: string | null; alt: string; className?: string }) {
  const src = rawSrc || sampleImageFor(alt);
  if (!src)
    return (
      <div className={`flex items-center justify-center rounded-xl bg-[#F6EBD6] text-xs text-[#8A7456] ${className}`}>
        No photo
      </div>
    );
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" className={`rounded-xl bg-[#F6EBD6] object-cover ${className}`} />;
}

/**
 * `bulkPrice` is only passed for active bulk buyers: a number = their bulk price, null = no bulk price for this item.
 * Leave it undefined for everyone else (nothing about bulk pricing is shown).
 */
export function ProductCard({ p, bulkPrice, labels }: { p: Product; bulkPrice?: number | null; labels?: { noBulk: string } }) {
  const off = discountPct(p.mrp, p.price);
  const isBulkView = bulkPrice !== undefined;
  return (
    <div className="card-hover group flex flex-col gap-1.5 rounded-2xl border border-line bg-white p-3 shadow-soft">
      <Link href={`/products/${p.id}`} className="flex flex-col gap-1.5 text-navy hover:text-navy">
        <div className="relative overflow-hidden rounded-xl">
          <ProductImage
            src={p.image_url}
            alt={p.name}
            className="aspect-[4/3] w-full transition-transform duration-500 ease-out group-hover:scale-[1.06]"
          />
          {off > 0 && (
            <span className="absolute left-2 top-2 rounded-full bg-gradient-to-b from-[#B52626] to-maroon-dark px-2 py-0.5 text-[11px] font-semibold text-white shadow-md">
              {off}% off
            </span>
          )}
          {!p.in_stock && (
            <span className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-navy/60 to-transparent pb-3">
              <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-navy shadow-md">Out of stock</span>
            </span>
          )}
        </div>
        {p.is_green && (
          <div className="flex flex-wrap gap-1.5">
            <Badge tone="green">Green</Badge>
          </div>
        )}
        <p className="line-clamp-2 text-sm font-medium transition-colors group-hover:text-maroon">{p.name}</p>
        {isBulkView && bulkPrice ? (
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-xs text-[#8A7F72] line-through">{inr(p.price)}</span>
            <span className="text-base font-semibold text-[#1E3A6B]">{inr(bulkPrice)}</span>
            <span className="rounded bg-[#E8EEF8] px-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#1E3A6B]">Bulk</span>
          </p>
        ) : (
          <p className="flex flex-wrap items-baseline gap-x-2">
            {p.mrp > p.price && <span className="text-xs text-[#8A7F72] line-through">{inr(p.mrp)}</span>}
            <span className="text-base font-semibold text-maroon">{inr(p.price)}</span>
            {isBulkView && <span className="text-[10px] text-muted">{labels?.noBulk ?? 'No bulk price'}</span>}
          </p>
        )}
      </Link>
      <div className="mt-auto flex items-center justify-between gap-2">
        <span className="text-xs text-muted">Shop {p.shop_id}</span>
        <AddToEstimate product={p} compact />
      </div>
    </div>
  );
}
