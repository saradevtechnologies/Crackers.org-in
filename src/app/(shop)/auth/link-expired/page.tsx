import Link from 'next/link';
import { getT } from '@/lib/i18n';

export const metadata = { title: 'Link expired' };

export default function LinkExpiredPage() {
  const t = getT();
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-4 rounded-2xl border border-line bg-white p-8 text-center shadow-soft">
      <span aria-hidden="true" className="text-5xl">
        ⌛
      </span>
      <h1 className="text-2xl font-semibold">{t('expired.title')}</h1>
      <p className="text-sm text-muted">{t('expired.body')}</p>
      <Link href="/forgot-password" className="btn-primary min-h-[48px] w-full">
        {t('expired.cta')}
      </Link>
      {process.env.NEXT_PUBLIC_SUPPORT_PHONE && (
        <a href={`tel:${process.env.NEXT_PUBLIC_SUPPORT_PHONE}`} className="text-sm">
          📞 {process.env.NEXT_PUBLIC_SUPPORT_PHONE}
        </a>
      )}
    </div>
  );
}
