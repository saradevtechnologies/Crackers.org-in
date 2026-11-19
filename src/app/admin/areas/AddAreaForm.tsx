'use client';

import { useRef, useState, useTransition } from 'react';
import { ErrorNote } from '@/components/ui';
import { addArea } from '../actions';

export function AddAreaForm() {
  const ref = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      ref={ref}
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        start(async () => {
          setError(null);
          const r = await addArea(f.get('kind') as 'pincode' | 'state', String(f.get('value')), String(f.get('reason')));
          if (r.error) setError(r.error);
          else ref.current?.reset();
        });
      }}
      className="flex flex-wrap items-end gap-2 rounded-2xl border border-line bg-white p-4"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="kind" className="text-sm font-medium">
          Type
        </label>
        <select id="kind" name="kind" className="input h-10 w-32">
          <option value="pincode">PIN code</option>
          <option value="state">State</option>
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="value" className="text-sm font-medium">
          PIN code or state
        </label>
        <input id="value" name="value" className="input h-10 w-44" required />
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <label htmlFor="reason" className="text-sm font-medium">
          Reason
        </label>
        <input id="reason" name="reason" className="input h-10" placeholder="Local ban" />
      </div>
      <button className="btn-primary min-h-[40px]" disabled={pending}>
        Block
      </button>
      <div className="w-full">
        <ErrorNote msg={error} />
      </div>
    </form>
  );
}
