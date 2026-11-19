'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { errMsg } from '@/lib/format';
import { flushWhatsappQueue } from '@/lib/whatsapp';
import type { SellerStatus, WholesaleStatus } from '@/lib/types';

async function rpc(fn: string, args: Record<string, unknown>, paths: string[]) {
  const supabase = createClient();
  const { error } = await supabase.rpc(fn, args);
  if (error) return { error: errMsg(error) };
  await flushWhatsappQueue();
  paths.forEach((p) => revalidatePath(p, 'layout'));
  return { ok: true };
}

export async function confirmPayment(orderId: string) {
  return rpc('admin_confirm_payment', { p_order_id: orderId }, ['/admin']);
}

export async function rejectPayment(orderId: string, reason: string) {
  if (!reason.trim()) return { error: 'Enter a reason for the customer.' };
  return rpc('admin_reject_payment', { p_order_id: orderId, p_reason: reason.trim() }, ['/admin']);
}

export async function setSellerStatus(sellerId: string, status: SellerStatus, note: string) {
  return rpc('admin_set_seller_status', { p_seller_id: sellerId, p_status: status, p_note: note || null }, ['/admin']);
}

export async function setWholesale(userId: string, status: WholesaleStatus) {
  return rpc('admin_set_wholesale', { p_user_id: userId, p_status: status }, ['/admin']);
}

export async function addArea(kind: 'pincode' | 'state', value: string, reason: string) {
  const v = value.trim();
  if (kind === 'pincode' && !/^\d{6}$/.test(v)) return { error: 'Enter a 6-digit PIN code.' };
  if (!v) return { error: 'Enter a state name.' };
  const supabase = createClient();
  const { error } = await supabase.from('blocked_areas').insert({ kind, value: v, reason: reason.trim() || null });
  if (error) return { error: errMsg(error) };
  revalidatePath('/admin/areas');
  return { ok: true };
}

export async function removeArea(id: number) {
  const supabase = createClient();
  const { error } = await supabase.from('blocked_areas').delete().eq('id', id);
  if (error) return { error: errMsg(error) };
  revalidatePath('/admin/areas');
  return { ok: true };
}

export async function markNotification(id: number, status: 'sent' | 'queued') {
  const supabase = createClient();
  const { error } = await supabase
    .from('notifications')
    .update({ status, sent_at: status === 'sent' ? new Date().toISOString() : null })
    .eq('id', id);
  if (error) return { error: errMsg(error) };
  revalidatePath('/admin', 'layout');
  return { ok: true };
}

export async function sendQueuedNow() {
  await flushWhatsappQueue();
  revalidatePath('/admin', 'layout');
  return { ok: true };
}

export async function setProductActive(id: string, active: boolean) {
  const supabase = createClient();
  const { error } = await supabase.from('products').update({ active }).eq('id', id);
  if (error) return { error: errMsg(error) };
  revalidatePath('/admin/products');
  return { ok: true };
}
