import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { inr } from '@/lib/format';
import { PageTitle } from '@/components/ui';

export default async function AdminHome() {
  const { supabase } = await requireAdmin();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [pay, todayOrders, sellers, live, confirmed] = await Promise.all([
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'payment_submitted'),
    supabase.from('orders').select('total').gte('created_at', today.toISOString()),
    supabase.from('sellers').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('active', true),
    supabase.from('orders').select('total').in('status', ['confirmed', 'completed']),
  ]);
  const revenue = (confirmed.data ?? []).reduce((s, r) => s + Number(r.total), 0);
  return (
    <div className="flex flex-col gap-5">
      <PageTitle title="Dashboard" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Payments to verify" value={String(pay.count ?? 0)} href="/admin/payments" accent />
        <Metric label="Orders today" value={String(todayOrders.data?.length ?? 0)} href="/admin/orders" />
        <Metric label="Approved shops" value={String(sellers.count ?? 0)} href="/admin/sellers" />
        <Metric label="Products live" value={String(live.count ?? 0)} href="/admin/products" />
      </div>
      <div className="rounded-2xl border border-line bg-white p-4">
        <p className="text-sm text-muted">Confirmed order value (all time)</p>
        <p className="text-3xl font-semibold">{inr(revenue)}</p>
      </div>
    </div>
  );
}

function Metric({ label, value, href, accent }: { label: string; value: string; href: string; accent?: boolean }) {
  return (
    <Link href={href} className="rounded-2xl border border-line bg-white p-4 text-navy hover:text-navy">
      <p className="text-sm text-muted">{label}</p>
      <p className={`text-2xl font-semibold ${accent ? 'text-maroon' : ''}`}>{value}</p>
    </Link>
  );
}
