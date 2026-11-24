'use client';

import Papa from 'papaparse';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import type { Category } from '@/lib/types';
import { inr } from '@/lib/format';
import { ErrorNote, OkNote } from '@/components/ui';
import { importProducts, type ProductInput } from '../actions';

export function CsvImport({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<ProductInput[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const bySlug = new Map(categories.flatMap((c) => [[c.slug, c.id], [c.name.toLowerCase(), c.id]] as [string, number][]));
  const yes = (v: unknown) => ['yes', 'y', 'true', '1'].includes(String(v ?? '').trim().toLowerCase());
  const num = (v: unknown) => {
    const s = String(v ?? '').replace(/[₹,\s]/g, '');
    return s === '' ? null : Number(s);
  };

  const parse = (file: File) => {
    setError(null);
    setOk(null);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, '_'),
      complete: (res) => {
        const out = res.data.map((r) => ({
          name: String(r.name ?? '').trim(),
          category_id: bySlug.get(String(r.category ?? '').trim().toLowerCase()) ?? null,
          mrp: num(r.mrp) ?? 0,
          price: num(r.price) ?? 0,
          // "wholesale_price" is still accepted from old price lists
          bulk_price: num(r.bulk_price ?? r.wholesale_price),
          pack_info: r.pack_info?.trim() || null,
          description: r.description?.trim() || null,
          is_green: yes(r.is_green),
          in_stock: true,
          active: true,
          image_url: null,
        }));
        if (!out.length) return setError('No rows found. Check that the first row has the column names.');
        setRows(out);
      },
      error: () => setError('Could not read that file. Save it as CSV and try again.'),
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-dashed border-[#B9A57E] bg-white p-8 text-center text-sm">
        <span className="font-medium">Choose CSV file</span>
        <span className="text-muted">Columns: name, category, mrp, price, bulk_price, pack_info, description, is_green</span>
        <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => e.target.files?.[0] && parse(e.target.files[0])} />
      </label>
      <ErrorNote msg={error} />
      <OkNote msg={ok} />
      {rows.length > 0 && (
        <>
          <div className="table-wrap max-h-[420px]">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>MRP</th>
                  <th>Price</th>
                  <th>Bulk price</th>
                  <th>Green</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td>{r.name || <span className="text-maroon">Missing</span>}</td>
                    <td>{categories.find((c) => c.id === r.category_id)?.name ?? <span className="text-muted">None</span>}</td>
                    <td>{inr(r.mrp)}</td>
                    <td className={r.price > r.mrp ? 'text-maroon' : ''}>{inr(r.price)}</td>
                    <td>{r.bulk_price ? inr(r.bulk_price) : '—'}</td>
                    <td>{r.is_green ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            className="btn-primary self-start"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const res = await importProducts(rows);
                if (res.error) return setError(res.error);
                setRows([]);
                setOk(`${res.count} products added. Add photos from the Products page.`);
                router.refresh();
              })
            }
          >
            {pending ? 'Importing…' : `Import ${rows.length} products`}
          </button>
        </>
      )}
    </div>
  );
}
