'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getLang } from '@/lib/i18n';
import { t, waitText } from '@/lib/copy';
import { clientIp, limit } from '@/lib/rate-limit';
import { EMAIL_RE } from '@/lib/validate';
import { passwordProblems } from '@/lib/common-passwords';
import { flushWhatsappQueue } from '@/lib/whatsapp';
import { siteUrl } from '@/lib/bulk';
import { clearStepUp, linkSession, needsPhoneCheck, sendStepUpCode, stepUpVerified, verifyStepUpCode } from '@/lib/password-reset';
import type { Profile } from '@/lib/types';

/** Always answers the same way, whether or not the email exists. */
export async function requestPasswordReset(emailRaw: string) {
  const lang = getLang();
  const email = emailRaw.trim().toLowerCase();
  const sent = { ok: true as const, message: t('forgot.sent', lang) };
  if (!EMAIL_RE.test(email)) return sent;

  const rl = await limit([
    { key: `reset_email:${email}`, max: 3, windowSec: 3600 },
    { key: `reset_ip:${clientIp()}`, max: 20, windowSec: 3600 },
  ]);
  if (!rl.ok) return { ok: false as const, message: t('forgot.limit', lang, { wait: waitText(rl.retryAfter, lang) }) };

  // Supabase's own per-email limit and "user not found" are both swallowed so nothing reveals whether the email exists.
  await createAdminClient()
    .auth.resetPasswordForEmail(email, { redirectTo: `${siteUrl()}/auth/confirm?next=/auth/reset-verify` })
    .catch(() => null);
  return sent;
}

async function me() {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
  return { supabase, user: data.user, profile: profile as Profile };
}

/** Send (or resend) the phone code during a password reset. */
export async function sendResetCode() {
  const lang = getLang();
  const s = await me();
  if (!s || !(await linkSession(s.supabase)).recovery || !s.profile.phone) return { ok: false as const, error: t('pwset.sessionGone', lang) };
  const r = await sendStepUpCode(s.user.id, s.profile.phone);
  if (r.ok) return { ok: true as const, wait: r.wait };
  if (r.failed) return { ok: false as const, error: t('stepup.sendFailed', lang) };
  return { ok: false as const, wait: r.wait, error: t('login.resendWait', lang, { wait: waitText(r.wait, lang) }) };
}

export async function verifyResetCode(code: string) {
  const lang = getLang();
  const s = await me();
  if (!s || !(await linkSession(s.supabase)).recovery) return { ok: false as const, error: t('pwset.sessionGone', lang) };
  const r = await verifyStepUpCode(s.user.id, code);
  if (r.ok) return { ok: true as const };
  if (r.reason === 'wrong') return { ok: false as const, error: t('stepup.wrong', lang, { n: r.attemptsLeft }) };
  if (r.reason === 'expired' || r.reason === 'missing') return { ok: false as const, error: t('login.expiredCode', lang) };
  return { ok: false as const, error: t('stepup.locked', lang) };
}

/** Final step for invites and resets. */
export async function setNewPassword(password: string, confirm: string) {
  const lang = getLang();
  if (password !== confirm) return { error: t('pwset.mismatch', lang) };
  const p = passwordProblems(password);
  if (p.tooShort) return { error: t('pwset.tooShort', lang) };
  if (p.common) return { error: t('pwset.common', lang) };

  const s = await me();
  if (!s) return { error: t('pwset.sessionGone', lang), expired: true };
  const link = await linkSession(s.supabase);
  if (!link.invite && !link.recovery) return { error: t('pwset.sessionGone', lang), expired: true };

  // A reset (not a first-time invite) needs the phone code for bulk buyers.
  if (link.recovery && !link.invite && needsPhoneCheck(s.profile) && s.profile.phone && !(await stepUpVerified(s.user.id))) {
    return { error: t('pwset.needCode', lang), needCode: true };
  }

  const { error } = await s.supabase.auth.updateUser({ password });
  if (error) {
    if (error.code === 'same_password') return { error: 'That is your current password. Choose a new one.' };
    if (error.code === 'weak_password') return { error: t('pwset.common', lang) };
    return { error: t('common.tryAgain', lang) };
  }
  await s.supabase.auth.signOut({ scope: 'others' });
  await clearStepUp(s.user.id);

  if (s.profile.phone) {
    const admin = createAdminClient();
    await admin.rpc('queue_message', {
      p_phone: s.profile.phone,
      p_name: s.profile.full_name ?? '',
      p_text: t('pwset.wa', 'en', { support: process.env.NEXT_PUBLIC_SUPPORT_PHONE || 'support' }),
    });
    await flushWhatsappQueue();
  }
  return { ok: true };
}
