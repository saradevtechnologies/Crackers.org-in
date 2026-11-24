import { Suspense } from 'react';
import { getBulkMin } from '@/lib/settings';
import { getT } from '@/lib/i18n';
import { inr } from '@/lib/format';
import { ApplyForm } from './ApplyForm';

export const metadata = { title: 'Apply for bulk prices' };

export default async function BulkApplyPage() {
  const t = getT();
  const min = await getBulkMin();
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">{t('bulk.apply.title')}</h1>
        <p className="text-sm text-muted">{t('bulk.apply.sub', { min: inr(min) })}</p>
      </div>
      <Suspense>
        <ApplyForm />
      </Suspense>
    </div>
  );
}
