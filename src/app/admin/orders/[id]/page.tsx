import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { ORDER_STATUS, SUB_STATUS, dateTime, inr } from '@/lib/format';
import type { Order, OrderItem, SubOrder } from '@/lib/types';
import { Badge, Card, PageTitle } from '@/components/ui';
import { ActionButton } from '@/components/ActionButton';
import { confirmPayment, rejectPayment } from '../../actions';

export default async function AdminOrder({ params }: { params: { id: string } }) {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from('orders').select('*').eq('id', params.id).maybeSingle();
  if (!data) notFound();
  const o = data as Order;
  const [{ data: subs }, { data: events }] = await Promise.all([
    supabase.from('sub_orders').select('*, order_items(*)').eq('order_id', o.id),
    supabase.from('order_events').select('*').eq('order_id', o.id).order('created_at'),
  ]);
  const paying = o.status === 'payment_pending' || o.status === 'payment_submitted';

  return (
    <div className="flex max-w-4xl flex-col gap-4">
      <PageTitle
        title={o.order_no}
        sub={`${dateTime(o.created_at)} · ${inr(o.total)}${o.order_type === 'bulk' ? ` · BULK · bank transfer · GSTIN ${o.buyer_gstin ?? '—'} (${o.buyer_shop_name ?? ''})` : ''}`}
        action={<Badge tone={ORDER_STATUS[o.status].tone}>{ORDER_STATUS[o.status].label}</Badge>}
      />
      <Card className="grid gap-1 text-sm sm:grid-cols-2">
        <p>
          <span className="text-muted">Customer:</span> {o.ship_name} · {o.ship_phone}
        </p>
        <p>
          <span className="text-muted">UTR:</span> <span className="font-mono">{o.utr ?? '—'}</span>
        </p>
        <p className="sm:col-span-2">
          <span className="text-muted">Address:</span> {o.ship_address}, {o.ship_city}, {o.ship_state} {o.ship_pincode}
        </p>
        {o.admin_note && (
          <p className="sm:col-span-2">
            <span className="text-muted">Note:</span> {o.admin_note}
          </p>
        )}
      </Card>
      {paying && (
        <div className="flex flex-wrap gap-2">
          <ActionButton action={rejectPayment.bind(null, o.id)} label="Reject payment" className="btn-outline" askReason="Reason for the customer" />
          <ActionButton action={confirmPayment.bind(null, o.id)} label="Confirm payment" className="btn-green" confirm="Confirm payment received?" />
        </div>
      )}
      {((subs ?? []) as (SubOrder & { order_items: OrderItem[] })[]).map((s) => (
        <Card key={s.id} className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Shop {s.shop_id}</span>
            <Badge tone={SUB_STATUS[s.status].tone}>{SUB_STATUS[s.status].label}</Badge>
          </div>
          <ul className="text-sm">
            {s.order_items.map((it) => (
              <li key={it.id} className="flex justify-between">
                <span>
                  {it.name} × {it.qty}
                </span>
                <span>{inr(it.price * it.qty)}</span>
              </li>
            ))}
          </ul>
          <p className="text-sm font-medium">Subtotal {inr(s.subtotal)}</p>
          {s.transport_name && (
            <p className="text-sm">
              {s.transport_name} · LR {s.lr_number}{' '}
              {s.lr_photo_url && (
                <a href={s.lr_photo_url} target="_blank" rel="noreferrer">
                  photo
                </a>
              )}
            </p>
          )}
          {s.cancel_reason && <p className="text-sm text-maroon">Cancelled: {s.cancel_reason} (refund this part)</p>}
        </Card>
      ))}
      <Card>
        <p className="mb-2 font-semibold">History</p>
        <ol className="flex flex-col gap-1 text-sm">
          {(events ?? []).map((e) => (
            <li key={e.id}>
              <span className="text-muted">{dateTime(e.created_at)}</span> · {e.status.replace('_', ' ')}
              {e.note ? ` · ${e.note}` : ''}
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
