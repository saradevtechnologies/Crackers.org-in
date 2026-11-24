import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getT } from '@/lib/i18n';
import { linkSession, needsPhoneCheck, stepUpVerified } from '@/lib/password-reset';
import { SetPasswordForm } from '../SetPasswordForm';

export const metadata = { title: 'Set your password' };

export default async function SetPasswordPage() {
  const { supabase, user, profile } = await getSession();
  if (!user || !profile) redirect('/auth/link-expired');
  const link = await linkSession(supabase);
  if (!link.invite && !link.recovery) redirect('/auth/link-expired');
  // Resets for bulk buyers must pass the phone check first.
  if (link.recovery && !link.invite && needsPhoneCheck(profile) && profile.phone && !(await stepUpVerified(user.id))) {
    redirect('/auth/reset-verify');
  }
  const t = getT();
  return (
    <div className="mx-auto flex max-w-sm flex-col gap-4 rounded-2xl border border-line bg-white p-6 shadow-soft">
      <div>
        <h1 className="text-2xl font-semibold">{t('pwset.title')}</h1>
        <p className="mt-1 text-sm text-muted">
          {t('pwset.sub')} {user.email && <span className="font-medium text-navy">{user.email}</span>}
        </p>
      </div>
      <SetPasswordForm />
    </div>
  );
}
