'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { errMsg } from '@/lib/format';
import { IFSC_RE } from '@/lib/validate';

export async function saveSettings(input: {
  bulkMin: string;
  siteUrl: string;
  bank: { account_name: string; account_number: string; account_number2: string; ifsc: string; bank: string; branch: string };
}) {
  const min = Number(input.bulkMin);
  if (!Number.isInteger(min) || min < 1) return { error: 'Minimum bulk order must be a whole number of rupees, at least 1.' };

  const b = input.bank;
  const any = [b.account_name, b.account_number, b.ifsc, b.bank, b.branch].some(Boolean);
  if (any) {
    if (!b.account_name || !b.account_number || !b.ifsc || !b.bank) return { error: 'Fill in account name, account number, IFSC and bank.' };
    if (!/^\d{6,20}$/.test(b.account_number)) return { error: 'Account number should be 6 to 20 digits.' };
    if (b.account_number !== b.account_number2) return { error: "The two account numbers don't match. Type them again." };
    if (!IFSC_RE.test(b.ifsc)) return { error: 'IFSC is 11 characters, like SBIN0001234 (5th character is zero).' };
  }
  const site = input.siteUrl.replace(/\/$/, '');
  if (site && !/^https?:\/\/[^\s/]+/.test(site)) return { error: 'Site URL must start with https://' };

  const supabase = createClient();
  const rows = [
    { key: 'bulk_min_order', value: min, scope: 'public', updated_at: new Date().toISOString() },
    {
      key: 'bulk_bank_details',
      value: { account_name: b.account_name, account_number: b.account_number, ifsc: b.ifsc, bank: b.bank, branch: b.branch },
      scope: 'bulk',
      updated_at: new Date().toISOString(),
    },
    ...(site ? [{ key: 'site_url', value: site, scope: 'public', updated_at: new Date().toISOString() }] : []),
  ];
  // RLS: only admins can insert/update app_settings.
  const { error } = await supabase.from('app_settings').upsert(rows);
  if (error) return { error: errMsg(error) };
  revalidatePath('/', 'layout');
  return { ok: true };
}
