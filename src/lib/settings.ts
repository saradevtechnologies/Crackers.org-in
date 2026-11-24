import 'server-only';
import { createClient } from '@/lib/supabase/server';

export const DEFAULT_BULK_MIN = 500000;

export interface BankDetails {
  account_name: string;
  account_number: string;
  ifsc: string;
  bank: string;
  branch: string;
}

/** Bulk minimum order (₹), from app_settings. Readable by everyone. */
export async function getBulkMin() {
  const { data } = await createClient().from('app_settings').select('value').eq('key', 'bulk_min_order').maybeSingle();
  const n = Number(data?.value);
  return n > 0 ? n : DEFAULT_BULK_MIN;
}

/** Bank details for bulk payments. RLS returns them only to approved bulk buyers and admins. */
export async function getBankDetails(): Promise<BankDetails | null> {
  const { data } = await createClient().from('app_settings').select('value').eq('key', 'bulk_bank_details').maybeSingle();
  return (data?.value as BankDetails | undefined) ?? null;
}
