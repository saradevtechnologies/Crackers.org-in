'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ErrorNote, Field } from '@/components/ui';

export function SellerRegisterForm({ email }: { email: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const f = new FormData(e.currentTarget);
    const gst = String(f.get('gst')).trim().toUpperCase();
    if (!/^[0-9]{2}[A-Z0-9]{13}$/.test(gst)) return setError('Enter a valid 15-character GST number.');
    const phone = String(f.get('phone')).replace(/[\s-]/g, '');
    if (!/^\+?\d{10,13}$/.test(phone)) return setError('Enter a valid contact number.');
    const file = f.get('licence') as File | null;
    if (!file || !file.size) return setError('Upload a copy of your explosives licence.');
    if (file.size > 8 * 1024 * 1024) return setError('Licence file must be under 8 MB.');

    setPending(true);
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf';
    const path = `${auth.user?.id}/licence-${Date.now()}.${ext}`;
    const up = await supabase.storage.from('licences').upload(path, file);
    if (up.error) {
      setPending(false);
      return setError('Could not upload the licence. Try again.');
    }
    const { error } = await supabase.rpc('register_seller', {
      p_company_name: String(f.get('company')).trim(),
      p_gst_number: gst,
      p_contact_phone: phone,
      p_email: String(f.get('email')).trim(),
      p_address: String(f.get('address')).trim(),
      p_licence_number: String(f.get('licence_no')).trim(),
      p_licence_path: path,
      p_licence_expiry: String(f.get('expiry')) || null,
    });
    setPending(false);
    if (error) return setError(error.message);
    router.replace('/seller?registered=1');
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-2xl border border-line bg-white p-5 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Field label="Company or shop name" name="company" required />
      </div>
      <Field label="GST number" name="gst" required maxLength={15} />
      <Field label="Contact number" name="phone" required inputMode="tel" />
      <div className="sm:col-span-2">
        <Field label="Email" name="email" type="email" defaultValue={email} required />
      </div>
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <label htmlFor="address" className="text-sm font-medium">
          Factory / godown address
        </label>
        <textarea id="address" name="address" rows={2} className="input" required />
      </div>
      <Field label="Explosives licence number (PESO)" name="licence_no" required />
      <Field label="Licence valid until" name="expiry" type="date" required />
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <label htmlFor="licence" className="text-sm font-medium">
          Licence copy (PDF or photo)
        </label>
        <input id="licence" name="licence" type="file" accept=".pdf,image/*" required className="text-sm" />
      </div>
      <p className="text-xs text-muted sm:col-span-2">
        Customers only see your 5-digit Shop ID. Your business and contact details stay private.
      </p>
      <div className="sm:col-span-2">
        <ErrorNote msg={error} />
      </div>
      <button className="btn-primary sm:col-span-2" disabled={pending}>
        {pending ? 'Submitting…' : 'Submit for verification'}
      </button>
    </form>
  );
}
