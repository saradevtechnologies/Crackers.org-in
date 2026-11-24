'use client';

import { useState, useTransition } from 'react';
import { ErrorNote, Field, OkNote } from '@/components/ui';
import type { BankDetails } from '@/lib/settings';
import { saveSettings } from './actions';

export function SettingsForm({ bulkMin, bank, siteUrl }: { bulkMin: number; bank: BankDetails; siteUrl: string }) {
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const g = (k: string) => String(f.get(k) ?? '').trim();
        start(async () => {
          setError(null);
          setOk(null);
          const r = await saveSettings({
            bulkMin: g('bulk_min'),
            siteUrl: g('site_url'),
            bank: {
              account_name: g('account_name'),
              account_number: g('account_number'),
              account_number2: g('account_number2'),
              ifsc: g('ifsc').toUpperCase(),
              bank: g('bank'),
              branch: g('branch'),
            },
          });
          if (r.error) setError(r.error);
          else setOk('Saved.');
        });
      }}
      className="flex flex-col gap-5"
    >
      <section className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4">
        <h2 className="font-semibold">Bulk orders</h2>
        <Field label="Minimum bulk order (₹, whole rupees)" name="bulk_min" type="number" min={1} step={1} defaultValue={bulkMin} required hint="Applies to the whole order, across all shops." />
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4">
        <h2 className="font-semibold">Bank details for bulk payments</h2>
        <p className="text-sm text-muted">Shown only to approved bulk buyers on their order page.</p>
        <Field label="Account name" name="account_name" defaultValue={bank.account_name} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Account number" name="account_number" defaultValue={bank.account_number} inputMode="numeric" autoComplete="off" />
          <Field label="Account number again" name="account_number2" defaultValue={bank.account_number} inputMode="numeric" autoComplete="off" hint="Type it twice to avoid mistakes." />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="IFSC" name="ifsc" defaultValue={bank.ifsc} maxLength={11} className="input font-mono uppercase" />
          <Field label="Bank" name="bank" defaultValue={bank.bank} />
          <Field label="Branch" name="branch" defaultValue={bank.branch} />
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4">
        <h2 className="font-semibold">Website address</h2>
        <Field label="Site URL" name="site_url" defaultValue={siteUrl} placeholder="https://crackers.org.in" hint="Used in WhatsApp messages sent by the database (e.g. the 'apply again' link)." />
      </section>

      <ErrorNote msg={error} />
      <OkNote msg={ok} />
      <button className="btn-primary w-fit" disabled={pending}>
        {pending ? 'Saving…' : 'Save settings'}
      </button>
    </form>
  );
}
