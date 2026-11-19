'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { errMsg } from '@/lib/format';

export type FormState = { error?: string; ok?: string } | null;

export async function updateProfile(_: FormState, f: FormData): Promise<FormState> {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: 'Sign in again.' };
  const phone = String(f.get('phone') ?? '').replace(/[\s-]/g, '');
  if (!/^\+?\d{10,13}$/.test(phone)) return { error: 'Enter a valid mobile number.' };
  const { error } = await supabase
    .from('profiles')
    .update({ full_name: String(f.get('name') ?? '').trim(), phone })
    .eq('id', auth.user.id);
  if (error) return { error: errMsg(error) };
  revalidatePath('/account');
  return { ok: 'Saved' };
}

export async function applyWholesale(_: FormState, f: FormData): Promise<FormState> {
  const gstin = String(f.get('gstin') ?? '').trim().toUpperCase();
  if (!/^[0-9]{2}[A-Z0-9]{13}$/.test(gstin)) return { error: 'Enter a valid 15-character GSTIN.' };
  const supabase = createClient();
  const { error } = await supabase.rpc('request_wholesale', {
    p_gstin: gstin,
    p_shop_name: String(f.get('shop') ?? '').trim(),
  });
  if (error) return { error: errMsg(error) };
  revalidatePath('/account');
  return { ok: 'Request sent' };
}
