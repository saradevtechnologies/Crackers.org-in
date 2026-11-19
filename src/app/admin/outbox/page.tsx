import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { dateTime } from '@/lib/format';
import { waLink, whatsappMode } from '@/lib/whatsapp';
import { Badge, Empty, PageTitle } from '@/components/ui';
import { ActionButton } from '@/components/ActionButton';
import { markNotification, sendQueuedNow } from '../actions';

export default async function Outbox({ searchParams }: { searchParams: { tab?: string } }) {
  const { supabase } = await requireAdmin();
  const tab = searchParams.tab === 'sent' ? 'sent' : searchParams.tab === 'failed' ? 'failed' : 'queued';
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('status', tab)
    .order('id', { ascending: tab === 'queued' })
    .limit(200);
  const mode = whatsappMode();

  return (
    <div className="max-w-4xl">
      <PageTitle
        title="WhatsApp outbox"
        sub={
          mode === 'manual'
            ? 'Manual mode: tap Open WhatsApp to send each message from your business number, then mark it sent.'
            : 'Cloud API mode: messages send automatically. Failed ones are listed for retry.'
        }
        action={mode === 'cloud' ? <ActionButton action={sendQueuedNow} label="Send queued now" className="btn-primary" /> : undefined}
      />
      <div className="mb-4 flex gap-2">
        {(['queued', 'failed', 'sent'] as const).map((t) => (
          <Link
            key={t}
            href={`/admin/outbox?tab=${t}`}
            className={`rounded-full border px-3 py-1.5 text-sm capitalize ${
              t === tab ? 'border-navy bg-navy text-white hover:text-white' : 'border-line bg-white text-navy hover:text-navy'
            }`}
          >
            {t}
          </Link>
        ))}
      </div>
      {data?.length ? (
        <div className="flex flex-col gap-3">
          {data.map((n) => (
            <div key={n.id} className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-line bg-white p-4 text-sm">
              <div className="flex max-w-xl flex-col gap-1">
                <p className="font-medium">
                  {n.to_name} · {n.to_phone} <span className="font-normal text-muted">· {dateTime(n.created_at)}</span>
                </p>
                <p className="text-[#4A4238]">{n.message}</p>
                {n.error && <p className="text-xs text-maroon">{n.error}</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                {tab !== 'sent' && (
                  <>
                    <a href={waLink(n.to_phone, n.message)} target="_blank" rel="noreferrer" className="btn-green min-h-[36px]">
                      Open WhatsApp
                    </a>
                    <ActionButton action={markNotification.bind(null, n.id, 'sent')} label="Mark sent" className="btn-ghost min-h-[36px]" />
                  </>
                )}
                {tab === 'failed' && (
                  <ActionButton action={markNotification.bind(null, n.id, 'queued')} label="Retry" className="btn-ghost min-h-[36px]" />
                )}
                {tab === 'sent' && <Badge tone="green">Sent</Badge>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Empty title="Nothing here" body="Order updates are queued here automatically." />
      )}
    </div>
  );
}
