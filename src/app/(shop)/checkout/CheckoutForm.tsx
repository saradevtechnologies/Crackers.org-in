'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import { estimate, useEstimate, useOrderType } from '@/lib/estimate';
import { unitPrice, useLivePrices } from '@/lib/use-live-prices';
import { useT } from '@/components/Lang';
import { INDIAN_STATES } from '@/lib/validate';
import { inr } from '@/lib/format';
import { COPY } from '@/lib/copy';
import { ErrorNote, Field } from '@/components/ui';
import { placeOrder, type ShipInput } from './actions';


export function CheckoutForm({
  defaults,
  blocked,
  bulk,
}: {
  defaults: ShipInput;
  blocked: { kind: string; value: string }[];
  bulk: { gstin: string; shopName: string; ship: ShipInput } | null;
}) {
  const t = useT();
  const lines = useEstimate();
  const live = useLivePrices(lines);
  const chosen = useOrderType();
  const router = useRouter();
  const isBulk = !!bulk && chosen === 'bulk';
  const [ship, setShip] = useState<ShipInput>(defaults);
  const touched = useRef(false);
  // The order type lives in localStorage, so it is only known after hydration: switch the prefill then.
  useEffect(() => {
    if (!touched.current) setShip(isBulk && bulk ? bulk.ship : defaults);
  }, [isBulk]); // eslint-disable-line react-hooks/exhaustive-deps
  const [adult, setAdult] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const type = isBulk ? 'bulk' : 'retail';
  const total = lines.reduce((s, l) => s + unitPrice(l, type, live.bulk) * l.qty, 0);
  const belowBulkMin = isBulk && live.ready && total < live.bulkMin;
  const set = (k: keyof ShipInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    {
      touched.current = true;
      setShip((s) => ({ ...s, [k]: e.target.value }));
    };

  const areaBlocked = blocked.some(
    (b) =>
      (b.kind === 'pincode' && b.value === ship.pincode.trim()) ||
      (b.kind === 'state' && b.value.toLowerCase() === ship.state.toLowerCase()),
  );

  if (!lines.length)
    return (
      <div className="mx-auto max-w-md text-center">
        <p className="text-lg font-medium">Your estimate is empty</p>
        <Link href="/products" className="btn-primary mt-4">
          Browse crackers
        </Link>
      </div>
    );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^\d{6}$/.test(ship.pincode.trim())) return setError('Enter a valid 6-digit PIN code.');
    if (!/^\+?\d{10,13}$/.test(ship.phone.replace(/[\s-]/g, ''))) return setError('Enter a valid mobile number.');
    if (!adult) return setError('Confirm that you are 18 or older.');
    start(async () => {
      const res = await placeOrder(
        lines.map((l) => ({ product_id: l.productId, qty: l.qty })),
        ship,
        type,
      );
      if (res.error || !res.orderId) return setError(res.error ?? 'Could not place the order.');
      estimate.clear();
      router.push(`/orders/${res.orderId}?placed=1`);
    });
  };

  return (
    <form onSubmit={submit} className="mx-auto flex max-w-2xl flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold">Delivery details</h1>
        {isBulk && <span className="rounded-full bg-[#E8EEF8] px-2.5 py-0.5 text-xs font-semibold uppercase text-[#1E3A6B]">{t('checkout.bulkBadge')}</span>}
      </div>
      {isBulk && bulk && (
        <p className="rounded-xl bg-cream px-3 py-2 text-sm">
          {t('checkout.gstNote').split('{gstin}')[0]}
          <span className="font-mono font-semibold">{bulk.gstin}</span>
          {t('checkout.gstNote').split('{gstin}')[1]}
        </p>
      )}
      {belowBulkMin && <ErrorNote msg={t('checkout.bulkBelowMin')} />}
      <div className="grid gap-4 rounded-2xl border border-line bg-white p-4 sm:grid-cols-2">
        <Field label="Full name" name="name" value={ship.name} onChange={set('name')} required autoComplete="name" />
        <Field
          label="Mobile number (WhatsApp)"
          name="phone"
          value={ship.phone}
          onChange={set('phone')}
          required
          inputMode="tel"
          autoComplete="tel"
          hint="Order updates are sent here. Shops only see the last 4 digits."
        />
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label htmlFor="address" className="text-sm font-medium">
            Address
          </label>
          <textarea id="address" name="address" className="input" rows={2} value={ship.address} onChange={set('address')} required />
        </div>
        <Field label="Town / city (nearest transport office)" name="city" value={ship.city} onChange={set('city')} required />
        <Field
          label="PIN code"
          name="pincode"
          value={ship.pincode}
          onChange={set('pincode')}
          required
          inputMode="numeric"
          maxLength={6}
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="state" className="text-sm font-medium">
            State
          </label>
          <select id="state" className="input" value={ship.state} onChange={set('state')}>
            {INDIAN_STATES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {areaBlocked && <ErrorNote msg="Delivery is not available in your area due to local regulations." />}

      <label className="flex items-start gap-3 text-sm text-[#4A4238]">
        <input type="checkbox" className="mt-0.5 h-5 w-5 accent-maroon" checked={adult} onChange={(e) => setAdult(e.target.checked)} />
        I am 18 or older and will follow the safety instructions.
      </label>

      <ErrorNote msg={error} />

      <div className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-white p-4">
        <div>
          <p className="text-xs text-muted">{isBulk ? t('checkout.bulkBadge') : 'Total'}</p>
          <p className="text-xl font-semibold">{inr(total)}</p>
        </div>
        <button className="btn-primary" disabled={pending || areaBlocked || belowBulkMin || !live.ready}>
          {pending ? 'Sending…' : COPY.checkoutCta}
        </button>
      </div>
    </form>
  );
}
