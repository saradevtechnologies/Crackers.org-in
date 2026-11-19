import { requireSeller } from '@/lib/auth';
import { PanelShell } from '@/components/PanelShell';
import { Badge } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  const { supabase, seller } = await requireSeller();
  let toAct = 0;
  if (seller.status === 'approved') {
    const { count } = await supabase
      .from('sub_orders')
      .select('id', { count: 'exact', head: true })
      .in('status', ['confirmed', 'packed']);
    toAct = count ?? 0;
  }
  const nav = [
    { href: '/seller', label: 'Dashboard' },
    { href: '/seller/orders', label: 'Orders', count: toAct },
    { href: '/seller/products', label: 'Products' },
    { href: '/seller/products/import', label: 'Excel / CSV upload' },
    { href: '/seller/settings', label: 'Shop settings' },
  ];
  return (
    <PanelShell title="Seller panel" sub={`Shop ${seller.shop_id}`} nav={nav}>
      {seller.status === 'approved' ? (
        children
      ) : (
        <div className="mx-auto max-w-lg rounded-2xl border border-line bg-white p-6 text-center">
          <Badge tone={seller.status === 'pending' ? 'gold' : 'red'}>
            {seller.status === 'pending' ? 'Under review' : seller.status[0].toUpperCase() + seller.status.slice(1)}
          </Badge>
          <h1 className="mt-3 text-xl font-semibold">Shop {seller.shop_id}</h1>
          <p className="mt-2 text-sm text-[#4A4238]">
            {seller.status === 'pending'
              ? "We're verifying your licence and GST details. You can add products once your shop is approved."
              : `Your shop is ${seller.status}. ${seller.admin_note ?? ''} Contact support for help.`}
          </p>
        </div>
      )}
    </PanelShell>
  );
}
