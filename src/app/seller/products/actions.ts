'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { errMsg } from '@/lib/format';

export interface ProductInput {
  name: string;
  category_id: number | null;
  description: string | null;
  pack_info: string | null;
  mrp: number;
  price: number;
  wholesale_price: number | null;
  wholesale_min_qty: number;
  is_green: boolean;
  in_stock: boolean;
  active: boolean;
  image_url: string | null;
}

function validate(p: ProductInput) {
  if (!p.name.trim()) return 'Enter a product name.';
  if (!(p.mrp > 0) || !(p.price > 0)) return 'Enter MRP and selling price.';
  if (p.price > p.mrp) return 'Selling price cannot be more than MRP.';
  if (p.wholesale_price !== null && !(p.wholesale_price > 0)) return 'Wholesale price must be more than 0.';
  if (!(p.wholesale_min_qty >= 1)) return 'Wholesale minimum quantity must be at least 1.';
  return null;
}

async function sellerId() {
  const supabase = createClient();
  const { data } = await supabase.rpc('my_seller_id');
  return { supabase, id: data as string | null };
}

export async function saveProduct(id: string | null, input: ProductInput) {
  const bad = validate(input);
  if (bad) return { error: bad };
  const { supabase, id: sid } = await sellerId();
  if (!sid) return { error: 'Your shop is not approved yet.' };
  const row = { ...input, name: input.name.trim() };
  const { error } = id
    ? await supabase.from('products').update(row).eq('id', id)
    : await supabase.from('products').insert({ ...row, seller_id: sid });
  if (error) return { error: errMsg(error) };
  revalidatePath('/seller/products');
  return { ok: true };
}

export async function setProductFlag(id: string, flag: 'in_stock' | 'active', value: boolean) {
  const supabase = createClient();
  const { error } = await supabase.from('products').update({ [flag]: value }).eq('id', id);
  if (error) return { error: errMsg(error) };
  revalidatePath('/seller/products');
  return { ok: true };
}

export async function deleteProduct(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) return { error: errMsg(error) };
  revalidatePath('/seller/products');
  return { ok: true };
}

export async function importProducts(rows: ProductInput[]) {
  const { supabase, id: sid } = await sellerId();
  if (!sid) return { error: 'Your shop is not approved yet.' };
  const problems: string[] = [];
  rows.forEach((r, i) => {
    const bad = validate(r);
    if (bad) problems.push(`Row ${i + 2}: ${bad}`);
  });
  if (problems.length) return { error: problems.slice(0, 8).join(' ') };
  if (rows.length > 1000) return { error: 'Upload at most 1,000 products at a time.' };
  const { error } = await supabase.from('products').insert(rows.map((r) => ({ ...r, seller_id: sid })));
  if (error) return { error: errMsg(error) };
  revalidatePath('/seller/products');
  return { ok: true, count: rows.length };
}
