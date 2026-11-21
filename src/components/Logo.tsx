/** Brand mark: a gold sparkle burst on a maroon tile, plus the wordmark. */
export function LogoMark({ size = 38, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id="lm-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#B52626" />
          <stop offset="1" stopColor="#6E1010" />
        </linearGradient>
        <linearGradient id="lm-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FCE7B0" />
          <stop offset="1" stopColor="#D4A23A" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#lm-bg)" />
      <g stroke="url(#lm-gold)" strokeWidth="2" strokeLinecap="round">
        <path d="M20 8v5M20 27v5M8 20h5M27 20h5M11.5 11.5l3.5 3.5M25 25l3.5 3.5M28.5 11.5L25 15M15 25l-3.5 3.5" />
      </g>
      <path d="M20 14.5l1.7 3.8 3.8 1.7-3.8 1.7-1.7 3.8-1.7-3.8-3.8-1.7 3.8-1.7z" fill="url(#lm-gold)" />
      <circle cx="31" cy="9" r="1.4" fill="#FCE7B0" />
      <circle cx="9" cy="31" r="1" fill="#FCE7B0" opacity=".8" />
    </svg>
  );
}

export function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <span className="font-display text-[1.3rem] font-bold leading-none tracking-tight">
      <span className={light ? 'text-white' : 'text-maroon'}>crackers</span>
      <span className={light ? 'text-[#F3D99A]' : 'text-gold'}>.org.in</span>
    </span>
  );
}
