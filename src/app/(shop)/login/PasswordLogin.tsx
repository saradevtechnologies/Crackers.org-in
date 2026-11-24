'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import { ErrorNote, Field } from '@/components/ui';
import { PasswordInput } from '@/components/PasswordInput';
import { useT } from '@/components/Lang';
import { safeNext } from '@/lib/safe-next';
import { passwordLogin } from './actions';

export function PasswordLogin({ kind }: { kind: 'staff' | 'bulk' }) {
  const t = useT();
  const router = useRouter();
  const next = safeNext(useSearchParams().get('next'));
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    start(async () => {
      setError(null);
      const r = await passwordLogin(String(f.get('email')), String(f.get('password')), kind);
      if (r.error) return setError(r.error);
      router.replace(next);
      router.refresh();
    });
  };

  return (
    <form onSubmit={submit} className="mx-auto flex max-w-sm flex-col gap-4 rounded-2xl border border-line bg-white p-6">
      <div>
        <h1 className="text-2xl font-semibold">{kind === 'bulk' ? t('pw.titleBulk') : t('pw.titleStaff')}</h1>
        {kind === 'bulk' && <p className="mt-1 text-sm text-muted">{t('pw.subBulk')}</p>}
      </div>
      <Field label={t('pw.email')} name="email" type="email" required autoComplete="email" inputMode="email" />
      <PasswordInput label={t('pw.password')} id="password" required autoComplete="current-password" />
      <ErrorNote msg={error} />
      <button className="btn-primary min-h-[48px]" disabled={pending}>
        {pending ? t('pw.signingIn') : t('pw.signIn')}
      </button>
      <div className="flex flex-col items-center gap-2 text-sm">
        <Link href="/forgot-password">{t('pw.forgot')}</Link>
        {kind === 'bulk' && <Link href="/bulk/apply">{t('pw.notApplied')}</Link>}
        <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-muted">
          {t('pw.customerLink')}
        </Link>
      </div>
    </form>
  );
}
