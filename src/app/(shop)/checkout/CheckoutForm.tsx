'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { estimate, useEstimate } from '@/lib/estimate';
import { inr } from '@/lib/format';
import { COPY } from '@/lib/copy';
import { ErrorNote, Field } from '@/components/ui';
import { placeOrder, type ShipInput } from './actions';

const STATES = [
  'Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh',
  'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan',
  'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Other',
];

export function CheckoutForm({
  defaults,
  blocked,
  canWholesale,
}: {
  defaults: ShipInput;
  blocked: { kind: string; value: string }[];
  canWholesale: boolean;
}) {
  const lines = useEstimate();
  const router = useRouter();
  const [ship, setShip] = useState<ShipInput>(defaults);
  const [wholesale, setWholesale] = useState(false);
  const [adult, setAdult] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const total = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const set = (k: keyof ShipInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setShip((s) => ({ ...s, [k]: e.target.value }));

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
        wholesale,
      );
      if (res.error || !res.orderId) return setError(res.error ?? 'Could not place the order.');
      estimate.clear();
      router.push(`/orders/${res.orderId}?placed=1`);
    });
  };

  return (
    <form onSubmit={submit} className="mx-auto flex max-w-2xl flex-col gap-5">
      <h1 className="text-2xl font-semibold">Delivery details</h1>
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
            {STATES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {areaBlocked && <ErrorNote msg="Delivery is not available in your area due to local regulations." />}

      {canWholesale && (
        <label className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4 text-sm">
          <input type="checkbox" className="h-5 w-5 accent-maroon" checked={wholesale} onChange={(e) => setWholesale(e.target.checked)} />
          Use wholesale prices (applied to items that meet each product's minimum quantity)
        </label>
      )}

      <label className="flex items-start gap-3 text-sm text-[#4A4238]">
        <input type="checkbox" className="mt-0.5 h-5 w-5 accent-maroon" checked={adult} onChange={(e) => setAdult(e.target.checked)} />
        I am 18 or older and will follow the safety instructions.
      </label>

      <ErrorNote msg={error} />

      <div className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-white p-4">
        <div>
          <p className="text-xs text-muted">{wholesale ? 'Total before wholesale discount' : 'Total'}</p>
          <p className="text-xl font-semibold">{inr(total)}</p>
        </div>
        <button className="btn-primary" disabled={pending || areaBlocked}>
          {pending ? 'Sending…' : COPY.checkoutCta}
        </button>
      </div>
    </form>
  );
}
