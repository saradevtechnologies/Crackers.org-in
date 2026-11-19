import { requireAdmin } from '@/lib/auth';
import type { Profile } from '@/lib/types';
import { Empty, PageTitle } from '@/components/ui';
import { ActionButton } from '@/components/ActionButton';
import { setWholesale } from '../actions';

export default async function AdminWholesale() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from('profiles').select('*').eq('wholesale', 'pending').order('created_at');
  const people = (data ?? []) as Profile[];
  return (
    <div>
      <PageTitle title="Wholesale approvals" sub="Shop owners asking for wholesale prices." />
      {people.length ? (
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Shop</th>
                <th>GSTIN</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {people.map((p) => (
                <tr key={p.id}>
                  <td>{p.full_name}</td>
                  <td>{p.phone}</td>
                  <td>{p.wholesale_shop_name}</td>
                  <td className="font-mono">{p.wholesale_gstin}</td>
                  <td>
                    <div className="flex gap-2">
                      <ActionButton action={setWholesale.bind(null, p.id, 'approved')} label="Approve" className="btn-green min-h-[36px]" />
                      <ActionButton action={setWholesale.bind(null, p.id, 'rejected')} label="Reject" className="btn-outline min-h-[36px]" confirm="Reject this request?" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty title="No pending requests" />
      )}
    </div>
  );
}
