import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import type { Seller, SellerStatus } from '@/lib/types';
import { Badge, Empty, PageTitle } from '@/components/ui';
import { ActionButton } from '@/components/ActionButton';
import { setSellerStatus } from '../actions';

const TABS: SellerStatus[] = ['pending', 'approved', 'suspended', 'rejected'];

export default async function AdminSellers({ searchParams }: { searchParams: { tab?: string } }) {
  const { supabase } = await requireAdmin();
  const tab = (TABS as string[]).includes(searchParams.tab ?? '') ? (searchParams.tab as SellerStatus) : 'pending';
  const { data } = await supabase.from('sellers').select('*').eq('status', tab).order('created_at');
  const sellers = (data ?? []) as Seller[];
  const links = new Map<string, string>();
  await Promise.all(
    sellers
      .filter((s) => s.licence_path)
      .map(async (s) => {
        const { data: u } = await supabase.storage.from('licences').createSignedUrl(s.licence_path!, 600);
        if (u) links.set(s.id, u.signedUrl);
      }),
  );

  return (
    <div>
      <PageTitle title="Seller approvals" sub="Check the licence copy, licence number, expiry and GST before approving." />
      <div className="mb-4 flex gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <Link
            key={t}
            href={`/admin/sellers?tab=${t}`}
            className={`rounded-full border px-3 py-1.5 text-sm capitalize ${
              t === tab ? 'border-navy bg-navy text-white hover:text-white' : 'border-line bg-white text-navy hover:text-navy'
            }`}
          >
            {t}
          </Link>
        ))}
      </div>
      {sellers.length ? (
        <div className="flex flex-col gap-3">
          {sellers.map((s) => {
            const expired = s.licence_expiry && new Date(s.licence_expiry) < new Date();
            return (
              <div key={s.id} className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-line bg-white p-4 text-sm">
                <div className="flex flex-col gap-1">
                  <p className="text-base font-semibold">
                    {s.company_name} <span className="font-normal text-muted">· Shop {s.shop_id}</span>
                  </p>
                  <p>
                    GST {s.gst_number} · {s.contact_phone} · {s.email}
                  </p>
                  <p className="text-[#4A4238]">{s.address}</p>
                  <p>
                    Licence {s.licence_number} · valid until{' '}
                    <span className={expired ? 'font-medium text-maroon' : ''}>{s.licence_expiry ?? '—'}</span>
                    {expired && <Badge tone="red">Expired</Badge>}
                  </p>
                  {links.get(s.id) && (
                    <a href={links.get(s.id)} target="_blank" rel="noreferrer" className="font-medium">
                      View licence copy
                    </a>
                  )}
                  {s.admin_note && <p className="text-muted">Note: {s.admin_note}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {s.status !== 'approved' && (
                    <ActionButton action={setSellerStatus.bind(null, s.id, 'approved')} label="Approve" className="btn-green" confirm={`Approve ${s.company_name}?`} />
                  )}
                  {s.status === 'pending' && (
                    <ActionButton action={setSellerStatus.bind(null, s.id, 'rejected')} label="Reject" className="btn-outline" askReason="Reason" />
                  )}
                  {s.status === 'approved' && (
                    <ActionButton action={setSellerStatus.bind(null, s.id, 'suspended')} label="Suspend" className="btn-outline" askReason="Reason" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Empty title={`No ${tab} sellers`} />
      )}
    </div>
  );
}
