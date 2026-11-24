import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getBulkAccount } from '@/lib/auth';

/**
 * Bulk prices for these products, ONLY for an active bulk buyer.
 * For anyone else the query is skipped entirely, so no bulk price can end up in the page HTML.
 * (RLS on product_bulk_prices enforces the same rule in the database.)
 */
export async function bulkPricesFor(productIds: string[]): Promise<Map<string, number> | null> {
  const { supabase, bulkActive } = await getBulkAccount();
  if (!bulkActive) return null;
  return fetchBulkPrices(supabase, productIds);
}

export async function fetchBulkPrices(supabase: SupabaseClient, productIds: string[]) {
  const map = new Map<string, number>();
  if (!productIds.length) return map;
  const { data } = await supabase.from('product_bulk_prices').select('product_id, bulk_price').in('product_id', productIds);
  (data ?? []).forEach((r) => map.set(r.product_id as string, Number(r.bulk_price)));
  return map;
}
