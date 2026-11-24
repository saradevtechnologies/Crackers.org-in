'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { ErrorNote } from '@/components/ui';
import { PasswordInput } from '@/components/PasswordInput';
import { useT } from '@/components/Lang';
import { passwordProblems } from '@/lib/common-passwords';
import { setNewPassword } from './actions';

export function SetPasswordForm() {
  const t = useT();
  const router = useRouter();
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  const [pending, start] = useTransition();
  const p = passwordProblems(pw);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          setError(null);
          const r = await setNewPassword(pw, pw2);
          if (r.error) {
            setError(r.error);
            setExpired(!!r.expired);
            if (r.needCode) router.refresh();
            return;
          }
          router.replace('/?toast=password-set');
          router.refresh();
        });
      }}
      className="flex flex-col gap-4"
    >
      <PasswordInput label={t('pwset.new')} id="new_password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" required />
      <ul className="flex flex-col gap-1 text-sm" aria-live="polite">
        {[
          { ok: pw.length > 0 && !p.tooShort, label: t('pwset.ruleLength') },
          { ok: pw.length > 0 && !p.common, label: t('pwset.ruleCommon') },
        ].map((r) => (
          <li key={r.label} className={`flex items-center gap-2 ${r.ok ? 'text-leaf-dark' : 'text-muted'}`}>
            <span aria-hidden="true" className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${r.ok ? 'bg-leaf-light' : 'bg-[#EFEBE4]'}`}>
              {r.ok ? '✓' : '•'}
            </span>
            {r.label}
          </li>
        ))}
      </ul>
      <PasswordInput label={t('pwset.confirm')} id="confirm_password" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" required />
      <ErrorNote msg={error} />
      {expired && (
        <Link href="/forgot-password" className="btn-ghost">
          {t('expired.cta')}
        </Link>
      )}
      <button className="btn-primary min-h-[48px]" disabled={pending || p.tooShort || p.common || !pw2}>
        {pending ? t('common.saving') : t('pwset.save')}
      </button>
    </form>
  );
}
