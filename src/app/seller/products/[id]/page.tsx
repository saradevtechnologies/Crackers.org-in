import { notFound } from 'next/navigation';
import { requireSeller } from '@/lib/auth';
import type { Category, Product } from '@/lib/types';
import { PageTitle } from '@/components/ui';
import { ProductForm } from '../ProductForm';

export default async function EditProduct({ params }: { params: { id: string } }) {
  const { supabase, seller } = await requireSeller();
  const [{ data: product }, { data: cats }, { data: bulk }] = await Promise.all([
    supabase.from('products').select('*').eq('id', params.id).eq('seller_id', seller.id).maybeSingle(),
    supabase.from('categories').select('*').order('sort'),
    supabase.from('product_bulk_prices').select('bulk_price').eq('product_id', params.id).maybeSingle(),
  ]);
  if (!product) notFound();
  return (
    <div>
      <PageTitle title="Edit product" />
      <ProductForm product={product as Product} categories={(cats ?? []) as Category[]} bulkPrice={bulk ? Number(bulk.bulk_price) : null} />
    </div>
  );
}
