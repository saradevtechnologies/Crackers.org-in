import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { inr } from '@/lib/format';
import type { Product } from '@/lib/types';
import { Badge, PageTitle } from '@/components/ui';
import { ActionButton } from '@/components/ActionButton';
import { setProductActive } from '../actions';

export default async function AdminProducts({ searchParams }: { searchParams: { q?: string } }) {
  const { supabase } = await requireAdmin();
  let query = supabase.from('products').select('*').order('created_at', { ascending: false }).limit(200);
  const q = searchParams.q?.trim();
  if (q) query = /^\d{5}$/.test(q) ? query.eq('shop_id', q) : query.ilike('name', `%${q.replace(/[%_]/g, '')}%`);
  const { data } = await query;
  const products = (data ?? []) as Product[];
  return (
    <div>
      <PageTitle title="Catalogue review" sub="Unlist banned items such as series crackers (laris) or barium-based products." />
      <form className="mb-4 flex gap-2">
        <label htmlFor="q" className="sr-only">
          Search
        </label>
        <input id="q" name="q" defaultValue={q} className="input h-10 w-64" placeholder="Product name or shop ID" />
        <button className="btn-ghost min-h-[40px]">Search</button>
      </form>
      <div className="table-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Product</th>
              <th>Shop</th>
              <th>Price</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>
                  <Link href={`/products/${p.id}`}>{p.name}</Link> {p.is_green && <Badge tone="green">Green</Badge>}
                </td>
                <td>{p.shop_id}</td>
                <td>{inr(p.price)}</td>
                <td>{p.active ? <Badge tone="green">Listed</Badge> : <Badge>Unlisted</Badge>}</td>
                <td>
                  <ActionButton
                    action={setProductActive.bind(null, p.id, !p.active)}
                    label={p.active ? 'Unlist' : 'List again'}
                    className="btn-ghost min-h-[36px]"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
