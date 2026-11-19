'use client';

import { useState, useTransition } from 'react';

type Result = { error?: string; ok?: boolean } | undefined;

/** Button that runs a server action, shows a pending state, and optionally asks for a reason first. */
export function ActionButton({
  action,
  label,
  className = 'btn-primary',
  confirm,
  askReason,
}: {
  action: (reason: string) => Promise<Result>;
  label: string;
  className?: string;
  confirm?: string;
  askReason?: string;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const [reason, setReason] = useState('');

  const go = (r: string) =>
    start(async () => {
      setError(null);
      const res = await action(r);
      if (res?.error) setError(res.error);
      else setAsking(false);
    });

  if (asking)
    return (
      <span className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="reason">
          {askReason}
        </label>
        <input id="reason" className="input h-10 w-56" placeholder={askReason} value={reason} onChange={(e) => setReason(e.target.value)} />
        <button className={className} disabled={pending} onClick={() => go(reason)}>
          {pending ? '…' : label}
        </button>
        <button className="btn-ghost" onClick={() => setAsking(false)}>
          Back
        </button>
        {error && <span className="text-sm text-maroon">{error}</span>}
      </span>
    );

  return (
    <span className="inline-flex flex-col gap-1">
      <button
        className={className}
        disabled={pending}
        onClick={() => {
          if (askReason) return setAsking(true);
          if (confirm && !window.confirm(confirm)) return;
          go('');
        }}
      >
        {pending ? '…' : label}
      </button>
      {error && <span className="text-sm text-maroon">{error}</span>}
    </span>
  );
}
