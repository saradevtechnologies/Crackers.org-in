'use client';

import QRCode from 'qrcode';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { inr } from '@/lib/format';
import { upiLink } from '@/lib/upi';
import { skyShots } from '@/lib/effects';
import { COPY } from '@/lib/copy';
import { ErrorNote, OkNote } from '@/components/ui';
import { submitPayment } from './actions';

export function PaymentPanel({
  orderId,
  orderNo,
  amount,
  submittedUtr,
}: {
  orderId: string;
  orderNo: string;
  amount: number;
  submittedUtr: string | null;
}) {
  const router = useRouter();
  const [qr, setQr] = useState<string | null>(null);
  const [utr, setUtr] = useState(submittedUtr ?? '');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(!!submittedUtr);
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const link = upiLink(amount, orderNo);

  useEffect(() => {
    QRCode.toDataURL(link, { width: 240, margin: 1, color: { dark: '#1E2A44', light: '#FFFFFF' } }).then(setQr);
  }, [link]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const clean = utr.replace(/\s/g, '');
    if (!/^\d{12}$/.test(clean)) return setError('The UTR is a 12-digit number. Find it under payment details in your UPI app.');
    start(async () => {
      let proofPath: string | null = null;
      if (file) {
        if (file.size > 5 * 1024 * 1024) return setError('Screenshot must be under 5 MB.');
        const supabase = createClient();
        const { data: auth } = await supabase.auth.getUser();
        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        proofPath = `${auth.user?.id}/${orderId}-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('payment-proofs').upload(proofPath, file);
        if (upErr) return setError('Could not upload the screenshot. Try again or submit without it.');
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
      {done && (
        <OkNote
          msg={`${COPY.placedTitle}. We're verifying your payment (UTR ${utr.replace(/\s/g, '')}) and will update you on WhatsApp.`}
        />
      )}
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-sm text-muted">Amount to pay</p>
        <p className="text-3xl font-semibold">{inr(amount)}</p>
        {qr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qr} alt={`UPI QR code to pay ${inr(amount)}`} width={200} height={200} className="rounded-xl border border-line" />
        ) : (
          <div className="h-[200px] w-[200px] rounded-xl border border-line" />
        )}
        <a href={link} className="btn-ghost md:hidden">
          Open UPI app
        </a>
        <p className="text-xs text-[#4A4238]">
          UPI ID: {process.env.NEXT_PUBLIC_UPI_ID} · Note: {orderNo}
        </p>
      </div>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="utr" className="text-sm font-medium">
            UPI transaction ID (UTR)
          </label>
          <input
            id="utr"
            className="input"
            inputMode="numeric"
            placeholder="12-digit number, e.g. 412345678901"
            value={utr}
            onChange={(e) => setUtr(e.target.value)}
          />
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <button type="button" className="btn-ghost border-dashed" onClick={() => fileRef.current?.click()}>
          {file ? `Screenshot: ${file.name}` : 'Upload payment screenshot (optional)'}
        </button>
        <ErrorNote msg={error} />
        <button className="btn-primary" disabled={pending}>
          {pending ? 'Submitting…' : done ? 'Update payment details' : "I've paid, submit"}
        </button>
      </form>
    </section>
  );
}
