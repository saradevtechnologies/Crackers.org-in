'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { inr } from '@/lib/format';
import { skyShots } from '@/lib/effects';
import { COPY } from '@/lib/copy';
import { BANK_REF_RE } from '@/lib/validate';
import type { BankDetails } from '@/lib/settings';
import { ErrorNote, OkNote } from '@/components/ui';
import { DocPicker } from '@/components/DocPicker';
import { useT } from '@/components/Lang';
import { submitPayment } from './actions';

export function BankTransferPanel({
  orderId,
  orderNo,
  amount,
  submittedRef,
  bank,
}: {
  orderId: string;
  orderNo: string;
  amount: number;
  submittedRef: string | null;
  bank: BankDetails | null;
}) {
  const t = useT();
  const router = useRouter();
  const [ref, setRef] = useState(submittedRef ?? '');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(!!submittedRef);
  const [pending, start] = useTransition();
  const ready = !!bank?.account_number && !!bank?.ifsc;
  const [before, after] = t('pay.bankNote').split('{order}');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const clean = ref.replace(/\s/g, '').toUpperCase();
    if (!BANK_REF_RE.test(clean)) return setError(t('pay.bankRefError'));
    start(async () => {
      let proofPath: string | null = null;
      if (file) {
        if (file.size > 8 * 1024 * 1024) return setError(t('bulk.e.fileSize'));
        const supabase = createClient();
        const { data: auth } = await supabase.auth.getUser();
        const ext = file.type === 'application/pdf' ? 'pdf' : file.type === 'image/png' ? 'png' : 'jpg';
        proofPath = `${auth.user?.id}/${orderId}-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('payment-proofs').upload(proofPath, file, { contentType: file.type });
        if (upErr) return setError(t('pay.receiptUploadFailed'));
      }
      const res = await submitPayment(orderId, clean, proofPath);
      if (res.error) return setError(res.error);
      setDone(true);
      skyShots(1);
      router.refresh();
    });
  };

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-5">
      {done && <OkNote msg={`${COPY.placedTitle}. We're verifying your bank transfer (ref ${ref.replace(/\s/g, '').toUpperCase()}) and will update you on WhatsApp.`} />}
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{t('pay.bankTitle')}</h2>
        <span className="rounded-full bg-[#E8EEF8] px-2.5 py-0.5 text-xs font-semibold uppercase text-[#1E3A6B]">{t('checkout.bulkBadge')}</span>
      </div>

      <div className="rounded-xl bg-cream p-4">
        <p className="text-sm text-muted">{t('pay.amount')}</p>
        <p className="text-3xl font-semibold">{inr(amount)}</p>
      </div>

      {ready ? (
        <dl className="divide-y divide-line rounded-xl border border-line text-sm">
          <Row label={t('pay.accountName')} value={bank!.account_name} />
          <Row label={t('pay.accountNumber')} value={bank!.account_number} copy mono />
          <Row label={t('pay.ifsc')} value={bank!.ifsc} copy mono />
          <Row label={t('pay.bank')} value={bank!.bank} />
          {bank!.branch && <Row label={t('pay.branch')} value={bank!.branch} />}
        </dl>
      ) : (
        <ErrorNote msg={`${t('pay.bankMissing')} ${process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? ''}`} />
      )}

      <p className="rounded-lg bg-gold-light px-3 py-2 text-sm text-gold-text">
        {before}
        <strong className="font-mono">{orderNo}</strong>
        {after}
      </p>

      <form onSubmit={submit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="bankref" className="text-sm font-medium">
            {t('pay.bankRef')}
          </label>
          <input
            id="bankref"
            className="input font-mono uppercase"
            autoCapitalize="characters"
            maxLength={22}
            placeholder="SBIN426123456789"
            value={ref}
            onChange={(e) => setRef(e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase())}
          />
          <p className="text-xs text-muted">{t('pay.bankRefHint')}</p>
        </div>
        <DocPicker id="receipt" label={t('pay.receipt')} optional file={file} onChange={setFile} />
        <ErrorNote msg={error} />
        <button className="btn-primary min-h-[48px]" disabled={pending || !ready}>
          {pending ? t('bulk.submitting') : done ? 'Update payment details' : t('pay.paidSubmit')}
        </button>
      </form>
    </section>
  );
}

function Row({ label, value, copy, mono }: { label: string; value: string; copy?: boolean; mono?: boolean }) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-3 px-3 py-2">
      <dt className="w-32 shrink-0 text-muted">{label}</dt>
      <dd className={`min-w-0 flex-1 break-all font-medium ${mono ? 'font-mono' : ''}`}>{value}</dd>
      {copy && (
        <button
          type="button"
          className="min-h-[44px] min-w-[44px] rounded-lg px-2 text-xs font-semibold text-maroon hover:bg-maroon-light"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(value);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1500);
            } catch {
              // clipboard blocked: the value is still selectable
            }
          }}
        >
          {copied ? `✓ ${t('common.copied')}` : t('common.copy')}
        </button>
      )}
    </div>
  );
}
