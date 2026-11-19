'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { estimate, useEstimate, type EstimateLine } from '@/lib/estimate';
import { inr } from '@/lib/format';
import { COPY } from '@/lib/copy';
import { ProductImage } from '@/components/ProductCard';
import { Empty, Icon } from '@/components/ui';

export default function EstimatePage() {
  const lines = useEstimate();
  const [minOrders, setMinOrders] = useState<Record<string, number>>({});
  const [unavailable, setUnavailable] = useState<string[]>([]);

  // Refresh prices, stock and shop minimums from the server
  const ids = lines.map((l) => l.productId).join(',');
  useEffect(() => {
    if (!ids) return;
    const supabase = createClient();
    (async () => {
      const { data: products } = await supabase
        .from('products')
        .select('id, price, mrp, name, in_stock, active, image_url, seller_id, shop_id')
        .in('id', ids.split(','));
      const found = new Map((products ?? []).map((p) => [p.id, p]));
      const gone: string[] = [];
      const fresh: EstimateLine[] = estimate.snapshot().map((l) => {
        const p = found.get(l.productId);
        if (!p || !p.in_stock || !p.active) {
          gone.push(l.productId);
          return l;
        }
        return { ...l, price: Number(p.price), mrp: Number(p.mrp), name: p.name, image: p.image_url, shopId: p.shop_id, sellerId: p.seller_id };
      });
      setUnavailable(gone);
      if (JSON.stringify(fresh) !== JSON.stringify(estimate.snapshot())) estimate.replace(fresh);
      const sellerIds = Array.from(new Set(fresh.map((l) => l.sellerId)));
      const { data: shops } = await supabase.from('public_shops').select('id, min_order').in('id', sellerIds);
      setMinOrders(Object.fromEntries((shops ?? []).map((s) => [s.id, Number(s.min_order)])));
    })();
  }, [ids]);

  const groups = useMemo(() => {
    const m = new Map<string, { shopId: string; sellerId: string; lines: EstimateLine[]; subtotal: number }>();
    lines.forEach((l) => {
      const g = m.get(l.sellerId) ?? { shopId: l.shopId, sellerId: l.sellerId, lines: [], subtotal: 0 };
      g.lines.push(l);
      g.subtotal += l.price * l.qty;
      m.set(l.sellerId, g);
    });
    return Array.from(m.values());
  }, [lines]);

  const total = groups.reduce((s, g) => s + g.subtotal, 0);
  const short = groups.filter((g) => g.subtotal < (minOrders[g.sellerId] ?? 0));
  const blocked = short.length > 0 || unavailable.length > 0;

  if (!lines.length)
    return <Empty title="Your estimate is empty" body="Add crackers from any verified shop." href="/products" cta="Browse crackers" />;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">{COPY.estimateTitle}</h1>
        <span className="text-sm text-muted">
          {groups.length} shop{groups.length > 1 ? 's' : ''} · {lines.length} item{lines.length > 1 ? 's' : ''}
        </span>
      </div>

      {groups.map((g) => {
        const min = minOrders[g.sellerId] ?? 0;
        return (
          <section key={g.sellerId} className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Shop {g.shopId}</span>
              <span className="rounded-md bg-gold-light px-2 py-0.5 text-xs font-medium text-gold-dark">Verified</span>
            </div>
            {g.lines.map((l) => (
              <div key={l.productId} className="flex items-center gap-3">
                <ProductImage src={l.image} alt={l.name} className="h-14 w-14 flex-none" />
                <div className="min-w-0 flex-1">
                  <Link href={`/products/${l.productId}`} className="line-clamp-1 text-sm text-navy">
                    {l.name}
                  </Link>
                  <p className="text-xs text-muted">{inr(l.price)} each</p>
                  {unavailable.includes(l.productId) && <p className="text-xs text-maroon">No longer available. Remove it to continue.</p>}
                </div>
                <div className="flex items-center rounded-lg border border-line">
                  <button className="h-9 w-9" aria-label={`Decrease ${l.name}`} onClick={() => estimate.setQty(l.productId, l.qty - 1)}>
                    −
                  </button>
                  <span className="w-7 text-center text-sm">{l.qty}</span>
                  <button className="h-9 w-9" aria-label={`Increase ${l.name}`} onClick={() => estimate.setQty(l.productId, l.qty + 1)}>
                    +
                  </button>
                </div>
                <span className="w-20 text-right text-sm font-medium">{inr(l.price * l.qty)}</span>
              </div>
            ))}
            <div className="flex justify-between border-t border-dashed border-line pt-3 text-sm">
              <span>Subtotal</span>
              <span className="font-semibold">{inr(g.subtotal)}</span>
            </div>
            {g.subtotal < min && (
              <p className="rounded-lg bg-gold-light px-3 py-2 text-xs text-gold-dark">
                Add {inr(min - g.subtotal)} more from this shop to reach its {inr(min)} minimum order.{' '}
                <Link href={`/products?shop=${g.shopId}`} className="font-medium text-gold-dark underline">
                  Shop more
                </Link>
              </p>
            )}
          </section>
        );
      })}

      <div className="flex gap-3 rounded-xl bg-[#EEF2F8] p-3 text-xs text-navy">
        <Icon name="truck" className="flex-none" />
        Each shop ships separately by lorry parcel. Lorry charges are paid when you collect from your nearest transport office.
      </div>

      <div className="sticky bottom-16 flex items-center justify-between gap-3 rounded-2xl border border-line bg-white p-4 md:bottom-4">
        <div>
          <p className="text-xs text-muted">Total</p>
          <p className="text-xl font-semibold">{inr(total)}</p>
        </div>
        {blocked ? (
          <span className="btn-primary pointer-events-none opacity-60">Fix the notes above</span>
        ) : (
          <Link href="/checkout" className="btn-primary">
            Continue
          </Link>
        )}
      </div>
    </div>
  );
}

