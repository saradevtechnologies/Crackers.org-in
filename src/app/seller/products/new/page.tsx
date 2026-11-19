import { requireSeller } from '@/lib/auth';
import type { Category } from '@/lib/types';
import { PageTitle } from '@/components/ui';
import { ProductForm } from '../ProductForm';

export default async function NewProduct() {
  const { supabase } = await requireSeller();
  const { data } = await supabase.from('categories').select('*').order('sort');
  return (
    <div>
      <PageTitle title="Add product" />
      <ProductForm product={null} categories={(data ?? []) as Category[]} />
    </div>
  );
}
