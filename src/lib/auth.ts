import 'server-only';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Profile, Seller } from '@/lib/types';

export async function getSession() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, profile: null as Profile | null };
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  return { supabase, user, profile: (profile as Profile | null) ?? null };
}

export async function requireUser(next = '/') {
  const s = await getSession();
  if (!s.user || !s.profile) redirect(`/login?next=${encodeURIComponent(next)}`);
  return s as typeof s & { user: NonNullable<typeof s.user>; profile: Profile };
}

export async function requireAdmin() {
  const s = await requireUser('/admin');
  if (s.profile.role !== 'admin') redirect('/');
  return s;
}

/** Returns the signed-in user's seller row (any status). Redirects if they have none. */
export async function requireSeller() {
  const s = await requireUser('/seller');
  const { data: seller } = await s.supabase.from('sellers').select('*').eq('user_id', s.user.id).maybeSingle();
  if (!seller) redirect('/sell');
  return { ...s, seller: seller as Seller };
}
