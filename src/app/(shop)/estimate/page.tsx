'use client';

import Link from 'next/link';
import { useEffect, useMemo } from 'react';
import { estimate, setOrderType, useEstimate, useOrderType, type EstimateLine } from '@/lib/estimate';
import { unitPrice, useLivePrices } from '@/lib/use-live-prices';
import { inr } from '@/lib/format';
import { COPY } from '@/lib/copy';
import { useT } from '@/components/Lang';
import { ProductImage } from '@/components/ProductCard';
import { Empty, Icon } from '@/components/ui';

export default function EstimatePage() {
  const t = useT();
  const lines = useEstimate();
  const live = useLivePrices(lines);
  const chosen = useOrderType();

  const retailTotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const bulkTotal = lines.reduce((s, l) => s + unitPrice(l, 'bulk', live.bulk) * l.qty, 0);
  const bulkAllowed = live.bulkActive && bulkTotal >= live.bulkMin;
  const type = chosen === 'bulk' && bulkAllowed ? 'bulk' : 'retail';

  // Fall back to a regular order when bulk isn't possible (e.g. items removed below the minimum).
  useEffect(() => {
    if (live.ready && chosen === 'bulk' && !bulkAllowed) setOrderType('retail');
  }, [live.ready, chosen, bulkAllowed]);

  const groups = useMemo(() => {
    const m = new Map<string, { shopId: string; sellerId: string; lines: EstimateLine[]; subtotal: number }>();
    lines.forEach((l) => {
      const g = m.get(l.sellerId) ?? { shopId: l.shopId, sellerId: l.sellerId, lines: [], subtotal: 0 };
      g.lines.push(l);
      g.subtotal += unitPrice(l, type, live.bulk) * l.qty;
      m.set(l.sellerId, g);
    });
    return Array.from(m.values());
  }, [lines, type, live.bulk]);

  const total = type === 'bulk' ? bulkTotal : retailTotal;
  const short = groups.filter((g) => g.subtotal < (live.minOrders[g.sellerId] ?? 0));
  const blocked = short.length > 0 || live.unavailable.length > 0;

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
        const min = live.minOrders[g.sellerId] ?? 0;
        return (
          <section key={g.sellerId} className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Shop {g.shopId}</span>
              <span className="rounded-md bg-gold-light px-2 py-0.5 text-xs font-medium text-gold-dark">Verified</span>
            </div>
            {g.lines.map((l) => {
              const unit = unitPrice(l, type, live.bulk);
              const noBulk = type === 'bulk' && live.bulk[l.productId] === undefined;
              return (
                <div key={l.productId} className="flex items-center gap-3">
                  <ProductImage src={l.image} alt={l.name} className="h-14 w-14 flex-none" />
                  <div className="min-w-0 flex-1">
                    <Link href={`/products/${l.productId}`} className="line-clamp-1 text-sm text-navy">
                      {l.name}
                    </Link>
                    <p className="text-xs text-muted">
                      {t('price.each', { price: inr(unit) })}
                      {type === 'bulk' && !noBulk && unit < l.price && <span className="ml-1 line-through">{inr(l.price)}</span>}
                      {noBulk && <span className="ml-1 rounded bg-[#EFEBE4] px-1">{t('price.noBulkShort')}</span>}
                    </p>
                    {live.unavailable.includes(l.productId) && <p className="text-xs text-maroon">No longer available. Remove it to continue.</p>}
                  </div>
                  <div className="flex items-center rounded-lg border border-line">
                    <button className="h-10 w-9" aria-label={`Decrease ${l.name}`} onClick={() => estimate.setQty(l.productId, l.qty - 1)}>
                      −
                    </button>
                    <input
                      aria-label={`Quantity of ${l.name}`}
                      inputMode="numeric"
                      className="h-10 w-12 bg-transparent text-center text-sm outline-none"
                      value={l.qty}
                      onChange={(e) => {
                        const n = Number(e.target.value.replace(/\D/g, ''));
                        if (n > 0) estimate.setQty(l.productId, Math.min(n, 99999));
                      }}
                    />
                    <button className="h-10 w-9" aria-label={`Increase ${l.name}`} onClick={() => estimate.setQty(l.productId, l.qty + 1)}>
                      +
                    </button>
                  </div>
                  <span className="w-24 text-right text-sm font-medium">{inr(unit * l.qty)}</span>
                </div>
              );
            })}
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

      {live.bulkActive && (
        <fieldset className="flex flex-col gap-2 rounded-2xl border border-line bg-white p-4">
          <legend className="px-1 font-semibold">{t('est.typeTitle')}</legend>
          <TypeOption
            checked={type === 'bulk'}
            disabled={!bulkAllowed}
            onSelect={() => setOrderType('bulk')}
            title={t('est.bulkOption')}
            desc={t('est.bulkDesc', { total: inr(bulkTotal), min: inr(live.bulkMin) })}
          >
            {!bulkAllowed && (
              <div className="mt-2 flex flex-col gap-1">
                <p className="text-xs font-medium text-gold-dark">{t('est.addMore', { amount: inr(live.bulkMin - bulkTotal) })}</p>
                <div className="h-2 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuemin={0} aria-valuemax={live.bulkMin} aria-valuenow={bulkTotal}>
                  <div className="h-full rounded-full bg-gradient-to-r from-gold to-maroon" style={{ width: `${Math.min(100, (bulkTotal / live.bulkMin) * 100)}%` }} />
                </div>
              </div>
            )}
          </TypeOption>
          <TypeOption
            checked={type === 'retail'}
            onSelect={() => setOrderType('retail')}
            title={t('est.regularOption')}
            desc={t('est.regularDesc', { total: inr(retailTotal) })}
          />
        </fieldset>
      )}

      <div className="flex gap-3 rounded-xl bg-[#EEF2F8] p-3 text-xs text-navy">
        <Icon name="truck" className="flex-none" />
        Each shop ships separately by lorry parcel. Lorry charges are paid when you collect from your nearest transport office.
      </div>

      <div className="sticky bottom-16 flex items-center justify-between gap-3 rounded-2xl border border-line bg-white p-4 md:bottom-4">
        <div>
          <p className="text-xs text-muted">{type === 'bulk' ? t('checkout.bulkBadge') : 'Total'}</p>
          <p className="text-xl font-semibold">{inr(total)}</p>
        </div>
        {blocked || !live.ready ? (
          <span className="btn-primary pointer-events-none opacity-60">{live.ready ? 'Fix the notes above' : '…'}</span>
        ) : (
          <Link href="/checkout" className="btn-primary">
            Continue
          </Link>
        )}
      </div>
    </div>
  );
}

function TypeOption({
  checked,
  disabled,
  onSelect,
  title,
  desc,
  children,
}: {
  checked: boolean;
  disabled?: boolean;
  onSelect: () => void;
  title: string;
  desc: string;
  children?: React.ReactNode;
}) {
  return (
    <label
      className={`flex min-h-[56px] cursor-pointer items-start gap-3 rounded-xl border p-3 ${
        checked ? 'border-maroon bg-maroon-light/40' : 'border-line'
      } ${disabled ? 'cursor-not-allowed opacity-80' : ''}`}
    >
      <input type="radio" name="order_type" className="mt-1 h-5 w-5 accent-maroon" checked={checked} disabled={disabled} onChange={onSelect} />
      <span className="flex-1">
        <span className="block font-medium">{title}</span>
        <span className="block text-sm text-muted">{desc}</span>
        {children}
      </span>
    </label>
  );
}
