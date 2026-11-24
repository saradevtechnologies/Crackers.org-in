'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { errMsg } from '@/lib/format';

export type FormState = { error?: string; ok?: string } | null;

export async function updateProfile(_: FormState, f: FormData): Promise<FormState> {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: 'Sign in again.' };
  const name = String(f.get('name') ?? '').trim();
  if (name.length < 2) return { error: 'Enter your name.' };
  // The phone number is the login for OTP customers, so it is not changed here.
  const { error } = await supabase.from('profiles').update({ full_name: name }).eq('id', auth.user.id);
  if (error) return { error: errMsg(error) };
  revalidatePath('/account');
  return { ok: 'Saved' };
}
