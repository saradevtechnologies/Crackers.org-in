'use client';

import { useState } from 'react';
import type { Product } from '@/lib/types';
import { AddToEstimate } from '@/components/AddToEstimate';

export function QtyAdd({ product }: { product: Product }) {
  const [qty, setQty] = useState(1);
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-12 items-center rounded-xl border border-line bg-white">
        <button type="button" aria-label="Decrease quantity" className="h-12 w-11 text-xl" onClick={() => setQty((q) => Math.max(1, q - 1))}>
          −
        </button>
        <span className="w-8 text-center font-medium" aria-live="polite">
          {qty}
        </span>
        <button type="button" aria-label="Increase quantity" className="h-12 w-11 text-xl" onClick={() => setQty((q) => Math.min(9999, q + 1))}>
          +
        </button>
      </div>
      <AddToEstimate product={product} qty={qty} />
    </div>
  );
}
