import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { Badge, Card, PageTitle } from '@/components/ui';
import { ProfileForm, WholesaleForm } from './forms';

export const metadata = { title: 'Your account' };

export default async function AccountPage() {
  const { user, profile } = await requireUser('/account');
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <PageTitle title="Your account" sub={user.email ?? undefined} />
      <Card>
        <ProfileForm name={profile.full_name ?? ''} phone={profile.phone ?? ''} />
      </Card>
      <Card className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Wholesale account</h2>
          {profile.wholesale !== 'none' && (
            <Badge tone={profile.wholesale === 'approved' ? 'green' : profile.wholesale === 'rejected' ? 'red' : 'gold'}>
              {profile.wholesale === 'pending' ? 'Under review' : profile.wholesale[0].toUpperCase() + profile.wholesale.slice(1)}
            </Badge>
          )}
        </div>
        {profile.wholesale === 'approved' ? (
          <p className="text-sm text-[#4A4238]">You see wholesale prices on products and can choose wholesale at checkout.</p>
        ) : profile.wholesale === 'pending' ? (
          <p className="text-sm text-[#4A4238]">We're checking your details. You'll see wholesale prices once approved.</p>
        ) : (
          <WholesaleForm />
        )}
      </Card>
      {profile.role === 'customer' && (
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
