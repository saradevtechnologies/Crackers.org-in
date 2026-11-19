'use client';

import { useEffect } from 'react';
import { skyShots } from '@/lib/effects';
import type { OrderStatus } from '@/lib/types';

/** Celebrate once per order when it becomes confirmed (5 shots) and when it completes (6 shots). */
export function OrderCelebration({ orderId, status }: { orderId: string; status: OrderStatus }) {
  useEffect(() => {
    if (status !== 'confirmed' && status !== 'completed') return;
    const key = `celebrated-${orderId}-${status}`;
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, '1');
    } catch {
      // storage blocked: celebrate anyway
    }
    skyShots(status === 'completed' ? 6 : 5);
  }, [orderId, status]);

  if (status === 'completed')
    return <p className="rounded-xl bg-gold-light px-4 py-3 text-center font-medium text-gold-dark">All items delivered. Happy Diwali!</p>;
  return null;
}
