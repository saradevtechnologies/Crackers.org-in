'use client';

import { useEstimate } from '@/lib/estimate';

export function EstimateCount() {
  const lines = useEstimate();
  const n = lines.reduce((s, l) => s + l.qty, 0);
  if (!n) return null;
  // key={n} replays the bump animation every time the count changes.
  return (
    <span
      key={n}
      className="inline-flex h-5 min-w-[20px] animate-bump items-center justify-center rounded-full bg-gradient-to-b from-[#FCE7B0] to-gold px-1.5 text-[11px] font-semibold text-gold-text shadow-sm"
    >
      {n}
    </span>
  );
}
