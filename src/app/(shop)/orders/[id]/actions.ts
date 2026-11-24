'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { errMsg } from '@/lib/format';

/** `ref` is the 12-digit UPI UTR or the 10–22 character bank reference; the database checks which applies. */
export async function submitPayment(orderId: string, ref: string, proofPath: string | null) {
  const supabase = createClient();
  const { error } = await supabase.rpc('submit_payment', {
    p_order_id: orderId,
    p_ref: ref.replace(/\s/g, ''),
    p_proof_path: proofPath,
  });
  if (error) return { error: errMsg(error) };
  revalidatePath(`/orders/${orderId}`);
  return { ok: true };
}

export async function cancelOrder(orderId: string) {
  const supabase = createClient();
  const { error } = await supabase.rpc('cancel_my_order', { p_order_id: orderId });
  if (error) return { error: errMsg(error) };
  revalidatePath(`/orders/${orderId}`);
  return { ok: true };
}
