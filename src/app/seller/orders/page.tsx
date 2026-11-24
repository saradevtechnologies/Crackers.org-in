import Link from 'next/link';
import { requireSeller } from '@/lib/auth';
import { SUB_STATUS, dateTime, inr } from '@/lib/format';
import type { OrderItem, SubOrder, SubOrderStatus } from '@/lib/types';
import { Badge, Empty, PageTitle } from '@/components/ui';
import { SellerOrderActions } from './SellerOrderActions';

const TABS: { key: string; label: string; statuses: SubOrderStatus[] }[] = [
  { key: 'todo', label: 'To pack and dispatch', statuses: ['confirmed', 'packed'] },
  { key: 'dispatched', label: 'Dispatched', statuses: ['dispatched'] },
  { key: 'done', label: 'Delivered', statuses: ['delivered'] },
  { key: 'cancelled', label: 'Cancelled', statuses: ['cancelled'] },
];

export default async function SellerOrders({ searchParams }: { searchParams: { tab?: string } }) {
  const { supabase } = await requireSeller();
  const tab = TABS.find((t) => t.key === searchParams.tab) ?? TABS[0];
  const { data } = await supabase
    .from('sub_orders')
    .select('*, order_items(*)')
    .in('status', tab.statuses)
    .order('created_at', { ascending: tab.key === 'todo' })
    .limit(100);
  const subs = (data ?? []) as (SubOrder & { order_items: OrderItem[] })[];

  return (
    <div>
      <PageTitle title="Orders" sub="Only paid and verified orders appear here." />
      <div className="mb-4 flex gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/seller/orders?tab=${t.key}`}
            className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-sm ${
              t.key === tab.key ? 'border-navy bg-navy text-white hover:text-white' : 'border-line bg-white text-navy hover:text-navy'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>
      {subs.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {subs.map((s) => (
            <section key={s.id} className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">
                    {s.order_type === 'bulk' && (
                      <span className="mr-1.5 rounded bg-[#E8EEF8] px-1.5 py-0.5 align-middle text-[11px] font-semibold text-[#1E3A6B]">BULK</span>
                    )}
                    {s.ship_name} · {s.ship_city} {s.ship_pincode}
                  </p>
                  {s.order_type === 'bulk' && (
                    <p className="text-xs">
                      {s.buyer_shop_name} · GSTIN <span className="font-mono font-medium">{s.buyer_gstin}</span>{' '}
                      <span className="text-muted">(for your GST invoice)</span>
                    </p>
                  )}
                  <p className="text-xs text-muted">
                    Phone {s.ship_phone_masked} · {dateTime(s.created_at)}
                  </p>
                </div>
                <Badge tone={SUB_STATUS[s.status].tone}>{SUB_STATUS[s.status].label}</Badge>
              </div>
              <ul className="flex flex-col gap-1 text-sm">
                {s.order_items.map((it) => (
                  <li key={it.id} className="flex justify-between gap-3">
                    <span>
                      {it.name} <span className="font-medium">× {it.qty}</span>
                    </span>
                    <span>{inr(it.price * it.qty)}</span>
                  </li>
                ))}
              </ul>
              <div className="flex justify-between border-t border-dashed border-line pt-2 text-sm">
                <span>Total</span>
                <span className="font-semibold">{inr(s.subtotal)}</span>
              </div>
              {s.transport_name && (
                <p className="text-sm text-[#4A4238]">
                  {s.transport_name} · LR {s.lr_number}
                </p>
              )}
              {s.cancel_reason && <p className="text-sm text-maroon">{s.cancel_reason}</p>}
              <SellerOrderActions id={s.id} status={s.status} supportPhone={process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? ''} />
            </section>
          ))}
        </div>
      ) : (
        <Empty title="Nothing here right now" body="New orders appear after the customer's payment is verified." />
      )}
    </div>
  );
}
