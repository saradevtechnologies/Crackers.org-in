import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { ORDER_STATUS, SUB_STATUS, dateTime, inr } from '@/lib/format';
import type { Order, OrderItem, SubOrder, SubOrderStatus } from '@/lib/types';
import { Badge, Card, ErrorNote } from '@/components/ui';
import { PaymentPanel } from './PaymentPanel';
import { BankTransferPanel } from './BankTransferPanel';
import { createAdminClient } from '@/lib/supabase/admin';
import type { BankDetails } from '@/lib/settings';
import { OrderCelebration } from './OrderCelebration';
import { CancelOrder } from './CancelOrder';

export const metadata = { title: 'Order' };

const STEPS: SubOrderStatus[] = ['confirmed', 'packed', 'dispatched', 'delivered'];

export default async function OrderPage({ params }: { params: { id: string } }) {
  const { supabase } = await requireUser(`/orders/${params.id}`);
  const { data: order } = await supabase.from('orders').select('*').eq('id', params.id).maybeSingle();
  if (!order) notFound();
  const o = order as Order;
  const { data: subs } = await supabase.from('sub_orders').select('*, order_items(*)').eq('order_id', o.id).order('shop_id');
  const subIds = (subs ?? []).map((s) => s.id);
  const { data: otps } = subIds.length
    ? await supabase.from('pickup_otps').select('*').in('sub_order_id', subIds)
    : { data: [] as { sub_order_id: string; otp: string }[] };
  const otp = new Map((otps ?? []).map((x) => [x.sub_order_id, x.otp]));
  const st = ORDER_STATUS[o.status];
  const paying = o.status === 'payment_pending' || o.status === 'payment_submitted';

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <OrderCelebration orderId={o.id} status={o.status} />
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">{o.order_no}</h1>
          <p className="text-sm text-muted">
            Placed {dateTime(o.created_at)} · {inr(o.total)}
          </p>
        </div>
        <Badge tone={st.tone}>{st.label}</Badge>
      </div>

      {o.status === 'rejected' && <ErrorNote msg={`We could not verify your payment. ${o.admin_note ?? ''} Contact support for help.`} />}

      {paying && o.payment_method === 'upi' && <PaymentPanel orderId={o.id} orderNo={o.order_no} amount={Number(o.total)} submittedUtr={o.utr} />}
      {paying && o.payment_method === 'bank_transfer' && (
        <BankTransferPanel orderId={o.id} orderNo={o.order_no} amount={Number(o.total)} submittedRef={o.utr} bank={await bankDetails()} />
      )}
      {o.status === 'payment_pending' && <CancelOrder orderId={o.id} />}

      {(subs as (SubOrder & { order_items: OrderItem[] })[] | null)?.map((s) => {
        const idx = STEPS.indexOf(s.status);
        return (
          <Card key={s.id} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Shop {s.shop_id}</span>
              <Badge tone={SUB_STATUS[s.status].tone}>{SUB_STATUS[s.status].label}</Badge>
            </div>
            <ul className="flex flex-col gap-1 text-sm">
              {s.order_items.map((it) => (
                <li key={it.id} className="flex justify-between gap-3">
                  <span>
                    {it.name} <span className="text-muted">× {it.qty}</span>
                  </span>
                  <span>{inr(it.price * it.qty)}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between border-t border-dashed border-line pt-2 text-sm">
              <span>Subtotal</span>
              <span className="font-semibold">{inr(s.subtotal)}</span>
            </div>
            {s.status !== 'cancelled' && s.status !== 'awaiting_payment' && (
              <ol className="flex gap-1" aria-label="Progress">
                {STEPS.map((step, i) => (
                  <li key={step} className="flex-1">
                    <span className={`block h-1.5 rounded-full ${i <= idx ? 'bg-leaf' : 'bg-[#E2D6BF]'}`} />
                    <span className="mt-1 block text-[11px] text-muted">{SUB_STATUS[step].label}</span>
                  </li>
                ))}
              </ol>
            )}
            {s.status === 'cancelled' && s.cancel_reason && <p className="text-sm text-maroon">{s.cancel_reason}</p>}
            {(s.status === 'dispatched' || s.status === 'delivered') && (
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 rounded-xl bg-[#F7F1E6] p-3 text-sm">
                <span className="text-muted">Transport</span>
                <span className="font-medium">{s.transport_name}</span>
                <span className="text-muted">LR number</span>
                <span className="font-medium">{s.lr_number}</span>
                {s.status === 'dispatched' && (
                  <>
                    <span className="text-muted">Pickup OTP</span>
                    <span className="font-semibold tracking-widest text-gold-dark">{otp.get(s.id)}</span>
                  </>
                )}
                {s.lr_photo_url && (
                  <a href={s.lr_photo_url} target="_blank" rel="noreferrer" className="col-span-2 mt-1 text-sm font-medium">
                    View LR photo
                  </a>
                )}
              </div>
            )}
          </Card>
        );
      })}

      <Card className="text-sm">
        <p className="mb-1 font-medium">Delivery to</p>
        <p>
          {o.ship_name} · {o.ship_phone}
        </p>
        <p className="text-[#4A4238]">
          {o.ship_address}, {o.ship_city}, {o.ship_state} {o.ship_pincode}
        </p>
      </Card>
    </div>
  );
}

/**
 * Bank details for a bank-transfer order. The order above was read with the buyer's own session (RLS),
 * so ownership is already proven; read with the service role so a buyer whose bulk access lapsed can still pay.
 */
async function bankDetails() {
  const { data } = await createAdminClient().from('app_settings').select('value').eq('key', 'bulk_bank_details').maybeSingle();
  return (data?.value as BankDetails | undefined) ?? null;
}
