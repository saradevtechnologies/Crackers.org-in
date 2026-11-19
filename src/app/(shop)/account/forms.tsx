'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { ErrorNote, Field, OkNote } from '@/components/ui';
import { applyWholesale, updateProfile } from './actions';

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button className="btn-primary" disabled={pending}>
      {pending ? 'Saving…' : label}
    </button>
  );
}

export function ProfileForm({ name, phone }: { name: string; phone: string }) {
  const [state, action] = useFormState(updateProfile, null);
  return (
    <form action={action} className="flex flex-col gap-3">
      <h2 className="font-semibold">Contact details</h2>
      <Field label="Full name" name="name" defaultValue={name} required />
      <Field label="Mobile number (WhatsApp)" name="phone" defaultValue={phone} required inputMode="tel" />
      <ErrorNote msg={state?.error} />
      <OkNote msg={state?.ok} />
      <Submit label="Save" />
    </form>
  );
}

export function WholesaleForm() {
  const [state, action] = useFormState(applyWholesale, null);
  return (
    <form action={action} className="flex flex-col gap-3">
      <p className="text-sm text-[#4A4238]">Shop owners buying in bulk can apply for wholesale prices.</p>
      <Field label="Shop name" name="shop" required />
      <Field label="GSTIN" name="gstin" required maxLength={15} hint="15 characters, e.g. 33ABCDE1234F1Z5" />
      <ErrorNote msg={state?.error} />
      <OkNote msg={state?.ok} />
      <Submit label="Apply for wholesale" />
    </form>
  );
}
