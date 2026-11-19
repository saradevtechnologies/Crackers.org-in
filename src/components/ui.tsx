import Link from 'next/link';
import { TONE_CLASS, type Tone } from '@/lib/format';

export function Badge({ tone = 'gray', children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${TONE_CLASS[tone]}`}>
      {children}
    </span>
  );
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-line bg-white p-4 ${className}`}>{children}</div>;
}

export function PageTitle({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {sub && <p className="text-sm text-muted">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function Empty({ title, body, href, cta }: { title: string; body?: string; href?: string; cta?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-white p-10 text-center">
      <p className="text-lg font-medium">{title}</p>
      {body && <p className="mt-1 text-sm text-muted">{body}</p>}
      {href && cta && (
        <Link href={href} className="btn-primary mt-4 inline-flex">
          {cta}
        </Link>
      )}
    </div>
  );
}

export function Field({
  label,
  name,
  hint,
  ...rest
}: { label: string; name: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      <input id={name} name={name} className="input" {...rest} />
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function ErrorNote({ msg }: { msg?: string | null }) {
  if (!msg) return null;
  return (
    <p role="alert" className="rounded-lg bg-maroon-light px-3 py-2 text-sm text-maroon-dark">
      {msg}
    </p>
  );
}

export function OkNote({ msg }: { msg?: string | null }) {
  if (!msg) return null;
  return <p className="rounded-lg bg-leaf-light px-3 py-2 text-sm text-leaf-dark">{msg}</p>;
}

export function Icon({ name, size = 20, className = '' }: { name: keyof typeof PATHS; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {PATHS[name]}
    </svg>
  );
}

const PATHS = {
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </>
  ),
  home: (
    <>
      <path d="M3 11l9-7 9 7" />
      <path d="M5 10v10h14V10" />
    </>
  ),
  grid: (
    <>
      <rect x="4" y="4" width="7" height="7" />
      <rect x="13" y="4" width="7" height="7" />
      <rect x="4" y="13" width="7" height="7" />
      <rect x="13" y="13" width="7" height="7" />
    </>
  ),
  file: (
    <>
      <path d="M7 3h7l5 5v13H7z" />
      <path d="M14 3v5h5" />
      <path d="M10 13h6M10 17h6" />
    </>
  ),
  box: (
    <>
      <path d="M3 7l9-4 9 4v10l-9 4-9-4z" />
      <path d="M3 7l9 4 9-4M12 11v10" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1-4 4-6 8-6s7 2 8 6" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z" />
      <circle cx="12" cy="9" r="2.5" />
    </>
  ),
  truck: (
    <>
      <path d="M3 6h11v10H3zM14 10h4l3 3v3h-7" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
    </>
  ),
  check: <path d="M5 12l5 5 9-10" />,
  back: <path d="M15 5l-7 7 7 7" />,
  leaf: (
    <>
      <path d="M5 19c0-8 6-14 14-14 0 8-6 14-14 14z" />
      <path d="M5 19l7-7" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z" />
      <path d="M8.5 12l2.5 2.5 4.5-5" />
    </>
  ),
  sparkle: <path d="M12 3v6M12 15v6M3 12h6M15 12h6M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3" />,
  upload: (
    <>
      <path d="M12 16V4M7 9l5-5 5 5" />
      <path d="M4 16v4h16v-4" />
    </>
  ),
  gift: (
    <>
      <rect x="4" y="9" width="16" height="12" />
      <path d="M3 9h18M12 9v12M12 9c-2-4-6-4-6-1s6 1 6 1c2-4 6-4 6-1s-6 1-6 1" />
    </>
  ),
};
