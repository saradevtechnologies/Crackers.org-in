'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ErrorNote } from '@/components/ui';
import { DocPicker, fileMeta } from '@/components/DocPicker';
import { Turnstile } from '@/components/Turnstile';
import { useLang, useT } from '@/components/Lang';
import { fileError, todayIST, validateStep1, validateStep2, type BulkStep1, type BulkStep2, type FieldErrors } from '@/lib/bulk-validate';
import { INDIAN_STATES, tenDigits } from '@/lib/validate';
import type { MsgKey } from '@/lib/copy';
import { finalizeBulkApplication, loadResubmit, startBulkApplication } from '../actions';

const DRAFT_KEY = 'bulk-apply-draft';
const EMPTY1: BulkStep1 = { shop_name: '', owner_name: '', mobile: '', email: '', address: '', city: '', state: 'Tamil Nadu', pincode: '' };
const EMPTY2: BulkStep2 = { gstin: '', licence_number: '', licence_expiry: '' };

export function ApplyForm() {
  const t = useT();
  const lang = useLang();
  const resubmitNo = useSearchParams().get('resubmit');

  const [step, setStep] = useState(1);
  const [s1, setS1] = useState<BulkStep1>(EMPTY1);
  const [s2, setS2] = useState<BulkStep2>(EMPTY2);
  const [licence, setLicence] = useState<File | null>(null);
  const [others, setOthers] = useState<(File | null)[]>([null]);
  const [confirm, setConfirm] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [statusLink, setStatusLink] = useState(false);
  const [busy, setBusy] = useState<null | 'submit' | 'upload'>(null);
  const [captcha, setCaptcha] = useState<string | null>(null);
  const [done, setDone] = useState<{ no: string; email: string } | null>(null);
  const [resubmit, setResubmit] = useState<{ mobile: string; error: string | null; busy: boolean } | null>(
    resubmitNo ? { mobile: '', error: null, busy: false } : null,
  );
  const loaded = useRef(false);
  const top = useRef<HTMLDivElement>(null);

  // Restore the saved draft (text fields only; files can't be stored).
  useEffect(() => {
    try {
      const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
      if (d && !resubmitNo) {
        setS1({ ...EMPTY1, ...d.s1 });
        setS2({ ...EMPTY2, ...d.s2 });
        setStep(Math.min(Number(d.step) || 1, 2));
      }
    } catch {
      // storage blocked
    }
    loaded.current = true;
  }, [resubmitNo]);

  useEffect(() => {
    if (!loaded.current || done) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ s1, s2, step }));
    } catch {
      // ignore
    }
  }, [s1, s2, step, done]);

  const files = [licence, ...others].filter((f): f is File => !!f);

  const go = (n: number) => {
    setStep(n);
    setFormError(null);
    top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const next1 = () => {
    const e = validateStep1(s1, lang);
    setErrors(e);
    if (Object.keys(e).length) return setFormError(t('bulk.e.fixStep'));
    go(2);
  };

  const next2 = () => {
    const e = validateStep2({ ...s2, files: files.map(fileMeta) }, lang);
    // Point the file error at the right slot
    if (e.files && !licence) e.files = t('bulk.e.licenceFile');
    setErrors(e);
    if (Object.keys(e).length) return setFormError(t('bulk.e.fixStep'));
    go(3);
  };

  const submit = async () => {
    setFormError(null);
    setStatusLink(false);
    if (!confirm) return setErrors({ confirm: t('bulk.e.confirm') });
    setBusy('submit');
    const r = await startBulkApplication({ ...s1, ...s2, files: files.map(fileMeta), confirm, turnstileToken: captcha });
    if (!r.ok) {
      setBusy(null);
      setFormError(r.error);
      setStatusLink(!!r.statusLink);
      if (r.fieldErrors) {
        setErrors(r.fieldErrors);
        const k = Object.keys(r.fieldErrors);
        if (k.some((x) => x in EMPTY1)) go(1);
        else if (k.some((x) => x in EMPTY2 || x === 'files')) go(2);
      }
      return;
    }
    setBusy('upload');
    const storage = createClient().storage.from('bulk-docs');
    const paths: string[] = [];
    for (let i = 0; i < r.uploads.length; i++) {
      const u = r.uploads[i];
      const up = await storage.uploadToSignedUrl(u.path, u.token, files[i], { contentType: files[i].type });
      if (up.error) break;
      paths.push(u.path);
    }
    const fin = await finalizeBulkApplication(r.id, paths.length === r.uploads.length ? paths : []);
    setBusy(null);
    if (!fin.ok) return setFormError(fin.error);
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      // ignore
    }
    setDone({ no: fin.applicationNo, email: fin.email });
    top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (done) {
    const [before, after] = t('bulk.success.body').split('{email}');
    return (
      <div ref={top} className="animate-pop flex flex-col gap-3 rounded-2xl border border-leaf/30 bg-leaf-light p-6 text-navy">
        <p className="text-xl font-semibold">
          <span aria-hidden="true">✅ </span>
          {t('bulk.success.title')}
        </p>
        <p>
          {t('bulk.success.appNo')} <strong className="font-mono text-lg">{done.no}</strong>
        </p>
        <p>
          {before}
          <strong>{done.email}</strong>
          {after}
        </p>
        <Link href={`/bulk/status?no=${encodeURIComponent(done.no)}`} className="btn-primary mt-2 w-fit">
          {t('bulk.success.status')}
        </Link>
      </div>
    );
  }

  if (resubmit && resubmitNo) {
    return (
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setResubmit({ ...resubmit, busy: true, error: null });
          const r = await loadResubmit(resubmitNo, resubmit.mobile);
          if (!r.ok) return setResubmit({ ...resubmit, busy: false, error: r.error });
          setS1(r.step1);
          setS2({ ...EMPTY2, gstin: r.gstin, licence_number: r.licence_number });
          setResubmit(null);
          go(2);
        }}
        className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-5"
      >
        <h2 className="text-lg font-semibold">{t('bulk.resubmit.title', { no: resubmitNo })}</h2>
        <p className="text-sm text-muted">{t('bulk.resubmit.sub')}</p>
        <MobileInput value={resubmit.mobile} onChange={(v) => setResubmit({ ...resubmit, mobile: v })} label={t('bulk.f.mobile')} />
        <ErrorNote msg={resubmit.error} />
        <button className="btn-primary min-h-[48px]" disabled={resubmit.busy}>
          {t('bulk.resubmit.load')}
        </button>
        <button type="button" className="text-sm text-muted underline" onClick={() => setResubmit(null)}>
          {t('bulk.resubmit.skip')}
        </button>
      </form>
    );
  }

  const set1 = (k: keyof BulkStep1) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setS1((p) => ({ ...p, [k]: e.target.value }));
  const set2 = (k: keyof BulkStep2) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setS2((p) => ({ ...p, [k]: k === 'gstin' ? e.target.value.toUpperCase().replace(/\s/g, '') : e.target.value }));

  const steps: MsgKey[] = ['bulk.step1', 'bulk.step2', 'bulk.step3'];

  return (
    <div ref={top} className="flex scroll-mt-24 flex-col gap-4">
      {/* Progress */}
      <div>
        <div className="mb-1.5 flex items-baseline justify-between text-sm">
          <span className="font-semibold">{t(steps[step - 1])}</span>
          <span className="text-muted">{t('bulk.step', { n: step })}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuemin={1} aria-valuemax={3} aria-valuenow={step}>
          <div className="h-full rounded-full bg-gradient-to-r from-maroon to-gold transition-all duration-500" style={{ width: `${(step / 3) * 100}%` }} />
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white p-4 sm:p-5">
        {step === 1 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Text id="shop_name" label={t('bulk.f.shopName')} value={s1.shop_name} onChange={set1('shop_name')} error={errors.shop_name} autoComplete="organization" />
            <Text id="owner_name" label={t('bulk.f.ownerName')} value={s1.owner_name} onChange={set1('owner_name')} error={errors.owner_name} autoComplete="name" />
            <div>
              <MobileInput value={s1.mobile} onChange={(v) => setS1((p) => ({ ...p, mobile: v }))} label={t('bulk.f.mobile')} />
              <ErrorNote msg={errors.mobile} />
            </div>
            <Text id="email" label={t('bulk.f.email')} type="email" inputMode="email" value={s1.email} onChange={set1('email')} error={errors.email} hint={t('bulk.f.emailHint')} autoComplete="email" />
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label htmlFor="address" className="text-sm font-medium">
                {t('bulk.f.address')}
              </label>
              <textarea id="address" rows={2} className="input" value={s1.address} onChange={set1('address')} autoComplete="street-address" />
              <ErrorNote msg={errors.address} />
            </div>
            <Text id="city" label={t('bulk.f.city')} value={s1.city} onChange={set1('city')} error={errors.city} autoComplete="address-level2" />
            <div className="flex flex-col gap-1.5">
              <label htmlFor="state" className="text-sm font-medium">
                {t('bulk.f.state')}
              </label>
              <select id="state" className="input" value={s1.state} onChange={set1('state')}>
                {INDIAN_STATES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <ErrorNote msg={errors.state} />
            </div>
            <Text id="pincode" label={t('bulk.f.pincode')} inputMode="numeric" maxLength={6} value={s1.pincode} onChange={set1('pincode')} error={errors.pincode} autoComplete="postal-code" />
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Text id="gstin" label={t('bulk.f.gstin')} value={s2.gstin} onChange={set2('gstin')} error={errors.gstin} maxLength={15} placeholder="33ABCDE1234F1Z5" className="font-mono uppercase" />
            <Text id="licence_number" label={t('bulk.f.licenceNo')} value={s2.licence_number} onChange={set2('licence_number')} error={errors.licence_number} />
            <Text id="licence_expiry" label={t('bulk.f.licenceExpiry')} type="date" min={todayIST()} value={s2.licence_expiry} onChange={set2('licence_expiry')} error={errors.licence_expiry} />
            <div className="sm:col-span-2">
              <DocPicker id="licence_file" label={t('bulk.f.licenceFile')} file={licence} onChange={setLicence} error={!licence ? errors.files : fileError(licence ? [fileMeta(licence)] : [], false, lang)} />
            </div>
            {others.map((f, i) => (
              <div key={i} className="sm:col-span-2">
                <DocPicker
                  id={`other_file_${i}`}
                  label={t('bulk.f.otherFile')}
                  hint={`${t('bulk.f.otherFileHint')}. ${t('bulk.f.fileHint')}`}
                  optional
                  file={f}
                  onChange={(nf) => setOthers((o) => o.map((x, j) => (j === i ? nf : x)))}
                  error={f ? fileError([fileMeta(f)], false, lang) : null}
                />
              </div>
            ))}
            {others.length < 2 && others.every(Boolean) && (
              <button type="button" className="btn-ghost w-fit sm:col-span-2" onClick={() => setOthers((o) => [...o, null])}>
                + {t('bulk.f.addFile')}
              </button>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-4">
            <Summary
              title={t('bulk.step1')}
              onEdit={() => go(1)}
              editLabel={t('common.edit')}
              rows={[
                [t('bulk.f.shopName'), s1.shop_name],
                [t('bulk.f.ownerName'), s1.owner_name],
                [t('bulk.f.mobile'), `+91 ${s1.mobile}`],
                [t('bulk.f.email'), s1.email],
                [t('bulk.f.address'), `${s1.address}, ${s1.city}, ${s1.state} ${s1.pincode}`],
              ]}
            />
            <Summary
              title={t('bulk.step2')}
              onEdit={() => go(2)}
              editLabel={t('common.edit')}
              rows={[
                [t('bulk.f.gstin'), s2.gstin],
                [t('bulk.f.licenceNo'), s2.licence_number],
                [t('bulk.f.licenceExpiry'), new Date(s2.licence_expiry).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })],
                [t('bulk.files'), files.map((f) => f.name).join(', ')],
              ]}
            />
            <label className="flex items-start gap-3 rounded-xl bg-cream p-3 text-sm">
              <input
                type="checkbox"
                className="mt-0.5 h-5 w-5 shrink-0 accent-maroon"
                checked={confirm}
                onChange={(e) => {
                  setConfirm(e.target.checked);
                  setErrors({});
                }}
              />
              {t('bulk.confirm')}
            </label>
            <ErrorNote msg={errors.confirm} />
            <Turnstile onToken={setCaptcha} />
          </div>
        )}
      </div>

      {formError && (
        <div className="flex flex-col gap-1">
          <ErrorNote msg={formError} />
          {statusLink && (
            <Link href="/bulk/status" className="text-sm font-medium">
              {t('bulk.success.status')} →
            </Link>
          )}
        </div>
      )}

      <div className="flex gap-3">
        {step > 1 && (
          <button type="button" className="btn-ghost min-h-[48px]" onClick={() => go(step - 1)} disabled={!!busy}>
            {t('common.back')}
          </button>
        )}
        {step === 1 && (
          <button type="button" className="btn-primary min-h-[48px] flex-1" onClick={next1}>
            {t('common.next')}
          </button>
        )}
        {step === 2 && (
          <button type="button" className="btn-primary min-h-[48px] flex-1" onClick={next2}>
            {t('common.next')}
          </button>
        )}
        {step === 3 && (
          <button type="button" className="btn-primary min-h-[48px] flex-1" onClick={submit} disabled={!!busy}>
            {busy === 'upload' ? t('bulk.uploading') : busy ? t('bulk.submitting') : t('bulk.submit')}
          </button>
        )}
      </div>
    </div>
  );
}

function Text({
  id,
  label,
  error,
  hint,
  className = '',
  ...rest
}: { id: string; label: string; error?: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input id={id} name={id} className={`input ${error ? 'border-maroon' : ''} ${className}`} aria-invalid={!!error} {...rest} />
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      <ErrorNote msg={error} />
    </div>
  );
}

export function MobileInput({ value, onChange, label, id = 'mobile' }: { value: string; onChange: (v: string) => void; label: string; id?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="flex items-stretch overflow-hidden rounded-xl border border-line bg-white focus-within:border-gold focus-within:shadow-glow">
        <span className="flex items-center border-r border-line bg-cream px-3 font-medium text-navy">+91</span>
        <input
          id={id}
          inputMode="numeric"
          autoComplete="tel-national"
          maxLength={10}
          value={value}
          onChange={(e) => onChange(tenDigits(e.target.value))}
          className="h-11 min-w-0 flex-1 bg-transparent px-3 tracking-wider outline-none"
        />
      </div>
    </div>
  );
}

function Summary({ title, rows, onEdit, editLabel }: { title: string; rows: [string, string][]; onEdit: () => void; editLabel: string }) {
  return (
    <div className="rounded-xl border border-line">
      <div className="flex items-center justify-between border-b border-line px-3 py-2">
        <p className="font-semibold">{title}</p>
        <button type="button" className="min-h-[44px] px-2 text-sm font-medium text-maroon" onClick={onEdit}>
          {editLabel}
        </button>
      </div>
      <dl className="grid gap-x-4 gap-y-1 p-3 text-sm sm:grid-cols-[160px_1fr]">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-muted">{k}</dt>
            <dd className="mb-1 break-words font-medium sm:mb-0">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
