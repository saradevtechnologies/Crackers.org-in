import Link from 'next/link';
import { getBulkMin } from '@/lib/settings';
import { getT } from '@/lib/i18n';
import { inr } from '@/lib/format';
import { safeNext } from '@/lib/safe-next';

export const metadata = { title: 'Create your account' };

export default async function SignupPage({ searchParams }: { searchParams: { next?: string } }) {
  const t = getT();
  const next = safeNext(searchParams.next);
  const min = await getBulkMin();
  const cards = [
    { href: `/login?next=${encodeURIComponent(next)}`, emoji: '🏠', title: t('signup.homeTitle'), sub: t('signup.homeSub') },
    { href: '/bulk/apply', emoji: '🏪', title: t('signup.shopTitle', { min: inr(min) }), sub: t('signup.shopSub') },
  ];
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <h1 className="text-2xl font-semibold">{t('signup.title')}</h1>
      <div className="stagger grid gap-4 sm:grid-cols-2">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="card-hover group flex min-h-[160px] flex-col gap-2 rounded-2xl border border-line bg-white p-5 text-navy shadow-soft hover:border-gold hover:text-navy"
          >
            <span aria-hidden="true" className="text-4xl transition-transform duration-300 group-hover:scale-110">
              {c.emoji}
            </span>
            <span className="text-lg font-semibold leading-snug">{c.title}</span>
            <span className="text-sm text-muted">{c.sub}</span>
            <span aria-hidden="true" className="mt-auto self-end text-maroon transition-transform group-hover:translate-x-1">
              →
            </span>
          </Link>
        ))}
      </div>
      <p className="text-center text-sm text-muted">
        {t('signup.haveAccount')} <Link href={`/login?next=${encodeURIComponent(next)}`}>{t('signup.signIn')}</Link>
      </p>
    </div>
  );
}
