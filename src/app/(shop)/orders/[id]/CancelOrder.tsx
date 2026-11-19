'use client';

import { useState, useTransition } from 'react';
import { ErrorNote } from '@/components/ui';
import { cancelOrder } from './actions';

export function CancelOrder({ orderId }: { orderId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  if (!confirming)
    return (
      <button type="button" className="self-start text-sm text-muted underline" onClick={() => setConfirming(true)}>
        Cancel this order
      </button>
    );
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-white p-3 text-sm">
      <span>Cancel this unpaid order?</span>
      <button
        className="btn-outline min-h-[36px]"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await cancelOrder(orderId);
            if (r.error) setError(r.error);
          })
        }
      >
        Yes, cancel
      </button>
      <button className="btn-ghost min-h-[36px]" onClick={() => setConfirming(false)}>
        Keep it
      </button>
      <ErrorNote msg={error} />
    </div>
  );
}
