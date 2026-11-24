'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import type { AuthError } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { ErrorNote, OkNote } from '@/components/ui';
import { useLang, useT } from '@/components/Lang';
import { waitText } from '@/lib/copy';
import { safeNext } from '@/lib/safe-next';
import { MOBILE_RE, OTP_RE, tenDigits } from '@/lib/validate';

const RESEND_GAP = 30; // seconds between sends
const MAX_SENDS = 4; // first send + 3 resends…
const SEND_WINDOW = 10 * 60; // …per 10 minutes
// Match "SMS OTP expiry" in Supabase → Authentication → Providers → Phone (README recommends 300).
const OTP_EXPIRY = Number(process.env.NEXT_PUBLIC_OTP_EXPIRY_SECONDS || 300);

type Step = 'phone' | 'code' | 'name';

/** Send times for a number, kept in localStorage so a page reload can't skip the wait. */
function sendLog(phone: string, add = false): number[] {
  const key = `otp-sends:${phone}`;
  let list: number[] = [];
  try {
    list = JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    // storage blocked: fall back to in-memory limits
  }
  const now = Date.now();
  list = list.filter((ts) => now - ts < SEND_WINDOW * 1000);
  if (add) list.push(now);
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    // ignore
  }
  return list;
}

/** Seconds until another code may be sent (0 = now). */
function waitFor(list: number[]) {
  const now = Date.now();
  const last = list[list.length - 1];
  let wait = last ? RESEND_GAP - (now - last) / 1000 : 0;
  if (list.length >= MAX_SENDS) wait = Math.max(wait, SEND_WINDOW - (now - list[0]) / 1000);
  return Math.max(0, Math.ceil(wait));
}

function OtpLogin() {
  const t = useT();
  const lang = useLang();
  const router = useRouter();
  const next = safeNext(useSearchParams().get('next'));

  const [step, setStep] = useState<Step>('phone');
  const [digits, setDigits] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(0);
  const sentAt = useRef(0);
  const codeRef = useRef<HTMLInputElement>(null);

  const phone = `+91${digits}`;
  const pretty = `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;

  // Countdown for "Resend OTP"
  useEffect(() => {
    if (step !== 'code') return;
    const tick = () => setWait(waitFor(sendLog(phone)));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [step, phone]);

  const finish = () => {
    router.replace(next);
    router.refresh();
  };

  const smsError = (e: AuthError) => {
    if (e.status === 429 || /rate/i.test(e.code ?? '')) return t('login.smsLimit');
    return t('login.smsFailed');
  };

  const send = async (isResend: boolean) => {
    setError(null);
    setInfo(null);
    if (!MOBILE_RE.test(digits)) return setError(t('login.badMobile'));
    const w = waitFor(sendLog(phone));
    if (w > 0) return setInfo(t('login.resendWait', { wait: waitText(w, lang) }));
    setBusy(true);
    const { error: e } = await createClient().auth.signInWithOtp({ phone });
    setBusy(false);
    if (e) return setError(smsError(e));
    sendLog(phone, true);
    sentAt.current = Date.now();
    setCode('');
    setStep('code');
    if (isResend) setInfo(t('login.resent'));
    window.setTimeout(() => codeRef.current?.focus(), 50);
  };

  const verify = async (token: string) => {
    if (!OTP_RE.test(token) || busy) return;
    setBusy(true);
    setError(null);
    setInfo(null);
    const supabase = createClient();
    const { data, error: e } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
    if (e || !data.user) {
      setBusy(false);
      setCode('');
      // Supabase uses one error for wrong and expired codes, so use the time since sending to tell them apart.
      const expired = Date.now() - sentAt.current > OTP_EXPIRY * 1000;
      if (e?.status === 429) return setError(t('login.smsLimit'));
      return setError(expired ? t('login.expiredCode') : t('login.wrongCode'));
    }
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', data.user.id).maybeSingle();
    setBusy(false);
    if (!profile?.full_name) return setStep('name');
    finish();
  };

  const saveName = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (n.length < 2) return setError(t('login.nameNeeded'));
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    const { error: err } = await supabase.from('profiles').update({ full_name: n }).eq('id', data.user?.id ?? '');
    setBusy(false);
    if (err) return setError(t('common.tryAgain'));
    finish();
  };

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-6 shadow-soft">
        {step === 'phone' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(false);
            }}
            className="flex flex-col gap-4"
          >
            <div>
              <h1 className="text-2xl font-semibold">{t('login.title')}</h1>
              <p className="mt-1 text-sm text-muted">{t('login.sub')}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="mobile" className="text-sm font-medium">
                {t('login.mobile')}
              </label>
              <div className="flex items-stretch overflow-hidden rounded-xl border border-line bg-white focus-within:border-gold focus-within:shadow-glow">
                <span className="flex items-center border-r border-line bg-cream px-3 text-lg font-medium text-navy">+91</span>
                <input
                  id="mobile"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  maxLength={10}
                  value={digits}
                  onChange={(e) => setDigits(tenDigits(e.target.value))}
                  placeholder="98765 43210"
                  className="h-14 min-w-0 flex-1 bg-transparent px-3 text-lg tracking-wider outline-none"
                  autoFocus
                />
              </div>
            </div>
            <ErrorNote msg={error} />
            <OkNote msg={info} />
            <button className="btn-primary min-h-[52px] text-base" disabled={busy}>
              {busy ? t('login.sending') : t('login.getOtp')}
            </button>
          </form>
        )}

        {step === 'code' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              verify(code);
            }}
            className="flex flex-col gap-4"
          >
            <div>
              <h1 className="text-2xl font-semibold">{t('login.otp')}</h1>
              <p className="mt-1 text-sm text-muted">{t('login.codeSent', { phone: pretty })}</p>
            </div>
            <label htmlFor="otp" className="sr-only">
              {t('login.otp')}
            </label>
            <input
              id="otp"
              ref={codeRef}
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              value={code}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, '').slice(0, 6);
                setCode(v);
                if (v.length === 6) verify(v);
              }}
              className="input h-14 text-center text-2xl tracking-[0.5em]"
              placeholder="••••••"
            />
            <ErrorNote msg={error} />
            <OkNote msg={info} />
            <button className="btn-primary min-h-[52px] text-base" disabled={busy || code.length !== 6}>
              {busy ? t('login.verifying') : t('login.verify')}
            </button>
            <div className="flex items-center justify-between gap-2 text-sm">
              <button
                type="button"
                className="min-h-[44px] text-maroon underline-offset-2 hover:underline"
                onClick={() => {
                  setStep('phone');
                  setError(null);
                  setInfo(null);
                }}
              >
                {t('login.changeNumber')}
              </button>
              <button
                type="button"
                className="min-h-[44px] font-medium text-maroon underline-offset-2 hover:underline disabled:text-muted disabled:no-underline"
                disabled={wait > 0 || busy}
                onClick={() => send(true)}
              >
                {wait > 0
                  ? wait <= RESEND_GAP
                    ? t('login.resendIn', { s: wait })
                    : t('login.resendWait', { wait: waitText(wait, lang) })
                  : t('login.resend')}
              </button>
            </div>
          </form>
        )}

        {step === 'name' && (
          <form onSubmit={saveName} className="flex flex-col gap-4">
            <h1 className="text-2xl font-semibold">{t('login.nameTitle')}</h1>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-sm font-medium">
                {t('login.yourName')}
              </label>
              <input id="name" className="input h-12" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" autoFocus />
            </div>
            <ErrorNote msg={error} />
            <button className="btn-primary min-h-[52px] text-base" disabled={busy}>
              {busy ? t('common.saving') : t('login.continue')}
            </button>
          </form>
        )}
      </div>

      {step === 'phone' && (
        <div className="flex flex-col items-center gap-2 text-sm text-muted">
          <p>
            {t('login.shopOwner')}{' '}
            <Link href={`/login/bulk?next=${encodeURIComponent(next)}`} className="font-semibold">
              {t('login.bulkLink')}
            </Link>
          </p>
          <Link href={`/login/email?next=${encodeURIComponent(next)}`} className="text-muted">
            {t('login.emailLink')}
          </Link>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <OtpLogin />
    </Suspense>
  );
}
