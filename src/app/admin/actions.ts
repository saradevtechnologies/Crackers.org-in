'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { errMsg } from '@/lib/format';
import { flushWhatsappQueue } from '@/lib/whatsapp';
import type { SellerStatus } from '@/lib/types';
import { getSession } from '@/lib/auth';
import { approveApplication, resendInvite } from '@/lib/bulk';
import { safeHref } from '@/lib/hero';

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

// ---------- Bulk buyers ----------

/** Re-checks the caller is an admin before any service-role work. */
async function adminId() {
  const { user, profile } = await getSession();
  return user && profile?.role === 'admin' ? user.id : null;
}

export async function approveBulk(id: string) {
  const me = await adminId();
  if (!me) return { error: 'Not allowed.' };
  const r = await approveApplication(id, me);
  if (!r.ok) return { error: r.error };
  revalidatePath('/admin', 'layout');
  return { ok: true };
}

export async function resendBulkInvite(id: string) {
  const me = await adminId();
  if (!me) return { error: 'Not allowed.' };
  const r = await resendInvite(id);
  if (!r.ok) return { error: r.error };
  return { ok: true };
}

export async function rejectBulk(id: string, reason: string) {
  if (!reason.trim()) return { error: 'Choose or type a reason.' };
  return rpc('admin_reject_bulk_application', { p_id: id, p_reason: reason.trim() }, ['/admin']);
}

export async function setBulkStatus(id: string, status: 'approved' | 'suspended', note: string) {
  return rpc('admin_set_bulk_status', { p_id: id, p_status: status, p_note: note || null }, ['/admin']);
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

// ---------- Home page hero slides ----------

export interface HeroSlideInput {
  badge: string;
  title: string;
  subtitle: string;
  offer: string;
  primary_label: string;
  primary_href: string;
  secondary_label: string;
  secondary_href: string;
  image_url: string;
  active: boolean;
}

function heroRevalidate() {
  revalidatePath('/admin/hero');
  revalidatePath('/');
}

export async function saveHeroSlide(id: string | null, input: HeroSlideInput) {
  const clean = (s: string) => s.trim() || null;
  const row = {
    badge: clean(input.badge),
    title: input.title.trim(),
    subtitle: clean(input.subtitle),
    offer: clean(input.offer),
    primary_label: clean(input.primary_label),
    primary_href: clean(input.primary_href),
    secondary_label: clean(input.secondary_label),
    secondary_href: clean(input.secondary_href),
    image_url: clean(input.image_url),
    active: input.active,
    updated_at: new Date().toISOString(),
  };
  if (!row.title) return { error: 'Enter a heading for the slide.' };
  for (const [label, href] of [
    ['Button 1', row.primary_href],
    ['Button 2', row.secondary_href],
    ['Background image', row.image_url],
  ] as const) {
    if (href && !safeHref(href)) return { error: `${label} link must start with / or https://` };
  }
  if (row.primary_label && !row.primary_href) return { error: 'Add a link for button 1, or clear its name.' };
  if (row.secondary_label && !row.secondary_href) return { error: 'Add a link for button 2, or clear its name.' };

  const supabase = createClient();
  if (id) {
    const { error } = await supabase.from('hero_slides').update(row).eq('id', id);
    if (error) return { error: errMsg(error) };
  } else {
    const { data: last } = await supabase.from('hero_slides').select('sort').order('sort', { ascending: false }).limit(1).maybeSingle();
    const { error } = await supabase.from('hero_slides').insert({ ...row, sort: (last?.sort ?? 0) + 1 });
    if (error) return { error: errMsg(error) };
  }
  heroRevalidate();
  return { ok: true };
}

export async function deleteHeroSlide(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from('hero_slides').delete().eq('id', id);
  if (error) return { error: errMsg(error) };
  heroRevalidate();
  return { ok: true };
}

export async function setHeroSlideActive(id: string, active: boolean) {
  const supabase = createClient();
  const { error } = await supabase.from('hero_slides').update({ active }).eq('id', id);
  if (error) return { error: errMsg(error) };
  heroRevalidate();
  return { ok: true };
}

/** Swaps a slide with its neighbour. Renumbers all slides so equal sort values can't get stuck. */
export async function moveHeroSlide(id: string, dir: -1 | 1) {
  const supabase = createClient();
  const { data, error } = await supabase.from('hero_slides').select('id').order('sort').order('created_at');
  if (error) return { error: errMsg(error) };
  const ids = (data ?? []).map((r) => r.id as string);
  const i = ids.indexOf(id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= ids.length) return { ok: true };
  [ids[i], ids[j]] = [ids[j], ids[i]];
  const results = await Promise.all(ids.map((sid, k) => supabase.from('hero_slides').update({ sort: k + 1 }).eq('id', sid)));
  const failed = results.find((r) => r.error);
  if (failed?.error) return { error: errMsg(failed.error) };
  heroRevalidate();
  return { ok: true };
}
