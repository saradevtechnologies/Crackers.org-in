import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import type { BulkApplication, BulkStatus } from '@/lib/types';
import { Badge, Empty, PageTitle } from '@/components/ui';
import { dateTime } from '@/lib/format';
import { documentLinks, todayIST } from '@/lib/bulk';
import { BulkActions } from './BulkActions';

const TABS: { key: BulkStatus; label: string }[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'renewal_pending', label: 'Renewal pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'suspended', label: 'Suspended' },
];

export const metadata = { title: 'Bulk buyers' };

export default async function AdminBulk({ searchParams }: { searchParams: { tab?: string } }) {
  const { supabase } = await requireAdmin();
  const tab = TABS.find((x) => x.key === searchParams.tab)?.key ?? 'pending';
  const [{ data }, ...counts] = await Promise.all([
    supabase
      .from('bulk_applications')
      .select('*')
      .eq('status', tab)
      .neq('document_paths', '{}')
      .order(tab === 'pending' || tab === 'renewal_pending' ? 'updated_at' : 'reviewed_at', { ascending: tab === 'pending' || tab === 'renewal_pending' })
      .limit(100),
    ...TABS.map((x) =>
      supabase.from('bulk_applications').select('id', { count: 'exact', head: true }).eq('status', x.key).neq('document_paths', '{}'),
    ),
  ]);
  const apps = (data ?? []) as BulkApplication[];
  const docs = new Map(await Promise.all(apps.map(async (a) => [a.id, await documentLinks(a.document_paths)] as const)));
  const today = todayIST();

  return (
    <div className="max-w-4xl">
      <PageTitle title="Bulk buyers" sub="Licensed shop owners applying for bulk prices. Check the licence copy, expiry and GSTIN before approving." />
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((x, i) => (
          <Link
            key={x.key}
            href={`/admin/bulk?tab=${x.key}`}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm ${
              x.key === tab ? 'border-navy bg-navy text-white hover:text-white' : 'border-line bg-white text-navy hover:text-navy'
            }`}
          >
            {x.label}
            {!!counts[i].count && <span className="rounded-full bg-gold px-1.5 text-xs text-gold-text">{counts[i].count}</span>}
          </Link>
        ))}
      </div>

      {apps.length ? (
        <div className="flex flex-col gap-3">
          {apps.map((a) => {
            const expired = a.licence_expiry < today;
            return (
              <div key={a.id} className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-base font-semibold">
                      {a.shop_name} <span className="font-mono font-normal text-muted">· {a.application_no}</span>
                    </p>
                    <p className="text-muted">Applied {dateTime(a.created_at)}{a.reviewed_at ? ` · reviewed ${dateTime(a.reviewed_at)}` : ''}</p>
                  </div>
                  <div className="flex gap-1.5">
                    {expired && <Badge tone="red">Licence expired</Badge>}
                    {a.user_id && <Badge tone="green">Login linked</Badge>}
                  </div>
                </div>
                <dl className="grid gap-x-4 gap-y-1 sm:grid-cols-[140px_1fr]">
                  {(
                    [
                      ['Owner', a.owner_name],
                      ['Mobile', a.phone],
                      ['Email', a.email],
                      ['Address', `${a.address}, ${a.city}, ${a.state} ${a.pincode}`],
                      ['GSTIN', a.gstin],
                      ['Licence no.', a.licence_number],
                      ['Valid until', a.licence_expiry],
                    ] as const
                  ).map(([k, v]) => (
                    <div key={k} className="contents">
                      <dt className="text-muted">{k}</dt>
                      <dd className={`break-words font-medium ${k === 'Valid until' && expired ? 'text-maroon' : ''} ${k === 'GSTIN' ? 'font-mono' : ''}`}>{v}</dd>
                    </div>
                  ))}
                </dl>
                <div className="flex flex-wrap gap-2">
                  {(docs.get(a.id) ?? []).map((d, i) => (
                    <a key={d.path} href={d.url ?? '#'} target="_blank" rel="noreferrer" className="btn-ghost min-h-[40px]">
                      📄 {i === 0 ? 'Licence' : `Document ${i + 1}`}
                    </a>
                  ))}
                  <span className="self-center text-xs text-muted">Links expire in 10 minutes. Reload for new ones.</span>
                </div>
                {a.admin_note && <p className="rounded-lg bg-cream px-3 py-2 text-[#4A4238]">Note: {a.admin_note}</p>}
                <BulkActions id={a.id} status={a.status} shop={a.shop_name} expired={expired} />
              </div>
            );
          })}
        </div>
      ) : (
        <Empty title={`No ${TABS.find((x) => x.key === tab)!.label.toLowerCase()} applications`} />
      )}
    </div>
  );
}
