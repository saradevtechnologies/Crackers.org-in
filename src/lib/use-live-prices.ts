'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { estimate, type EstimateLine } from '@/lib/estimate';

export interface LivePrices {
  ready: boolean;
  /** Approved bulk buyer with a valid licence. */
  bulkActive: boolean;
  bulkMin: number;
  /** product id → bulk price. Empty for everyone who isn't an active bulk buyer. */
  bulk: Record<string, number>;
  /** seller id → that shop's minimum order */
  minOrders: Record<string, number>;
  unavailable: string[];
}

const INITIAL: LivePrices = { ready: false, bulkActive: false, bulkMin: 500000, bulk: {}, minOrders: {}, unavailable: [] };

/**
 * Refreshes the estimate from the server: normal prices, stock and shop minimums for everyone,
 * plus bulk prices only for active bulk buyers. Prices in the cart are only a display copy;
 * the order is always priced again in the database (place_order).
 */
export function useLivePrices(lines: EstimateLine[]): LivePrices {
  const [state, setState] = useState<LivePrices>(INITIAL);
  const ids = lines.map((l) => l.productId).join(',');

  useEffect(() => {
    if (!ids) return setState({ ...INITIAL, ready: true });
    let cancelled = false;
    const supabase = createClient();
    (async () => {
      const idList = ids.split(',');
      const [{ data: products }, { data: active }, { data: minRow }] = await Promise.all([
        supabase.from('products').select('id, price, mrp, name, in_stock, active, image_url, seller_id, shop_id').in('id', idList),
        supabase.rpc('is_bulk_buyer'),
        supabase.from('app_settings').select('value').eq('key', 'bulk_min_order').maybeSingle(),
      ]);
      const found = new Map((products ?? []).map((p) => [p.id, p]));
      const gone: string[] = [];
      const fresh: EstimateLine[] = estimate.snapshot().map((l) => {
        const p = found.get(l.productId);
        if (!p || !p.in_stock || !p.active) {
          gone.push(l.productId);
          return l;
        }
        return { ...l, price: Number(p.price), mrp: Number(p.mrp), name: p.name, image: p.image_url, shopId: p.shop_id, sellerId: p.seller_id };
      });
      if (JSON.stringify(fresh) !== JSON.stringify(estimate.snapshot())) estimate.replace(fresh);

      const bulkActive = active === true;
      let bulk: Record<string, number> = {};
      if (bulkActive) {
        const { data } = await supabase.from('product_bulk_prices').select('product_id, bulk_price').in('product_id', idList);
        bulk = Object.fromEntries((data ?? []).map((r) => [r.product_id, Number(r.bulk_price)]));
      }
      const sellerIds = Array.from(new Set(fresh.map((l) => l.sellerId)));
      const { data: shops } = await supabase.from('public_shops').select('id, min_order').in('id', sellerIds);
      if (cancelled) return;
      setState({
        ready: true,
        bulkActive,
        bulkMin: Number(minRow?.value) > 0 ? Number(minRow?.value) : 500000,
        bulk,
        minOrders: Object.fromEntries((shops ?? []).map((s) => [s.id, Number(s.min_order)])),
        unavailable: gone,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [ids]);

  return state;
}

/** Unit price for a line under the chosen order type. Items without a bulk price use the normal price. */
export function unitPrice(l: EstimateLine, type: 'retail' | 'bulk', bulk: Record<string, number>) {
  return type === 'bulk' ? bulk[l.productId] ?? l.price : l.price;
}
