import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { ORDER_STATUS, dateTime, inr } from '@/lib/format';
import type { Order, OrderStatus } from '@/lib/types';
import { Badge, PageTitle } from '@/components/ui';

export default async function AdminOrders({ searchParams }: { searchParams: { status?: string; q?: string } }) {
  const { supabase } = await requireAdmin();
  let query = supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(200);
  if (searchParams.status && searchParams.status in ORDER_STATUS) query = query.eq('status', searchParams.status);
  const q = searchParams.q?.trim();
  if (q) query = query.or(`order_no.ilike.%${q.replace(/[%,()]/g, '')}%,ship_phone.ilike.%${q.replace(/[%,()]/g, '')}%`);
  const { data } = await query;
  const orders = (data ?? []) as Order[];

  return (
    <div>
      <PageTitle title="Orders" />
      <form className="mb-4 flex flex-wrap gap-2">
        <label htmlFor="q" className="sr-only">
          Search
        </label>
        <input id="q" name="q" defaultValue={q} placeholder="Order number or phone" className="input h-10 w-60" />
        <label htmlFor="status" className="sr-only">
          Status
        </label>
        <select id="status" name="status" defaultValue={searchParams.status ?? ''} className="input h-10 w-52">
          <option value="">All statuses</option>
          {(Object.keys(ORDER_STATUS) as OrderStatus[]).map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS[s].label}
            </option>
          ))}
        </select>
        <button className="btn-ghost min-h-[40px]">Filter</button>
      </form>
      <div className="table-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Order</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Place</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>
                  <Link href={`/admin/orders/${o.id}`} className="font-medium">
                    {o.order_no}
                  </Link>
                  {o.order_type === 'bulk' && <span className="ml-1 rounded bg-[#E8EEF8] px-1.5 text-[10px] font-semibold text-[#1E3A6B]">BULK</span>}
                </td>
                <td>{dateTime(o.created_at)}</td>
                <td>
                  {o.ship_name}
                  <br />
                  <span className="text-xs text-muted">{o.ship_phone}</span>
                </td>
                <td>
                  {o.ship_city}, {o.ship_state} {o.ship_pincode}
                </td>
                <td>{inr(o.total)}</td>
                <td>
                  <Badge tone={ORDER_STATUS[o.status].tone}>{ORDER_STATUS[o.status].label}</Badge>
                </td>
              </tr>
            ))}
            {!orders.length && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-muted">
                  No orders match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
