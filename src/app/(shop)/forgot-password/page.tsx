'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { ErrorNote, Field, OkNote } from '@/components/ui';
import { useT } from '@/components/Lang';
import { requestPasswordReset } from '../auth/actions';

export default function ForgotPasswordPage() {
  const t = useT();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="mx-auto flex max-w-sm flex-col gap-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const email = String(new FormData(e.currentTarget).get('email') ?? '');
          start(async () => {
            const r = await requestPasswordReset(email);
            setMsg({ ok: r.ok, text: r.message });
          });
        }}
        className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-6 shadow-soft"
      >
        <div>
          <h1 className="text-2xl font-semibold">{t('forgot.title')}</h1>
          <p className="mt-1 text-sm text-muted">{t('forgot.sub')}</p>
        </div>
        <Field label={t('pw.email')} name="email" type="email" inputMode="email" autoComplete="email" required />
        {msg && (msg.ok ? <OkNote msg={msg.text} /> : <ErrorNote msg={msg.text} />)}
        <button className="btn-primary min-h-[48px]" disabled={pending}>
          {pending ? t('login.sending') : t('forgot.send')}
        </button>
      </form>
      <p className="text-center text-sm text-muted">
        {t('forgot.customer')} <Link href="/login">{t('login.getOtp')}</Link>
      </p>
    </div>
  );
}
