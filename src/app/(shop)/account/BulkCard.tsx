'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Badge, ErrorNote, OkNote } from '@/components/ui';
import { DocPicker, fileMeta } from '@/components/DocPicker';
import { useT } from '@/components/Lang';
import type { MsgKey } from '@/lib/copy';
import type { BulkApplication } from '@/lib/types';
import type { Tone } from '@/lib/format';
import { todayIST } from '@/lib/bulk-validate';
import { startRenewal, submitRenewal } from '../bulk/actions';

const TONE: Record<string, Tone> = { approved: 'green', pending: 'gold', renewal_pending: 'gold', rejected: 'red', suspended: 'red' };

function fmt(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function BulkCard({ app }: { app: BulkApplication }) {
  const t = useT();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [no, setNo] = useState(app.licence_number);
  const [expiry, setExpiry] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const today = todayIST();
  const soon = new Date(Date.now() + 30 * 86400 * 1000).toISOString().slice(0, 10);
  const expired = app.licence_expiry < today;
  const expiring = !expired && app.licence_expiry <= soon;
  const canRenew = (expired || expiring || app.status === 'rejected') && ['approved', 'rejected'].includes(app.status);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!no.trim()) return setError(t('bulk.e.required'));
    if (!expiry || expiry <= today) return setError(t('bulk.e.expiry'));
    if (!file) return setError(t('bulk.e.licenceFile'));
    setBusy(true);
    const r = await startRenewal([fileMeta(file)]);
    if (!r.ok) {
      setBusy(false);
      return setError(r.error);
    }
    const u = r.uploads[0];
    const up = await createClient().storage.from('bulk-docs').uploadToSignedUrl(u.path, u.token, file, { contentType: file.type });
    if (up.error) {
      setBusy(false);
      return setError(t('bulk.e.upload'));
    }
    const s = await submitRenewal(no, expiry, [u.path]);
    setBusy(false);
    if (!s.ok) return setError(s.error);
    setOpen(false);
    setOk(t('bulk.acct.renewSent'));
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold">{t('bulk.acct.title')}</h2>
        <Badge tone={TONE[app.status] ?? 'gray'}>{t(`bulk.label.${app.status}` as MsgKey)}</Badge>
      </div>
      <dl className="grid grid-cols-[130px_1fr] gap-y-1 text-sm">
        <dt className="text-muted">{t('bulk.f.shopName')}</dt>
        <dd className="font-medium">{app.shop_name}</dd>
        <dt className="text-muted">{t('bulk.f.gstin')}</dt>
        <dd className="font-mono font-medium">{app.gstin}</dd>
        <dt className="text-muted">{t('bulk.f.licenceExpiry')}</dt>
        <dd className={`font-medium ${expired ? 'text-maroon' : ''}`}>{fmt(app.licence_expiry)}</dd>
        <dt className="text-muted">{t('bulk.status.appNo')}</dt>
        <dd className="font-mono">{app.application_no}</dd>
      </dl>
      {app.status === 'approved' && expired && <ErrorNote msg={t('bulk.acct.expired', { date: fmt(app.licence_expiry) })} />}
      {app.status === 'approved' && expiring && (
        <p className="rounded-lg bg-gold-light px-3 py-2 text-sm text-gold-text">{t('bulk.acct.expiresSoon', { date: fmt(app.licence_expiry) })}</p>
      )}
      {app.admin_note && app.status !== 'approved' && <p className="rounded-lg bg-cream px-3 py-2 text-sm">{app.admin_note}</p>}
      <OkNote msg={ok} />

      {canRenew && !open && (
        <button className="btn-primary w-fit" onClick={() => setOpen(true)}>
          {t('bulk.acct.renew')}
        </button>
      )}
      {open && (
        <form onSubmit={submit} className="flex flex-col gap-3 rounded-xl bg-cream p-3">
          <p className="font-semibold">{t('bulk.acct.renewTitle')}</p>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="r_no" className="text-sm font-medium">
              {t('bulk.f.licenceNo')}
            </label>
            <input id="r_no" className="input" value={no} onChange={(e) => setNo(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="r_exp" className="text-sm font-medium">
              {t('bulk.f.licenceExpiry')}
            </label>
            <input id="r_exp" type="date" min={today} className="input" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
          </div>
          <DocPicker id="r_file" label={t('bulk.f.licenceFile')} file={file} onChange={setFile} />
          <ErrorNote msg={error} />
          <div className="flex gap-2">
            <button className="btn-primary" disabled={busy}>
              {busy ? t('bulk.submitting') : t('common.submit')}
            </button>
            <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>
              {t('common.back')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
