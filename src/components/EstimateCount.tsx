'use client';

import { useEstimate } from '@/lib/estimate';

export function EstimateCount() {
  const lines = useEstimate();
  const n = lines.reduce((s, l) => s + l.qty, 0);
  if (!n) return null;
  return <span className="rounded-full bg-gold px-1.5 text-xs text-gold-text">{n}</span>;
}
