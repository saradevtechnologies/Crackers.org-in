import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { dateTime, inr } from '@/lib/format';
import type { Order, SubOrder } from '@/lib/types';
import { Empty, PageTitle } from '@/components/ui';
import { ActionButton } from '@/components/ActionButton';
import { confirmPayment, rejectPayment } from '../actions';

export default async function AdminPayments({ searchParams }: { searchParams: { tab?: string; method?: string } }) {
  const { supabase } = await requireAdmin();
  const tab = searchParams.tab === 'unpaid' ? 'payment_pending' : 'payment_submitted';
  const method = searchParams.method === 'upi' || searchParams.method === 'bank_transfer' ? searchParams.method : null;
  let query = supabase.from('orders').select('*, sub_orders(shop_id, subtotal)').eq('status', tab);
  if (method) query = query.eq('payment_method', method);
  const { data } = await query.order('payment_submitted_at', { ascending: true, nullsFirst: false }).limit(100);
  const href = (patch: { tab?: string | null; method?: string | null }) => {
    const p = new URLSearchParams();
    const t = patch.tab !== undefined ? patch.tab : searchParams.tab;
    const m = patch.method !== undefined ? patch.method : method;
    if (t) p.set('tab', t);
    if (m) p.set('method', m);
    return `/admin/payments${p.size ? `?${p}` : ''}`;
  };
  const orders = (data ?? []) as (Order & { sub_orders: Pick<SubOrder, 'shop_id' | 'subtotal'>[] })[];

  // Short-lived links to payment screenshots
  const proofs = new Map<string, string>();
  await Promise.all(
    orders
      .filter((o) => o.proof_path)
      .map(async (o) => {
        const { data: s } = await supabase.storage.from('payment-proofs').createSignedUrl(o.proof_path!, 600);
        if (s) proofs.set(o.id, s.signedUrl);
      }),
  );

  return (
    <div>
      <PageTitle title="Payment verification" sub="Match each UTR / bank reference and amount with your bank statement, then confirm." />
      <div className="mb-2 flex flex-wrap gap-2">
        <Link href={href({ tab: null })} className={tabCls(tab === 'payment_submitted')}>
          Reference submitted
        </Link>
        <Link href={href({ tab: 'unpaid' })} className={tabCls(tab === 'payment_pending')}>
          Not paid yet
        </Link>
      </div>
      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        {(
          [
            [null, 'All'],
            ['upi', 'UPI'],
            ['bank_transfer', 'Bank transfer'],
          ] as const
        ).map(([m, label]) => (
          <Link key={label} href={href({ method: m })} className={tabCls(method === m)}>
            {label}
          </Link>
        ))}
      </div>
      {orders.length ? (
        <div className="flex flex-col gap-3">
          {orders.map((o) => (
            <div key={o.id} className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-line bg-white p-4">
              <div className="flex flex-col gap-1 text-sm">
                <p className="text-base font-semibold">
                  <Link href={`/admin/orders/${o.id}`}>{o.order_no}</Link> · {inr(o.total)}
                  {o.order_type === 'bulk' && (
                    <span className="ml-2 rounded bg-[#E8EEF8] px-1.5 py-0.5 align-middle text-[11px] font-semibold text-[#1E3A6B]">BULK</span>
                  )}
                </p>
                {o.order_type === 'bulk' && (
                  <p className="text-muted">
                    {o.buyer_shop_name} · GSTIN <span className="font-mono">{o.buyer_gstin}</span>
                  </p>
                )}
                <p>
                  {o.ship_name} · {o.ship_phone} · {o.ship_city} {o.ship_pincode}
                </p>
                <p className="text-muted">
                  {o.sub_orders.map((s) => `Shop ${s.shop_id} ${inr(s.subtotal)}`).join(' · ')}
                </p>
                <p>
                  {o.payment_method === 'bank_transfer' ? 'Bank ref' : 'UTR'} <span className="font-mono font-medium">{o.utr ?? '—'}</span>
                  {o.payment_submitted_at && <span className="text-muted"> · {dateTime(o.payment_submitted_at)}</span>}
                </p>
                {proofs.get(o.id) && (
                  <a href={proofs.get(o.id)} target="_blank" rel="noreferrer" className="font-medium">
                    {o.payment_method === 'bank_transfer' ? 'View receipt' : 'View screenshot'}
                  </a>
                )}
              </div>
              <div className="flex flex-wrap items-start gap-2">
                <ActionButton action={rejectPayment.bind(null, o.id)} label="Reject" className="btn-outline" askReason="Reason for the customer" />
                <ActionButton
                  action={confirmPayment.bind(null, o.id)}
                  label="Confirm and send to shops"
                  className="btn-green"
                  confirm={
                    o.payment_method === 'bank_transfer'
                      ? `Check ${inr(o.total)} arrived in your bank account with reference ${o.utr ?? '(none yet)'}.

Confirm and send ${o.order_no} to the shops?`
                      : `Confirm ${inr(o.total)} received for ${o.order_no}?`
                  }
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Empty title="All caught up" body="New payments appear here when customers submit their UTR." />
      )}
    </div>
  );
}

function tabCls(active: boolean) {
  // shared by the status tabs and the payment method filter
  return `rounded-full border px-3 py-1.5 text-sm ${
    active ? 'border-navy bg-navy text-white hover:text-white' : 'border-line bg-white text-navy hover:text-navy'
  }`;
}
