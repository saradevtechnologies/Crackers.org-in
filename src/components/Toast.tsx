'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useT } from './Lang';
import type { MsgKey } from '@/lib/copy';

const TOASTS: Record<string, MsgKey> = { 'password-set': 'pwset.done' };

/** Shows a one-off message from ?toast=…, then removes the parameter from the URL. */
export function Toast() {
  const t = useT();
  const params = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const key = params.get('toast');
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!key || !TOASTS[key]) return;
    setMsg(t(TOASTS[key]));
    const rest = new URLSearchParams(params.toString());
    rest.delete('toast');
    router.replace(rest.size ? `${path}?${rest}` : path, { scroll: false });
    const id = window.setTimeout(() => setMsg(null), 5000);
    return () => window.clearTimeout(id);
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!msg) return null;
  return (
    <div role="status" className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <div className="animate-pop rounded-full bg-leaf-dark px-5 py-3 text-sm font-medium text-white shadow-lift">✓ {msg}</div>
    </div>
  );
}
