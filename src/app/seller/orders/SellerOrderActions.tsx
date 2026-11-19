'use client';

import { useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { SubOrderStatus } from '@/lib/types';
import { ErrorNote } from '@/components/ui';
import { cancelSubOrder, dispatchOrder, markDelivered, markPacked } from './actions';

type Mode = null | 'dispatch' | 'deliver' | 'cancel';

export function SellerOrderActions({ id, status, supportPhone }: { id: string; status: SubOrderStatus; supportPhone: string }) {
  const [mode, setMode] = useState<Mode>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const act = (fn: () => Promise<{ error?: string; ok?: boolean }>) =>
    start(async () => {
      setError(null);
      const r = await fn();
      if (r.error) setError(r.error);
      else setMode(null);
    });

  const onDispatch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const photo = f.get('photo') as File | null;
    act(async () => {
      let url: string | null = null;
      if (photo && photo.size) {
        if (photo.size > 5 * 1024 * 1024) return { error: 'LR photo must be under 5 MB.' };
        const supabase = createClient();
        const { data: auth } = await supabase.auth.getUser();
        const ext = photo.name.split('.').pop()?.toLowerCase() || 'jpg';
        const path = `${auth.user?.id}/${id}-${Date.now()}.${ext}`;
        const up = await supabase.storage.from('lr-photos').upload(path, photo);
        if (up.error) return { error: 'LR photo upload failed. Try again.' };
        url = supabase.storage.from('lr-photos').getPublicUrl(path).data.publicUrl;
      }
      return dispatchOrder(id, String(f.get('transport')), String(f.get('lr')), url);
    });
  };

  if (status === 'delivered' || status === 'cancelled') return null;

  return (
    <div className="flex flex-col gap-3">
      {mode === null && (
        <div className="flex flex-wrap gap-2">
          {status === 'confirmed' && (
            <button className="btn-ghost" disabled={pending} onClick={() => act(() => markPacked(id))}>
              Mark packed
            </button>
          )}
          {(status === 'confirmed' || status === 'packed') && (
            <>
              <button className="btn-primary" onClick={() => setMode('dispatch')}>
                Dispatch
              </button>
              <button className="btn-ghost text-maroon" onClick={() => setMode('cancel')}>
                Can't supply
              </button>
            </>
          )}
          {status === 'dispatched' && (
            <button className="btn-green" onClick={() => setMode('deliver')}>
              Mark delivered
            </button>
          )}
        </div>
      )}

      {mode === 'dispatch' && (
        <form onSubmit={onDispatch} className="flex flex-col gap-3 rounded-xl bg-cream p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label htmlFor={`t-${id}`} className="text-sm font-medium">
                Transport name
              </label>
              <input id={`t-${id}`} name="transport" className="input" required />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor={`l-${id}`} className="text-sm font-medium">
                LR number
              </label>
              <input id={`l-${id}`} name="lr" className="input" required />
            </div>
          </div>
          <label className="text-sm">
            LR photo <input type="file" name="photo" accept="image/*" className="ml-2 text-sm" />
          </label>
          {supportPhone && <p className="text-xs text-muted">Use {supportPhone} as the consignee phone on the LR.</p>}
          <div className="flex gap-2">
            <button className="btn-primary" disabled={pending}>
              {pending ? 'Saving…' : 'Mark as dispatched'}
            </button>
            <button type="button" className="btn-ghost" onClick={() => setMode(null)}>
              Back
            </button>
          </div>
        </form>
      )}

      {mode === 'deliver' && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const otp = String(new FormData(e.currentTarget).get('otp'));
            act(() => markDelivered(id, otp));
          }}
          className="flex flex-wrap items-end gap-2 rounded-xl bg-cream p-3"
        >
          <div className="flex flex-col gap-1">
            <label htmlFor={`o-${id}`} className="text-sm font-medium">
              Customer's pickup OTP
            </label>
            <input id={`o-${id}`} name="otp" className="input w-32 tracking-widest" inputMode="numeric" maxLength={4} required />
          </div>
          <button className="btn-green" disabled={pending}>
            Confirm delivery
          </button>
          <button type="button" className="btn-ghost" onClick={() => setMode(null)}>
            Back
          </button>
        </form>
      )}

      {mode === 'cancel' && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const reason = String(new FormData(e.currentTarget).get('reason'));
            act(() => cancelSubOrder(id, reason));
          }}
          className="flex flex-col gap-2 rounded-xl bg-cream p-3"
        >
          <label htmlFor={`c-${id}`} className="text-sm font-medium">
            Reason (shown to the customer)
          </label>
          <input id={`c-${id}`} name="reason" className="input" placeholder="Out of stock" required />
          <div className="flex gap-2">
            <button className="btn-outline" disabled={pending}>
              Cancel these items
            </button>
            <button type="button" className="btn-ghost" onClick={() => setMode(null)}>
              Back
            </button>
          </div>
        </form>
      )}
      <ErrorNote msg={error} />
    </div>
  );
}
