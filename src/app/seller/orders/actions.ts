'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { errMsg } from '@/lib/format';
import { flushWhatsappQueue } from '@/lib/whatsapp';

async function run(fn: string, args: Record<string, unknown>) {
  const supabase = createClient();
  const { error } = await supabase.rpc(fn, args);
  if (error) return { error: errMsg(error) };
  await flushWhatsappQueue();
  revalidatePath('/seller/orders');
  revalidatePath('/seller');
  return { ok: true };
}

export async function markPacked(id: string) {
  return run('seller_mark_packed', { p_sub_id: id });
}

export async function dispatchOrder(id: string, transport: string, lr: string, photoUrl: string | null) {
  return run('seller_dispatch', { p_sub_id: id, p_transport: transport, p_lr: lr, p_photo_url: photoUrl });
}

export async function markDelivered(id: string, otp: string) {
  return run('seller_mark_delivered', { p_sub_id: id, p_otp: otp });
}

export async function cancelSubOrder(id: string, reason: string) {
  if (!reason.trim()) return { error: 'Tell the customer why you are cancelling.' };
  return run('seller_cancel_sub_order', { p_sub_id: id, p_reason: reason.trim() });
}
