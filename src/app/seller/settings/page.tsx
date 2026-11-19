import { requireSeller } from '@/lib/auth';
import { PageTitle } from '@/components/ui';
import { SettingsForm } from './SettingsForm';

export default async function SellerSettings() {
  const { seller } = await requireSeller();
  return (
    <div className="max-w-2xl">
      <PageTitle title="Shop settings" sub={`Shop ${seller.shop_id} · ${seller.company_name} · GST ${seller.gst_number}`} />
      <SettingsForm seller={seller} />
    </div>
  );
}
