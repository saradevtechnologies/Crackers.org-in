'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: { sitekey: string; callback: (t: string) => void; 'expired-callback'?: () => void }) => string;
      remove: (id: string) => void;
    };
  }
}

const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

/** Cloudflare Turnstile widget. Renders nothing when NEXT_PUBLIC_TURNSTILE_SITE_KEY isn't set. */
export function Turnstile({ onToken }: { onToken: (token: string | null) => void }) {
  const key = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const ref = useRef<HTMLDivElement>(null);
  const cb = useRef(onToken);
  cb.current = onToken;

  useEffect(() => {
    if (!key || !ref.current) return;
    let id: string | null = null;
    const render = () => {
      if (!window.turnstile || !ref.current || id) return;
      id = window.turnstile.render(ref.current, {
        sitekey: key,
        callback: (t) => cb.current(t),
        'expired-callback': () => cb.current(null),
      });
    };
    if (window.turnstile) render();
    else {
      let s = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT}"]`);
      if (!s) {
        s = document.createElement('script');
        s.src = SCRIPT;
        s.async = true;
        document.head.appendChild(s);
      }
      s.addEventListener('load', render);
    }
    return () => {
      if (id && window.turnstile) window.turnstile.remove(id);
    };
  }, [key]);

  if (!key) return null;
  return <div ref={ref} className="min-h-[65px]" />;
}
