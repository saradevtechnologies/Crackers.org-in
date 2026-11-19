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
  wholesale: boolean,
): Promise<{ orderId?: string; error?: string }> {
  const supabase = createClient();
  const phone = ship.phone.replace(/[\s-]/g, '');
  const { data, error } = await supabase.rpc('place_order', {
    p_items: items,
    p_ship: { ...ship, phone },
    p_wholesale: wholesale,
  });
  if (error) return { error: errMsg(error) };
  // Remember contact details on the profile for next time
  const { data: auth } = await supabase.auth.getUser();
  if (auth.user) await supabase.from('profiles').update({ full_name: ship.name, phone }).eq('id', auth.user.id);
  return { orderId: data as string };
}
