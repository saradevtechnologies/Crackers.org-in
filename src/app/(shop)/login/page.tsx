'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ErrorNote, Field } from '@/components/ui';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/';
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setPending(true);
    setError(null);
    const { error } = await createClient().auth.signInWithPassword({
      email: String(f.get('email')).trim(),
      password: String(f.get('password')),
    });
    setPending(false);
    if (error) return setError('Email or password is incorrect.');
    router.replace(next.startsWith('/') ? next : '/');
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="mx-auto flex max-w-sm flex-col gap-4 rounded-2xl border border-line bg-white p-6">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <Field label="Email" name="email" type="email" required autoComplete="email" />
      <Field label="Password" name="password" type="password" required autoComplete="current-password" />
      <ErrorNote msg={error} />
      <button className="btn-primary" disabled={pending}>
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
      <p className="text-center text-sm text-muted">
        New here? <Link href={`/signup?next=${encodeURIComponent(next)}`}>Create an account</Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
