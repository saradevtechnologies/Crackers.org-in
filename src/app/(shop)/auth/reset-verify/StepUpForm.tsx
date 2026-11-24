'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ErrorNote, OkNote } from '@/components/ui';
import { useLang, useT } from '@/components/Lang';
import { waitText } from '@/lib/copy';
import { sendResetCode, verifyResetCode } from '../actions';

export function StepUpForm({ masked, autoSend, initialWait }: { masked: string; autoSend: boolean; initialWait: number }) {
  const t = useT();
  const lang = useLang();
  const router = useRouter();
  const [code, setCode] = useState('');
  const [wait, setWait] = useState(initialWait);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const sent = useRef(false);

  const send = async () => {
    setError(null);
    setInfo(null);
    const r = await sendResetCode();
    if (r.ok) {
      setWait(r.wait);
      setInfo(t('login.resent'));
    } else {
      if (r.wait) setWait(r.wait);
      setError(r.error ?? null);
    }
  };

  useEffect(() => {
    if (autoSend && !sent.current) {
      sent.current = true;
      sendResetCode().then((r) => r.ok && setWait(r.wait));
    }
  }, [autoSend]);

  useEffect(() => {
    if (wait <= 0) return;
    const id = window.setTimeout(() => setWait((w) => w - 1), 1000);
    return () => window.clearTimeout(id);
  }, [wait]);

  const verify = async (c: string) => {
    if (!/^\d{6}$/.test(c) || busy) return;
    setBusy(true);
    setError(null);
    const r = await verifyResetCode(c);
    setBusy(false);
    if (!r.ok) {
      setCode('');
      return setError(r.error);
    }
    router.refresh();
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        verify(code);
      }}
      className="flex flex-col gap-4"
    >
      <p className="text-sm font-medium">{t('stepup.sent', { phone: masked })}</p>
      <label htmlFor="stepup" className="sr-only">
        OTP
      </label>
      <input
        id="stepup"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        value={code}
        onChange={(e) => {
          const v = e.target.value.replace(/\D/g, '').slice(0, 6);
          setCode(v);
          if (v.length === 6) verify(v);
        }}
        className="input h-14 text-center text-2xl tracking-[0.5em]"
        placeholder="••••••"
        autoFocus
      />
      <ErrorNote msg={error} />
      <OkNote msg={info} />
      <button className="btn-primary min-h-[48px]" disabled={busy || code.length !== 6}>
        {busy ? t('login.verifying') : t('login.verify')}
      </button>
      <button
        type="button"
        className="min-h-[44px] text-sm font-medium text-maroon disabled:text-muted"
        disabled={wait > 0}
        onClick={send}
      >
        {wait > 0 ? t('login.resendWait', { wait: waitText(wait, lang) }) : t('login.resend')}
      </button>
    </form>
  );
}
