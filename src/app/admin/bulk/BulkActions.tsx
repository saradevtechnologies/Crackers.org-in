'use client';

import { useState, useTransition } from 'react';
import { ErrorNote, OkNote } from '@/components/ui';
import { ActionButton } from '@/components/ActionButton';
import type { BulkStatus } from '@/lib/types';
import { approveBulk, rejectBulk, resendBulkInvite, setBulkStatus } from '../actions';

const PRESETS = ['Licence copy unclear', 'Licence expired', "GSTIN doesn't match"];

export function BulkActions({ id, status, shop, expired }: { id: string; status: BulkStatus; shop: string; expired: boolean }) {
  const [rejecting, setRejecting] = useState(false);
  const [preset, setPreset] = useState(expired ? 'Licence expired' : PRESETS[0]);
  const [other, setOther] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<{ error?: string; ok?: boolean }>, okMsg: string) =>
    start(async () => {
      setError(null);
      setOk(null);
      const r = await fn();
      if (r.error) setError(r.error);
      else setOk(okMsg);
    });

  const reason = preset === 'other' ? other.trim() : preset;

  return (
    <div className="flex flex-col gap-2 border-t border-line pt-3">
      <div className="flex flex-wrap gap-2">
        {status === 'pending' && (
          <button
            className="btn-green"
            disabled={pending || expired}
            title={expired ? 'Licence has expired' : undefined}
            onClick={() => {
              if (window.confirm(`Approve ${shop}? An invite email to set a password will be sent.`)) run(() => approveBulk(id), 'Approved. Invite sent.');
            }}
          >
            {pending ? 'Working…' : 'Approve'}
          </button>
        )}
        {status === 'renewal_pending' && (
          <ActionButton action={() => setBulkStatus(id, 'approved', 'Licence renewal approved')} label="Approve renewal" className="btn-green" confirm={`Approve the new licence for ${shop}?`} />
        )}
        {(status === 'pending' || status === 'renewal_pending') && !rejecting && (
          <button className="btn-outline" onClick={() => setRejecting(true)} disabled={pending}>
            Reject
          </button>
        )}
        {status === 'approved' && (
          <>
            <button className="btn-ghost" disabled={pending} onClick={() => run(() => resendBulkInvite(id), 'Invite sent again.')}>
              Resend invite
            </button>
            <ActionButton action={(r) => setBulkStatus(id, 'suspended', r)} label="Suspend" className="btn-outline" askReason="Reason (sent to the buyer)" />
          </>
        )}
        {status === 'suspended' && (
          <ActionButton action={() => setBulkStatus(id, 'approved', '')} label="Reactivate" className="btn-green" confirm={`Switch bulk prices back on for ${shop}?`} />
        )}
      </div>

      {rejecting && (
        <div className="flex flex-col gap-2 rounded-xl bg-cream p-3">
          <p className="text-sm font-medium">Reason (sent to the applicant on WhatsApp with a link to apply again)</p>
          <div className="flex flex-wrap gap-2">
            {[...PRESETS, 'other'].map((p) => (
              <label key={p} className={`flex min-h-[40px] cursor-pointer items-center gap-2 rounded-full border px-3 text-sm ${preset === p ? 'border-maroon bg-white' : 'border-line'}`}>
                <input type="radio" name={`reason-${id}`} className="accent-maroon" checked={preset === p} onChange={() => setPreset(p)} />
                {p === 'other' ? 'Other: type reason' : p}
              </label>
            ))}
          </div>
          {preset === 'other' && (
            <input className="input" placeholder="Type the reason" value={other} onChange={(e) => setOther(e.target.value)} autoFocus />
          )}
          <div className="flex gap-2">
            <button
              className="btn-primary"
              disabled={pending || !reason}
              onClick={() =>
                run(async () => {
                  const r = await rejectBulk(id, reason);
                  if (!r.error) setRejecting(false);
                  return r;
                }, 'Rejected. The applicant was told why.')
              }
            >
              Reject application
            </button>
            <button className="btn-ghost" onClick={() => setRejecting(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <ErrorNote msg={error} />
      <OkNote msg={ok} />
    </div>
  );
}
