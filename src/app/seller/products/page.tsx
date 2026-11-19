import Link from 'next/link';
import { requireSeller } from '@/lib/auth';
import { inr } from '@/lib/format';
import type { Product } from '@/lib/types';
import { Badge, Empty, PageTitle } from '@/components/ui';
import { ProductImage } from '@/components/ProductCard';
import { ProductToggles } from './ProductToggles';

export default async function SellerProducts() {
  const { supabase, seller } = await requireSeller();
  const { data } = await supabase
    .from('products')
    .select('*, categories(name)')
    .eq('seller_id', seller.id)
    .order('created_at', { ascending: false });
  const products = (data ?? []) as (Product & { categories: { name: string } | null })[];
  return (
    <div>
      <PageTitle
        title="Products"
        sub={`${products.length} products`}
        action={
          <div className="flex gap-2">
            <Link href="/seller/products/import" className="btn-ghost">
              Upload CSV
            </Link>
            <Link href="/seller/products/new" className="btn-primary">
              Add product
            </Link>
          </div>
        }
      />
      {products.length ? (
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Wholesale</th>
                <th>In stock</th>
                <th>Listed</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <ProductImage src={p.image_url} alt={p.name} className="h-11 w-11 flex-none" />
                      <div>
                        <p className="font-medium">{p.name}</p>
                        {p.is_green && <Badge tone="green">Green</Badge>}
                      </div>
                    </div>
                  </td>
                  <td>{p.categories?.name ?? '—'}</td>
                  <td>
                    {inr(p.price)} <span className="text-xs text-muted line-through">{inr(p.mrp)}</span>
                  </td>
                  <td>{p.wholesale_price ? `${inr(p.wholesale_price)} × ${p.wholesale_min_qty}+` : '—'}</td>
                  <ProductToggles id={p.id} inStock={p.in_stock} active={p.active} />
                  <td>
                    <Link href={`/seller/products/${p.id}`} className="font-medium">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty
          title="Add your first product"
          body="Add products one by one, or upload your price list as a CSV file."
          href="/seller/products/new"
          cta="Add product"
        />
      )}
    </div>
  );
}
