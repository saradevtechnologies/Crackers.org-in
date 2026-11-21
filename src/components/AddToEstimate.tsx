'use client';

import { useState } from 'react';
import type { Product } from '@/lib/types';
import { estimate } from '@/lib/estimate';
import { sparkleBurst } from '@/lib/effects';
import { Icon } from './ui';

export function AddToEstimate({ product, compact, qty = 1 }: { product: Product; compact?: boolean; qty?: number }) {
  const [added, setAdded] = useState(false);
  if (!product.in_stock) {
    return <span className="text-xs font-medium text-muted">Out of stock</span>;
  }
  return (
    <button
      type="button"
      className={`${compact ? 'btn-primary min-h-[36px] rounded-full px-3.5 text-xs' : 'btn-primary flex-1 text-base'} ${
        added ? '!from-[#3A8059] !to-leaf-dark' : ''
      }`}
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
      {added ? (
        <span key="added" className="flex animate-pop items-center gap-1">
          <Icon name="check" size={compact ? 14 : 18} />
          Added
        </span>
      ) : (
        <span key="add" className="flex items-center gap-1">
          {compact && <span aria-hidden="true" className="text-sm leading-none">+</span>}
          {compact ? 'Add' : 'Add to estimate'}
        </span>
      )}
    </button>
  );
}
