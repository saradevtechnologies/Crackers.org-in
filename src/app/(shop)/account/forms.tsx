'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { ErrorNote, Field, OkNote } from '@/components/ui';
import { updateProfile } from './actions';

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button className="btn-primary" disabled={pending}>
      {pending ? 'Saving…' : label}
    </button>
  );
}

export function ProfileForm({ name, phone, phoneNote }: { name: string; phone: string; phoneNote: string }) {
  const [state, action] = useFormState(updateProfile, null);
  return (
    <form action={action} className="flex flex-col gap-3">
      <h2 className="font-semibold">Contact details</h2>
      <Field label="Full name" name="name" defaultValue={name} required autoComplete="name" />
      <Field label="Mobile number" name="phone" value={phone} readOnly disabled hint={phoneNote} />
      <ErrorNote msg={state?.error} />
      <OkNote msg={state?.ok} />
      <Submit label="Save" />
    </form>
  );
}
