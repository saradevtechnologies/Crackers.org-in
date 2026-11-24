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
  /** Optional. Stored in product_bulk_prices, which only approved bulk buyers can read. */
  bulk_price: number | null;
  is_green: boolean;
  in_stock: boolean;
  active: boolean;
  image_url: string | null;
}

function validate(p: ProductInput) {
  if (!p.name.trim()) return 'Enter a product name.';
  if (!(p.mrp > 0) || !(p.price > 0)) return 'Enter MRP and selling price.';
  if (p.price > p.mrp) return 'Selling price cannot be more than MRP.';
  if (p.bulk_price !== null && !(p.bulk_price > 0)) return 'Bulk price must be more than 0, or leave it empty.';
  if (p.bulk_price !== null && p.bulk_price > p.price) return 'Bulk price should not be more than the selling price.';
  return null;
}

/** Upsert the bulk price, or delete it when cleared. RLS limits this to the seller's own products. */
async function saveBulkPrice(supabase: ReturnType<typeof createClient>, productId: string, bulk: number | null) {
  const { error } =
    bulk === null
      ? await supabase.from('product_bulk_prices').delete().eq('product_id', productId)
      : await supabase.from('product_bulk_prices').upsert({ product_id: productId, bulk_price: bulk, updated_at: new Date().toISOString() });
  return error ? errMsg(error) : null;
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
  const { bulk_price, ...rest } = input;
  const row = { ...rest, name: input.name.trim() };
  const res = id
    ? await supabase.from('products').update(row).eq('id', id).select('id').single()
    : await supabase.from('products').insert({ ...row, seller_id: sid }).select('id').single();
  if (res.error || !res.data) return { error: errMsg(res.error) };
  const bulkErr = await saveBulkPrice(supabase, res.data.id as string, bulk_price);
  if (bulkErr) return { error: bulkErr };
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
  const { data: inserted, error } = await supabase
    .from('products')
    .insert(rows.map(({ bulk_price: _b, ...r }) => ({ ...r, seller_id: sid })))
    .select('id');
  if (error || !inserted) return { error: errMsg(error) };
  const bulk = inserted
    .map((p, i) => ({ product_id: p.id as string, bulk_price: rows[i]?.bulk_price }))
    .filter((b): b is { product_id: string; bulk_price: number } => b.bulk_price !== null && b.bulk_price !== undefined);
  if (bulk.length) {
    const { error: bErr } = await supabase.from('product_bulk_prices').insert(bulk);
    if (bErr) return { error: `Products added, but bulk prices could not be saved: ${errMsg(bErr)}` };
  }
  revalidatePath('/seller/products');
  return { ok: true, count: rows.length };
}
