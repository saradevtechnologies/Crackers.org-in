'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ErrorNote, Field, OkNote } from '@/components/ui';

function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/';
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const phone = String(f.get('phone')).replace(/[\s-]/g, '');
    if (!/^\+?\d{10,13}$/.test(phone)) return setError('Enter a valid mobile number.');
    const password = String(f.get('password'));
    if (password.length < 8) return setError('Use at least 8 characters for your password.');
    setPending(true);
    setError(null);
    const { data, error } = await createClient().auth.signUp({
      email: String(f.get('email')).trim(),
      password,
      options: {
        data: { full_name: String(f.get('name')).trim(), phone },
        emailRedirectTo: `${window.location.origin}${next}`,
      },
    });
    setPending(false);
    if (error) return setError(error.message);
    if (!data.session) return setInfo('Check your email to confirm your account, then sign in.');
    router.replace(next.startsWith('/') ? next : '/');
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="mx-auto flex max-w-sm flex-col gap-4 rounded-2xl border border-line bg-white p-6">
      <h1 className="text-2xl font-semibold">Create your account</h1>
      <Field label="Full name" name="name" required autoComplete="name" />
      <Field label="Mobile number (WhatsApp)" name="phone" required inputMode="tel" autoComplete="tel" />
      <Field label="Email" name="email" type="email" required autoComplete="email" />
      <Field label="Password" name="password" type="password" required autoComplete="new-password" hint="At least 8 characters" />
      <ErrorNote msg={error} />
      <OkNote msg={info} />
      <button className="btn-primary" disabled={pending}>
        {pending ? 'Creating…' : 'Create account'}
      </button>
      <p className="text-center text-sm text-muted">
        Already have an account? <Link href={`/login?next=${encodeURIComponent(next)}`}>Sign in</Link>
      </p>
    </form>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
