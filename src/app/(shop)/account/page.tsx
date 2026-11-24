import Link from 'next/link';
import { getBulkAccount, requireUser } from '@/lib/auth';
import { Card, PageTitle } from '@/components/ui';
import { getT } from '@/lib/i18n';
import { ProfileForm } from './forms';
import { BulkCard } from './BulkCard';

export const metadata = { title: 'Your account' };

export default async function AccountPage() {
  const { user, profile } = await requireUser('/account');
  const t = getT();
  const { bulk } = await getBulkAccount();
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <PageTitle title={t('account.title')} sub={user.email ?? undefined} />
      <Card>
        <ProfileForm name={profile.full_name ?? ''} phone={profile.phone ?? user.phone ?? ''} phoneNote={t('account.phoneLocked')} />
      </Card>
      {bulk && (
        <div id="bulk" className="scroll-mt-24">
          <BulkCard app={bulk} />
        </div>
      )}
      {profile.role === 'customer' && profile.account_type !== 'bulk' && (
        <Card className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold">Are you a licensed manufacturer?</p>
            <p className="text-sm text-muted">List your crackers and reach buyers across India.</p>
          </div>
          <Link href="/sell" className="btn-outline">
            Become a seller
          </Link>
        </Card>
      )}
      <form action="/auth/signout" method="post">
        <button className="btn-ghost w-full">Sign out</button>
      </form>
    </div>
  );
}
