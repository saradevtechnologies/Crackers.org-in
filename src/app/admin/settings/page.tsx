import { requireAdmin } from '@/lib/auth';
import { PageTitle } from '@/components/ui';
import { DEFAULT_BULK_MIN, type BankDetails } from '@/lib/settings';
import { SettingsForm } from './SettingsForm';

export const metadata = { title: 'Settings' };

export default async function AdminSettings() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from('app_settings').select('key, value');
  const get = (k: string) => data?.find((r) => r.key === k)?.value;
  return (
    <div className="max-w-2xl">
      <PageTitle title="Settings" sub="Bulk order rules and the bank account bulk buyers pay into." />
      <SettingsForm
        bulkMin={Number(get('bulk_min_order')) || DEFAULT_BULK_MIN}
        bank={(get('bulk_bank_details') as BankDetails | undefined) ?? { account_name: '', account_number: '', ifsc: '', bank: '', branch: '' }}
        siteUrl={String(get('site_url') ?? '')}
      />
    </div>
  );
}
