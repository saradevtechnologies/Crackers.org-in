'use client';

import { useState } from 'react';
import { useT } from './Lang';

/** Password field with a 👁 show/hide toggle. */
export function PasswordInput({
  label,
  id,
  ...rest
}: { label: string; id: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  const t = useT();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <input id={id} name={id} type={show ? 'text' : 'password'} className="input w-full pr-14" {...rest} />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? t('common.hide') : t('common.show')}
          aria-pressed={show}
          className="absolute inset-y-0 right-0 flex min-w-[44px] items-center justify-center px-3 text-lg text-muted hover:text-navy"
        >
          <span aria-hidden="true">{show ? '🙈' : '👁'}</span>
        </button>
      </div>
    </div>
  );
}
