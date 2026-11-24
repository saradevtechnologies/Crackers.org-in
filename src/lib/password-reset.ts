import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkCode, generateCode, isFreshlyVerified, newRow, resendWait, type OtpRow } from '@/lib/otp-core';
import { sendOtp } from '@/lib/otp-sender';
import type { Profile } from '@/lib/types';

/**
 * How this session signed in, from the JWT "amr" claim (e.g. "invite", "recovery", "password", "otp").
 * Only called after supabase.auth.getUser() has verified the user with the server.
 */
export async function sessionMethods(supabase: SupabaseClient): Promise<{ method: string; at: number }[]> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return [];
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8')) as {
      amr?: { method: string; timestamp: number }[];
    };
    return (payload.amr ?? []).map((a) => ({ method: a.method, at: a.timestamp * 1000 }));
  } catch {
    return [];
  }
}

const LINK_WINDOW_MS = 60 * 60 * 1000;

/** Signed in from an email link (invite / recovery) within the last hour? Set-password is only allowed then. */
export async function linkSession(supabase: SupabaseClient) {
  const now = Date.now();
  const amr = await sessionMethods(supabase);
  const recent = (m: string) => amr.some((a) => a.method === m && now - a.at < LINK_WINDOW_MS);
  return { invite: recent('invite') || recent('email/signup') || recent('magiclink'), recovery: recent('recovery') };
}

/** Bulk buyers always confirm their mobile during a reset; others only if REQUIRE_PHONE_FOR_ALL_RESETS=true. */
export function needsPhoneCheck(profile: Pick<Profile, 'account_type'>) {
  return profile.account_type === 'bulk' || process.env.REQUIRE_PHONE_FOR_ALL_RESETS === 'true';
}

async function sendTimes(userId: string) {
  const admin = createAdminClient();
  const since = new Date(Date.now() - 3600_000).toISOString();
  const { data } = await admin.from('rate_limits').select('created_at').eq('key', `stepup_send:${userId}`).gte('created_at', since);
  return (data ?? []).map((r) => new Date(r.created_at as string).getTime());
}

/** Sends a new code unless it's too soon. Returns seconds to wait (0 when sent). */
export async function sendStepUpCode(userId: string, phone: string) {
  const wait = resendWait(await sendTimes(userId));
  if (wait > 0) return { ok: false as const, wait };
  const admin = createAdminClient();
  const code = generateCode();
  const { error } = await admin.from('step_up_otps').upsert({ user_id: userId, ...newRow(code, userId), created_at: new Date().toISOString() });
  if (error) return { ok: false as const, wait: 0, failed: true };
  await admin.from('rate_limits').insert({ key: `stepup_send:${userId}` });
  try {
    await sendOtp(phone, code);
  } catch {
    return { ok: false as const, wait: 0, failed: true };
  }
  return { ok: true as const, wait: 30 };
}

/** Seconds until another code may be sent, and whether an unexpired, unlocked code is waiting. */
export async function stepUpState(userId: string) {
  const admin = createAdminClient();
  const { data } = await admin.from('step_up_otps').select('*').eq('user_id', userId).maybeSingle();
  const row = data as OtpRow | null;
  return {
    wait: resendWait(await sendTimes(userId)),
    pending: !!row && !row.verified_at && new Date(row.expires_at).getTime() > Date.now() && row.attempts < 5,
    verified: isFreshlyVerified(row),
  };
}

export async function verifyStepUpCode(userId: string, code: string) {
  const admin = createAdminClient();
  const { data } = await admin.from('step_up_otps').select('*').eq('user_id', userId).maybeSingle();
  const r = checkCode(data as OtpRow | null, code, userId);
  if (r.row) await admin.from('step_up_otps').update({ attempts: r.row.attempts, verified_at: r.row.verified_at }).eq('user_id', userId);
  return r;
}

export async function stepUpVerified(userId: string) {
  const admin = createAdminClient();
  const { data } = await admin.from('step_up_otps').select('verified_at').eq('user_id', userId).maybeSingle();
  return isFreshlyVerified(data as OtpRow | null);
}

export async function clearStepUp(userId: string) {
  const admin = createAdminClient();
  await admin.from('step_up_otps').delete().eq('user_id', userId);
}
