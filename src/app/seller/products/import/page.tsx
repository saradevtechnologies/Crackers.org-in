import { requireSeller } from '@/lib/auth';
import type { Category } from '@/lib/types';
import { PageTitle } from '@/components/ui';
import { CsvImport } from './CsvImport';

export default async function ImportPage() {
  const { supabase } = await requireSeller();
  const { data } = await supabase.from('categories').select('*').order('sort');
  return (
    <div className="max-w-3xl">
      <PageTitle
        title="Upload your price list"
        sub="Save your Excel price list as CSV (File → Save as → CSV) and upload it here."
        action={
          <a href="/seller/products/import/template" className="btn-ghost">
            Download template
          </a>
        }
      />
      <CsvImport categories={(data ?? []) as Category[]} />
    </div>
  );
}
