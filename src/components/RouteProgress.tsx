'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Thin gold progress bar at the top of the screen while the next page loads.
 * Starts on internal link clicks / GET form submits, finishes when the URL changes.
 */
export function RouteProgress() {
  const pathname = usePathname();
  const search = useSearchParams();
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout>>();

  // URL changed -> finish the bar.
  useEffect(() => {
    setState((s) => (s === 'loading' ? 'done' : s));
  }, [pathname, search]);

  useEffect(() => {
    if (state === 'done') {
      timer.current = setTimeout(() => setState('idle'), 350);
    } else if (state === 'loading') {
      timer.current = setTimeout(() => setState('done'), 12000); // safety net
    }
    return () => clearTimeout(timer.current);
  }, [state]);

  useEffect(() => {
    const here = () => location.pathname + location.search;
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element).closest?.('a');
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname + url.search === here()) return;
      setState('loading');
    };
    const onSubmit = (e: SubmitEvent) => {
      const f = e.target as HTMLFormElement;
      if ((f.method || 'get').toLowerCase() === 'get' && new URL(f.action, location.href).origin === location.origin) setState('loading');
    };
    document.addEventListener('click', onClick, true);
    document.addEventListener('submit', onSubmit, true);
    return () => {
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('submit', onSubmit, true);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="route-progress"
      data-state={state}
    />
  );
}
