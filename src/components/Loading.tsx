/** Spinning ground-chakkar loader with twinkling sparks. */
export function FestiveSpinner({ size = 56, label }: { size?: number; label?: string }) {
  return (
    <div role="status" className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 48 48" className="h-full w-full animate-spin-slow" aria-hidden="true">
          <defs>
            <linearGradient id="fs-g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#F3D99A" />
              <stop offset="1" stopColor="#D4A23A" />
            </linearGradient>
          </defs>
          {Array.from({ length: 8 }, (_, i) => (
            <path
              key={i}
              d="M24 9 Q31 11 33 17"
              stroke={i % 2 ? '#9B1C1C' : 'url(#fs-g)'}
              strokeWidth="2.6"
              strokeLinecap="round"
              fill="none"
              opacity={0.35 + (i / 8) * 0.65}
              transform={`rotate(${i * 45} 24 24)`}
            />
          ))}
          <circle cx="24" cy="24" r="7" fill="#2E6B47" />
          <circle cx="24" cy="24" r="7" fill="none" stroke="#F3D99A" strokeWidth="2" strokeDasharray="3 2.5" />
          <circle cx="24" cy="24" r="1.8" fill="#FFF6D5" />
        </svg>
        <span className="absolute -right-1 top-0 h-1.5 w-1.5 animate-twinkle rounded-full bg-gold" />
        <span className="absolute -left-1 bottom-1 h-1 w-1 animate-twinkle rounded-full bg-maroon [animation-delay:.8s]" />
        <span className="absolute -top-1 left-1/3 h-1 w-1 animate-twinkle rounded-full bg-[#F3D99A] [animation-delay:1.4s]" />
      </div>
      {label && <p className="animate-pulse text-sm font-medium text-muted">{label}</p>}
      <span className="sr-only">Loading</span>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-line bg-white/80 p-3 shadow-soft">
      <div className="skeleton aspect-[4/3] w-full" />
      <div className="skeleton h-4 w-16" />
      <div className="skeleton h-4 w-4/5" />
      <div className="skeleton h-5 w-24" />
      <div className="mt-1 flex items-center justify-between">
        <div className="skeleton h-3 w-14" />
        <div className="skeleton h-9 w-16" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
