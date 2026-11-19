import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { EstimateCount } from './EstimateCount';
import { Icon } from './ui';

export async function Header() {
  const { profile } = await getSession();
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5 text-navy hover:text-navy">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F3E3C3] text-[10px] font-medium text-gold-dark">
            LOGO
          </span>
          <span className="text-lg font-semibold text-maroon">crackers.org.in</span>
        </Link>
        <form action="/products" className="order-last flex h-11 w-full flex-1 items-center gap-2 rounded-xl border border-line bg-cream px-3 text-muted md:order-none md:w-auto">
          <Icon name="search" />
          <label htmlFor="hq" className="sr-only">
            Search
          </label>
          <input
            id="hq"
            name="q"
            placeholder="Search crackers, gift boxes, shop ID"
            className="h-full flex-1 bg-transparent text-sm text-navy outline-none"
          />
        </form>
        <nav className="ml-auto flex items-center gap-4 text-sm md:ml-0">
          <Link href="/products" className="hidden text-navy sm:inline">
            Shop
          </Link>
          {profile ? (
            <>
              {profile.role === 'admin' && (
                <Link href="/admin" className="text-navy">
                  Admin
                </Link>
              )}
              {profile.role === 'seller' && (
                <Link href="/seller" className="text-navy">
                  Seller panel
                </Link>
              )}
              <Link href="/orders" className="hidden text-navy sm:inline">
                Orders
              </Link>
              <Link href="/account" className="text-navy">
                Account
              </Link>
            </>
          ) : (
            <Link href="/login" className="text-navy">
              Sign in
            </Link>
          )}
          <Link href="/estimate" className="btn-primary min-h-[40px] px-3">
            Estimate <EstimateCount />
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-16 bg-navy text-[#C9D2E3]">
      <div className="mx-auto flex max-w-6xl flex-wrap gap-x-12 gap-y-6 px-4 py-10 text-sm">
        <div className="max-w-xs flex-1">
          <p className="text-base font-semibold text-white">crackers.org.in</p>
          <p className="mt-1">Marketplace for licensed Sivakasi firecracker sellers.</p>
        </div>
        <div className="flex flex-col gap-1.5">
          <Link href="/sell" className="text-[#C9D2E3] hover:text-white">
            Sell on crackers.org.in
          </Link>
          <Link href="/account" className="text-[#C9D2E3] hover:text-white">
            Wholesale accounts
          </Link>
          <Link href="/safety" className="text-[#C9D2E3] hover:text-white">
            Safety guide
          </Link>
        </div>
        <div className="flex flex-col gap-1.5">
          <Link href="/terms" className="text-[#C9D2E3] hover:text-white">
            Terms
          </Link>
          <Link href="/privacy" className="text-[#C9D2E3] hover:text-white">
            Privacy
          </Link>
        </div>
      </div>
    </footer>
  );
}

/** Bottom tab bar on phones, so the PWA feels like an app. */
export function MobileTabs() {
  const tabs = [
    { href: '/', label: 'Home', icon: 'home' as const },
    { href: '/products', label: 'Shop', icon: 'grid' as const },
    { href: '/estimate', label: 'Estimate', icon: 'file' as const },
    { href: '/orders', label: 'Orders', icon: 'box' as const },
    { href: '/account', label: 'Account', icon: 'user' as const },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
      {tabs.map((t) => (
        <Link key={t.href} href={t.href} className="flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[11px] text-[#4A4238]">
          <Icon name={t.icon} size={22} />
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
