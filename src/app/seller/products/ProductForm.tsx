'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Category, Product } from '@/lib/types';
import { ErrorNote, Field } from '@/components/ui';
import { ProductImage } from '@/components/ProductCard';
import { deleteProduct, saveProduct } from './actions';

export function ProductForm({ product, categories }: { product: Product | null; categories: Category[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [image, setImage] = useState<string | null>(product?.image_url ?? null);
  const [uploading, setUploading] = useState(false);
  const [pending, start] = useTransition();

  const upload = async (file: File) => {
    if (file.size > 3 * 1024 * 1024) return setError('Photo must be under 3 MB.');
    setUploading(true);
    setError(null);
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${auth.user?.id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('product-images').upload(path, file);
    setUploading(false);
    if (error) return setError('Photo upload failed. Try again.');
    setImage(supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl);
  };

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const num = (k: string) => (String(f.get(k) ?? '').trim() === '' ? null : Number(f.get(k)));
    start(async () => {
      const res = await saveProduct(product?.id ?? null, {
        name: String(f.get('name')),
        category_id: num('category_id'),
        description: String(f.get('description') ?? '') || null,
        pack_info: String(f.get('pack_info') ?? '') || null,
        mrp: num('mrp') ?? 0,
        price: num('price') ?? 0,
        wholesale_price: num('wholesale_price'),
        wholesale_min_qty: num('wholesale_min_qty') ?? 1,
        is_green: f.get('is_green') === 'on',
        in_stock: f.get('in_stock') === 'on',
        active: f.get('active') === 'on',
        image_url: image,
      });
      if (res.error) return setError(res.error);
      router.push('/seller/products');
      router.refresh();
    });
  };

  return (
    <form onSubmit={submit} className="grid max-w-3xl gap-4 rounded-2xl border border-line bg-white p-5 sm:grid-cols-2">
      <div className="flex items-center gap-4 sm:col-span-2">
        <ProductImage src={image} alt="Product photo" className="h-24 w-24 flex-none" />
        <label className="btn-ghost cursor-pointer">
          {uploading ? 'Uploading…' : image ? 'Change photo' : 'Upload photo'}
          <input type="file" accept="image/*" className="sr-only" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        </label>
      </div>
      <div className="sm:col-span-2">
        <Field label="Product name" name="name" defaultValue={product?.name} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="category_id" className="text-sm font-medium">
          Category
        </label>
        <select id="category_id" name="category_id" className="input" defaultValue={product?.category_id ?? ''}>
          <option value="">Choose a category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div />
      <Field label="MRP (₹)" name="mrp" type="number" min={1} step="0.01" defaultValue={product?.mrp} required />
      <Field label="Selling price (₹)" name="price" type="number" min={1} step="0.01" defaultValue={product?.price} required />
      <Field
        label="Wholesale price (₹)"
        name="wholesale_price"
        type="number"
        min={1}
        step="0.01"
        defaultValue={product?.wholesale_price ?? ''}
        hint="Only approved shop owners see this"
      />
      <Field label="Wholesale min. quantity" name="wholesale_min_qty" type="number" min={1} defaultValue={product?.wholesale_min_qty ?? 10} />
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <label htmlFor="pack_info" className="text-sm font-medium">
          Pack contents
        </label>
        <textarea id="pack_info" name="pack_info" rows={3} className="input" defaultValue={product?.pack_info ?? ''} placeholder="10 pieces per box" />
      </div>
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <label htmlFor="description" className="text-sm font-medium">
          Description
        </label>
        <textarea id="description" name="description" rows={3} className="input" defaultValue={product?.description ?? ''} />
      </div>
      <div className="flex flex-wrap gap-5 text-sm sm:col-span-2">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="is_green" className="h-5 w-5 accent-maroon" defaultChecked={product?.is_green ?? false} /> Green cracker
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="in_stock" className="h-5 w-5 accent-maroon" defaultChecked={product?.in_stock ?? true} /> In stock
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="active" className="h-5 w-5 accent-maroon" defaultChecked={product?.active ?? true} /> Listed on the site
        </label>
      </div>
      <div className="sm:col-span-2">
        <ErrorNote msg={error} />
      </div>
      <div className="flex flex-wrap gap-3 sm:col-span-2">
        <button className="btn-primary" disabled={pending || uploading}>
          {pending ? 'Saving…' : 'Save product'}
        </button>
        {product && (
          <button
            type="button"
            className="btn-ghost text-maroon"
            disabled={pending}
            onClick={() => {
              if (!window.confirm('Delete this product?')) return;
              start(async () => {
                const r = await deleteProduct(product.id);
                if (r.error) return setError(r.error);
                router.push('/seller/products');
                router.refresh();
              });
            }}
          >
            Delete
          </button>
        )}
      </div>
    </form>
  );
}
