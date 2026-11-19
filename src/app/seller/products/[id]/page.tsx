import { notFound } from 'next/navigation';
import { requireSeller } from '@/lib/auth';
import type { Category, Product } from '@/lib/types';
import { PageTitle } from '@/components/ui';
import { ProductForm } from '../ProductForm';

export default async function EditProduct({ params }: { params: { id: string } }) {
  const { supabase, seller } = await requireSeller();
  const [{ data: product }, { data: cats }] = await Promise.all([
    supabase.from('products').select('*').eq('id', params.id).eq('seller_id', seller.id).maybeSingle(),
    supabase.from('categories').select('*').order('sort'),
  ]);
  if (!product) notFound();
  return (
    <div>
      <PageTitle title="Edit product" />
      <ProductForm product={product as Product} categories={(cats ?? []) as Category[]} />
    </div>
  );
}
