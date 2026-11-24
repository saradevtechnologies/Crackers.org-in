import { getBulkAccount, requireUser } from '@/lib/auth';
import { CheckoutForm } from './CheckoutForm';

export const metadata = { title: 'Checkout' };

export default async function CheckoutPage() {
  const { supabase, user, profile } = await requireUser('/checkout');
  const { bulk, bulkActive } = await getBulkAccount();
  const [{ data: areas }, { data: last }] = await Promise.all([
    supabase.from('blocked_areas').select('kind, value'),
    supabase
      .from('orders')
      .select('ship_name, ship_phone, ship_address, ship_city, ship_state, ship_pincode')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  return (
    <CheckoutForm
      blocked={areas ?? []}
      bulk={
        bulkActive && bulk
          ? {
              gstin: bulk.gstin,
              shopName: bulk.shop_name,
              // Bulk orders: prefill from the application (editable)
              ship: {
                name: bulk.shop_name,
                phone: bulk.phone,
                address: bulk.address,
                city: bulk.city,
                state: bulk.state,
                pincode: bulk.pincode,
              },
            }
          : null
      }
      defaults={{
        name: last?.ship_name ?? profile.full_name ?? '',
        phone: profile.phone || (user.phone ? `+${user.phone.replace(/\D/g, '')}` : '') || last?.ship_phone || '',
        address: last?.ship_address ?? '',
        city: last?.ship_city ?? '',
        state: last?.ship_state ?? 'Tamil Nadu',
        pincode: last?.ship_pincode ?? '',
      }}
    />
  );
}
