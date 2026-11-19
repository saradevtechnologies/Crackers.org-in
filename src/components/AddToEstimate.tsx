'use client';

import { useState } from 'react';
import type { Product } from '@/lib/types';
import { estimate } from '@/lib/estimate';
import { sparkleBurst } from '@/lib/effects';

export function AddToEstimate({ product, compact, qty = 1 }: { product: Product; compact?: boolean; qty?: number }) {
  const [added, setAdded] = useState(false);
  if (!product.in_stock) {
    return <span className="text-xs font-medium text-muted">Out of stock</span>;
  }
  return (
    <button
      type="button"
      className={compact ? 'btn-primary min-h-[36px] px-3 text-xs' : 'btn-primary flex-1 text-base'}
      onClick={(e) => {
        estimate.add(
          {
            productId: product.id,
            sellerId: product.seller_id,
            shopId: product.shop_id,
            name: product.name,
            price: Number(product.price),
            mrp: Number(product.mrp),
            image: product.image_url,
          },
          qty,
        );
        const r = e.currentTarget.getBoundingClientRect();
        sparkleBurst(r.left + r.width / 2, r.top + r.height / 2);
        setAdded(true);
        setTimeout(() => setAdded(false), 1200);
      }}
    >
      {added ? 'Added' : compact ? 'Add' : 'Add to estimate'}
    </button>
  );
}
