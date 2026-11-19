'use client';

import { useState, useTransition } from 'react';
import { setProductFlag } from './actions';

export function ProductToggles({ id, inStock, active }: { id: string; inStock: boolean; active: boolean }) {
  return (
    <>
      <td>
        <Toggle id={id} flag="in_stock" value={inStock} label="In stock" />
      </td>
      <td>
        <Toggle id={id} flag="active" value={active} label="Listed" />
      </td>
    </>
  );
}

function Toggle({ id, flag, value, label }: { id: string; flag: 'in_stock' | 'active'; value: boolean; label: string }) {
  const [on, setOn] = useState(value);
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={pending}
      onClick={() => {
        const next = !on;
        setOn(next);
        start(async () => {
          const r = await setProductFlag(id, flag, next);
          if (r.error) setOn(!next);
        });
      }}
      className={`relative h-6 w-11 rounded-full transition ${on ? 'bg-leaf' : 'bg-[#D3CBBB]'}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${on ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  );
}
