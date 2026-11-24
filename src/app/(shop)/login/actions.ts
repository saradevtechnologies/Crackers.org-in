'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getLang } from '@/lib/i18n';
import { t } from '@/lib/copy';
import { clear, record, usage } from '@/lib/rate-limit';
import { EMAIL_RE } from '@/lib/validate';

const MAX_FAILS = 5;
const LOCK_SEC = 15 * 60;

/**
 * Email + password sign-in for sellers, admins and bulk buyers.
 * Runs on the server so failed attempts can be counted: after 5 wrong passwords in 15 minutes
 * the email is paused for 15 minutes (never locked permanently).
 */
export async function passwordLogin(emailRaw: string, password: string, kind: 'staff' | 'bulk') {
  const lang = getLang();
  const email = emailRaw.trim().toLowerCase();
  if (!EMAIL_RE.test(email) || !password) return { error: t('pw.wrong', lang) };

  const key = `pw_fail:${email}`;
  const u = await usage(key, LOCK_SEC);
  if (u.count >= MAX_FAILS) return { error: t('pw.locked', lang) };

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (!error) {
    await clear(key);
    return { ok: true };
  }

  if (error.status === 429) return { error: t('pw.locked', lang) };
  await record(key);
  if (u.count + 1 >= MAX_FAILS) return { error: t('pw.locked', lang) };

  // Bulk applicants who try to log in before approval get told where their application is.
  if (kind === 'bulk') {
    const pending = await pendingApplicationNo(email);
    if (pending) return { error: t('pw.pendingApp', lang, { no: pending }) };
  }
  return { error: t('pw.wrong', lang) };
}

/** Application number if this email has an application still waiting for review. Returns nothing else. */
async function pendingApplicationNo(email: string) {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from('bulk_applications')
      .select('application_no')
      .eq('email', email)
      .eq('status', 'pending')
      .is('user_id', null)
      .maybeSingle();
    return (data?.application_no as string | undefined) ?? null;
  } catch {
    return null;
  }
}
