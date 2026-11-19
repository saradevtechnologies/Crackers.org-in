import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { PageTitle } from '@/components/ui';
import { SellerRegisterForm } from './SellerRegisterForm';

export const metadata = { title: 'Sell on crackers.org.in' };

export default async function SellPage() {
  const { supabase, user } = await requireUser('/sell');
  const { data: existing } = await supabase.from('sellers').select('id').eq('user_id', user.id).maybeSingle();
  if (existing) redirect('/seller');
  return (
    <div className="mx-auto max-w-2xl">
      <PageTitle
        title="Register your shop"
        sub="Licensed firecracker manufacturers and traders only. We verify every licence before your shop goes live."
      />
      <SellerRegisterForm email={user.email ?? ''} />
    </div>
  );
}
