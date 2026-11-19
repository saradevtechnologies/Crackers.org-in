import { requireAdmin } from '@/lib/auth';
import { PageTitle } from '@/components/ui';
import { ActionButton } from '@/components/ActionButton';
import { removeArea } from '../actions';
import { AddAreaForm } from './AddAreaForm';

export default async function AdminAreas() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from('blocked_areas').select('*').order('kind').order('value');
  return (
    <div className="max-w-3xl">
      <PageTitle title="PIN code and state blocks" sub="Customers in these areas cannot place orders." />
      <AddAreaForm />
      <div className="table-wrap mt-4">
        <table className="tbl">
          <thead>
            <tr>
              <th>Type</th>
              <th>Value</th>
              <th>Reason</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((a) => (
              <tr key={a.id}>
                <td className="capitalize">{a.kind}</td>
                <td className="font-medium">{a.value}</td>
                <td>{a.reason}</td>
                <td>
                  <ActionButton action={removeArea.bind(null, a.id)} label="Remove" className="btn-ghost min-h-[36px]" confirm={`Allow orders from ${a.value} again?`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
