import Link from 'next/link';
import { getBulkAccount } from '@/lib/auth';
import { pausedReason } from '@/lib/bulk';
import { getT } from '@/lib/i18n';

/** Shown on every shop page when a bulk buyer's bulk prices are switched off (suspended / expired / renewal). */
export async function BulkPausedBanner() {
  const { profile, bulk, bulkActive } = await getBulkAccount();
  if (profile?.account_type !== 'bulk' || bulkActive) return null;
  const reason = pausedReason(bulk);
  if (!reason) return null;
  const t = getT();
  const canRenew = reason === 'bulk.reason.expired' || reason === 'bulk.reason.rejected';
  return (
    <div role="status" className="bg-gold-light text-gold-text">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm">
        <p>
          <span aria-hidden="true">⚠️ </span>
          {t('bulk.paused', { reason: t(reason) })}
          {bulk?.admin_note && reason !== 'bulk.reason.expired' ? ` (${bulk.admin_note})` : ''}
        </p>
        {canRenew && (
          <Link href="/account#bulk" className="font-semibold text-maroon">
            {t('bulk.acct.renew')} →
          </Link>
        )}
      </div>
    </div>
  );
}
