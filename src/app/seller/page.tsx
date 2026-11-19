import Link from 'next/link';
import { requireSeller } from '@/lib/auth';
import { SUB_STATUS, dateTime, inr } from '@/lib/format';
import type { SubOrder } from '@/lib/types';
import { Badge, PageTitle } from '@/components/ui';
import { Celebrate } from '@/components/effects';

export default async function SellerDashboard({ searchParams }: { searchParams: { registered?: string } }) {
  const { supabase, seller } = await requireSeller();
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const [newO, toDispatch, live, month, recent] = await Promise.all([
    supabase.from('sub_orders').select('id', { count: 'exact', head: true }).eq('status', 'confirmed'),
    supabase.from('sub_orders').select('id', { count: 'exact', head: true }).in('status', ['confirmed', 'packed']),
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('seller_id', seller.id).eq('active', true),
    supabase.from('sub_orders').select('subtotal').neq('status', 'cancelled').gte('created_at', monthStart),
    supabase.from('sub_orders').select('*').order('created_at', { ascending: false }).limit(8),
  ]);
  const sales = (month.data ?? []).reduce((s, r) => s + Number(r.subtotal), 0);
  const expiry = seller.licence_expiry ? new Date(seller.licence_expiry) : null;
  const daysLeft = expiry ? Math.ceil((expiry.getTime() - Date.now()) / 86400000) : null;

  return (
    <div className="flex flex-col gap-5">
      {searchParams.registered && <Celebrate shots={1} />}
      <PageTitle
        title="Dashboard"
        sub={`Shop ${seller.shop_id}`}
        action={
          <Link href="/seller/products/new" className="btn-primary">
            Add product
          </Link>
        }
      />
      {daysLeft !== null && daysLeft < 60 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-gold-light px-4 py-3 text-sm text-gold-dark">
          <span>
            {daysLeft < 0
              ? 'Your explosives licence has expired.'
              : `Your explosives licence expires in ${daysLeft} days (${expiry!.toLocaleDateString('en-IN')}).`}{' '}
            Upload the renewed licence to keep your shop live.
          </span>
          <Link href="/seller/settings" className="font-semibold text-gold-dark">
            Upload now
          </Link>
        </div>
      )}
      {!seller.upi_id && (
        <div className="rounded-xl bg-[#E8EEF8] px-4 py-3 text-sm text-[#1E3A6B]">
          Add your UPI ID and minimum order value in <Link href="/seller/settings">Shop settings</Link>.
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="New orders" value={String(newO.count ?? 0)} />
        <Metric label="To dispatch" value={String(toDispatch.count ?? 0)} accent />
        <Metric label="Products live" value={String(live.count ?? 0)} />
        <Metric label="Sales this month" value={inr(sales)} />
      </div>
      <section>
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Recent orders</h2>
          <Link href="/seller/orders" className="text-sm font-medium">
            View all
          </Link>
        </div>
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Date</th>
                <th>Customer</th>
                <th>Place · PIN</th>
                <th>Phone</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {((recent.data ?? []) as SubOrder[]).map((s) => (
                <tr key={s.id}>
                  <td>{dateTime(s.created_at)}</td>
                  <td>{s.ship_name}</td>
                  <td>
                    {s.ship_city} · {s.ship_pincode}
                  </td>
                  <td>{s.ship_phone_masked}</td>
                  <td>{inr(s.subtotal)}</td>
                  <td>
                    <Badge tone={SUB_STATUS[s.status].tone}>{SUB_STATUS[s.status].label}</Badge>
                  </td>
                </tr>
              ))}
              {!recent.data?.length && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted">
                    Confirmed orders appear here after we verify the customer's payment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className={`text-2xl font-semibold ${accent ? 'text-maroon' : ''}`}>{value}</p>
    </div>
  );
}
