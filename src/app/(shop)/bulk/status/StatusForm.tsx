'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import { ErrorNote } from '@/components/ui';
import { useT } from '@/components/Lang';
import { MobileInput } from '../apply/ApplyForm';
import { checkBulkStatus } from '../actions';

type Result = Awaited<ReturnType<typeof checkBulkStatus>>;

const TONE: Record<string, string> = {
  pending: 'border-gold/40 bg-gold-light text-gold-text',
  renewal_pending: 'border-gold/40 bg-gold-light text-gold-text',
  approved: 'border-leaf/30 bg-leaf-light text-leaf-dark',
  rejected: 'border-maroon/30 bg-maroon-light text-maroon-dark',
  suspended: 'border-maroon/30 bg-maroon-light text-maroon-dark',
};

export function StatusForm() {
  const t = useT();
  const [no, setNo] = useState(useSearchParams().get('no') ?? '');
  const [mobile, setMobile] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => setResult(await checkBulkStatus(no, mobile)));
        }}
        className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-6"
      >
        <h1 className="text-2xl font-semibold">{t('bulk.status.title')}</h1>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="appno" className="text-sm font-medium">
            {t('bulk.status.appNo')}
          </label>
          <input id="appno" className="input font-mono uppercase" placeholder="BLK-1027" value={no} onChange={(e) => setNo(e.target.value.toUpperCase())} required />
        </div>
        <MobileInput value={mobile} onChange={setMobile} label={t('bulk.f.mobile')} />
        <button className="btn-primary min-h-[48px]" disabled={pending}>
          {t('bulk.status.check')}
        </button>
        {result && !result.ok && <ErrorNote msg={result.error} />}
      </form>

      {result?.ok && (
        <div className={`animate-pop flex flex-col gap-2 rounded-2xl border p-5 ${TONE[result.status]}`}>
          <p className="font-mono text-sm">{result.applicationNo}</p>
          <p className="text-lg font-semibold">{result.label}</p>
          <p className="text-sm">{result.message}</p>
          {result.status === 'approved' && (
            <Link href="/login/bulk" className="btn-primary mt-1 w-fit">
              {t('login.bulkLink')}
            </Link>
          )}
          {result.resubmitUrl && (
            <Link href={result.resubmitUrl} className="btn-primary mt-1 w-fit">
              {t('bulk.s.resubmit')}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
