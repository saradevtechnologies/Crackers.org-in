import { requireUser } from '@/lib/auth';
import { CheckoutForm } from './CheckoutForm';

export const metadata = { title: 'Checkout' };

export default async function CheckoutPage() {
  const { supabase, profile } = await requireUser('/checkout');
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
      canWholesale={profile.wholesale === 'approved'}
      defaults={{
        name: last?.ship_name ?? profile.full_name ?? '',
        phone: last?.ship_phone ?? profile.phone ?? '',
        address: last?.ship_address ?? '',
        city: last?.ship_city ?? '',
        state: last?.ship_state ?? 'Tamil Nadu',
        pincode: last?.ship_pincode ?? '',
      }}
    />
  );
}
