import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getT } from '@/lib/i18n';
import { createAdminClient } from '@/lib/supabase/admin';
import { limit } from '@/lib/rate-limit';
import { linkSession, needsPhoneCheck, stepUpState } from '@/lib/password-reset';
import { maskPhone } from '@/lib/validate';
import { SetPasswordForm } from '../SetPasswordForm';
import { StepUpForm } from './StepUpForm';

export const metadata = { title: 'Reset your password' };

export default async function ResetVerifyPage() {
  const { supabase, user, profile } = await getSession();
  if (!user || !profile) redirect('/auth/link-expired?type=recovery');
  if (!(await linkSession(supabase)).recovery) redirect('/auth/link-expired?type=recovery');
  const t = getT();

  let showForm = true;
  let state: Awaited<ReturnType<typeof stepUpState>> | null = null;
  if (needsPhoneCheck(profile)) {
    if (profile.phone) {
      state = await stepUpState(user.id);
      showForm = state.verified;
    } else {
      // No phone on file: allow the email-only reset, but tell the admin (once an hour).
      const rl = await limit([{ key: `reset_nophone_alert:${user.id}`, max: 1, windowSec: 3600 }]);
      const support = process.env.NEXT_PUBLIC_SUPPORT_PHONE;
      if (rl.ok && support) {
        await createAdminClient().rpc('queue_message', {
          p_phone: support,
          p_name: 'Admin',
          p_text: `password reset without a phone check for ${user.email ?? user.id} (no mobile on file). Check this was expected.`,
        });
      }
    }
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-4 rounded-2xl border border-line bg-white p-6 shadow-soft">
      {showForm ? (
        <>
          <h1 className="text-2xl font-semibold">{t('pwset.title')}</h1>
          <SetPasswordForm />
        </>
      ) : (
        <>
          <div>
            <h1 className="text-2xl font-semibold">{t('stepup.title')}</h1>
            <p className="mt-1 text-sm text-muted">{t('stepup.why')}</p>
          </div>
          <StepUpForm masked={maskPhone(profile.phone)} autoSend={!state?.pending && state?.wait === 0} initialWait={state?.wait ?? 0} />
        </>
      )}
    </div>
  );
}
