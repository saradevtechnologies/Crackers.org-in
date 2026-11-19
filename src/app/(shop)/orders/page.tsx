import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { ORDER_STATUS, dateTime, inr } from '@/lib/format';
import type { Order } from '@/lib/types';
import { Badge, Empty, PageTitle } from '@/components/ui';

export const metadata = { title: 'Your orders' };

export default async function OrdersPage() {
  const { supabase } = await requireUser('/orders');
  const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(100);
  const orders = (data ?? []) as Order[];
  return (
    <div className="mx-auto max-w-2xl">
      <PageTitle title="Your orders" />
      {orders.length ? (
        <div className="flex flex-col gap-3">
          {orders.map((o) => (
            <Link
              key={o.id}
              href={`/orders/${o.id}`}
              className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-white p-4 text-navy hover:text-navy"
            >
              <div>
                <p className="font-semibold">{o.order_no}</p>
                <p className="text-xs text-muted">{dateTime(o.created_at)}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="font-medium">{inr(o.total)}</span>
                <Badge tone={ORDER_STATUS[o.status].tone}>{ORDER_STATUS[o.status].label}</Badge>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <Empty title="No orders yet" body="Your orders and their tracking show up here." href="/products" cta="Start shopping" />
      )}
    </div>
  );
}
