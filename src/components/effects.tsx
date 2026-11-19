'use client';

import { useEffect, useRef } from 'react';
import { skyShots, sparkleAt } from '@/lib/effects';

/** Wraps a banner so the pointer leaves a trail of gold sparkles. */
export function SparkleTrail({ children, className }: { children: React.ReactNode; className?: string }) {
  const last = useRef(0);
  const onMove = (x: number, y: number) => {
    const now = performance.now();
    if (now - last.current < 30) return;
    last.current = now;
    sparkleAt(x, y);
  };
  return (
    <div
      className={className}
      onMouseMove={(e) => onMove(e.clientX, e.clientY)}
      onTouchMove={(e) => onMove(e.touches[0].clientX, e.touches[0].clientY)}
    >
      {children}
    </div>
  );
}

/** Fires sky shots once when mounted. */
export function Celebrate({ shots = 1 }: { shots?: number }) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    skyShots(shots);
  }, [shots]);
  return null;
}
