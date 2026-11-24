'use server';

import { createClient } from '@/lib/supabase/server';
import { errMsg } from '@/lib/format';

export interface ShipInput {
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export async function placeOrder(
  items: { product_id: string; qty: number }[],
  ship: ShipInput,
  orderType: 'retail' | 'bulk',
): Promise<{ orderId?: string; error?: string }> {
  const supabase = createClient();
  const phone = ship.phone.replace(/[\s-]/g, '');
  const { data, error } = await supabase.rpc('place_order', {
    p_items: items,
    p_ship: { ...ship, phone },
    p_order_type: orderType,
  });
  if (error) return { error: errMsg(error) };
  // Remember the name for next time (the phone is the login, so it is never overwritten here)
  const { data: auth } = await supabase.auth.getUser();
  if (auth.user) await supabase.from('profiles').update({ full_name: ship.name }).eq('id', auth.user.id).is('full_name', null);
  return { orderId: data as string };
}
