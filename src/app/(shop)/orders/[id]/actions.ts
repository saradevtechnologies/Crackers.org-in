'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { errMsg } from '@/lib/format';

export async function submitPayment(orderId: string, utr: string, proofPath: string | null) {
  const supabase = createClient();
  const { error } = await supabase.rpc('submit_payment', {
    p_order_id: orderId,
    p_utr: utr.replace(/\s/g, ''),
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
