import 'server-only';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import type { BulkApplication, Profile, Seller } from '@/lib/types';

/** Cached per request, so the header, banner and page share one lookup. */
export const getSession = cache(async function getSession() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, profile: null as Profile | null };
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  return { supabase, user, profile: (profile as Profile | null) ?? null };
});

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

/** The signed-in user's bulk application, if they are a bulk buyer (any status). */
export const getBulkAccount = cache(async function getBulkAccount() {
  const s = await getSession();
  if (!s.user || s.profile?.account_type !== 'bulk') return { ...s, bulk: null as BulkApplication | null, bulkActive: false };
  const [{ data: app }, { data: active }] = await Promise.all([
    s.supabase.from('bulk_applications').select('*').eq('user_id', s.user.id).maybeSingle(),
    s.supabase.rpc('is_bulk_buyer'),
  ]);
  return { ...s, bulk: (app as BulkApplication | null) ?? null, bulkActive: active === true };
});
