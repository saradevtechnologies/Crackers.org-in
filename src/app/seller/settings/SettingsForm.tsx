'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Seller } from '@/lib/types';
import { ErrorNote, Field, OkNote } from '@/components/ui';

export function SettingsForm({ seller }: { seller: Seller }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setError(null);
    setOk(null);
    start(async () => {
      const supabase = createClient();
      const update: Partial<Seller> = {
        contact_phone: String(f.get('phone')).trim(),
        email: String(f.get('email')).trim(),
        address: String(f.get('address')).trim(),
        upi_id: String(f.get('upi')).trim() || null,
        min_order: Number(f.get('min_order') || 0),
        licence_expiry: String(f.get('expiry')) || null,
      };
      const file = f.get('licence') as File | null;
      if (file && file.size) {
        const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf';
        const path = `${seller.user_id}/licence-${Date.now()}.${ext}`;
        const up = await supabase.storage.from('licences').upload(path, file);
        if (up.error) return setError('Licence upload failed. Try again.');
        update.licence_path = path;
      }
      const { error } = await supabase.from('sellers').update(update).eq('id', seller.id);
      if (error) return setError(error.message);
      setOk('Saved');
      router.refresh();
    });
  };

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-2xl border border-line bg-white p-5 sm:grid-cols-2">
      <Field label="Contact number" name="phone" defaultValue={seller.contact_phone} required />
      <Field label="Email" name="email" type="email" defaultValue={seller.email} required />
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <label htmlFor="address" className="text-sm font-medium">
          Factory / godown address
        </label>
        <textarea id="address" name="address" rows={2} className="input" defaultValue={seller.address} required />
      </div>
      <Field label="UPI ID (for settlements)" name="upi" defaultValue={seller.upi_id ?? ''} placeholder="shopname@okbank" />
      <Field
        label="Minimum order (₹)"
        name="min_order"
        type="number"
        min={0}
        defaultValue={seller.min_order}
        hint="Customers must reach this amount from your shop"
      />
      <Field label="Licence valid until" name="expiry" type="date" defaultValue={seller.licence_expiry ?? ''} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="licence" className="text-sm font-medium">
          Upload renewed licence
        </label>
        <input id="licence" name="licence" type="file" accept=".pdf,image/*" className="text-sm" />
      </div>
      <div className="sm:col-span-2">
        <ErrorNote msg={error} />
        <OkNote msg={ok} />
      </div>
      <button className="btn-primary sm:col-span-2" disabled={pending}>
        {pending ? 'Saving…' : 'Save settings'}
      </button>
    </form>
  );
}
